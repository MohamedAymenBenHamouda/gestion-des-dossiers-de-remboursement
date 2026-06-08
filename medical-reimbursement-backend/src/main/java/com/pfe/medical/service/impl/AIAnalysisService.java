package com.pfe.medical.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pfe.medical.entity.DocumentMedical;
import com.pfe.medical.enums.AIValidationStatus;
import com.pfe.medical.enums.DocumentType;
import com.pfe.medical.enums.DocumentWorkflowStatus;
import com.pfe.medical.repository.DocumentMedicalRepository;
import com.pfe.medical.repository.DossierMedicalRepository;
import com.pfe.medical.entity.DossierMedical;
import com.pfe.medical.enums.DossierStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;

import org.springframework.transaction.annotation.Transactional;

@Transactional
@Service
@RequiredArgsConstructor
@Slf4j
public class AIAnalysisService {

    private final DocumentMedicalRepository documentRepository;
    private final DossierMedicalRepository dossierRepository;
    private final ObjectMapper objectMapper;

    @Value("${ai.service.url:http://localhost:8001}")
    private String aiServiceUrl;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Async
    public void analyserDocument(Long documentId) {
        DocumentMedical doc = documentRepository.findById(documentId).orElse(null);
        if (doc == null) {
            log.error("Analyse IA annulée : Document #{} non trouvé (problème de synchronisation de transaction ?)",
                    documentId);
            return;
        }

        log.info("Analyse IA démarrée — doc #{} ({})", documentId, doc.getType());

        try {
            Path filePath = Paths.get(uploadDir, doc.getCheminFichier());
            if (!Files.exists(filePath))
                throw new Exception("Fichier introuvable : " + filePath);
            byte[] imageBytes = Files.readAllBytes(filePath);

            JsonNode result = callPythonService(imageBytes, doc);

            boolean estValide = result.path("est_valide").asBoolean(false);
            double score = result.path("score_confiance").asDouble(0.0);
            String rapport = result.path("rapport").asText("");

            boolean besoinVerification = result.path("besoin_verification").asBoolean(false);
            JsonNode anomalies = result.path("anomalies");

            // ✅ Montants imbriqués dans result["remboursement"] (structure Python)
            JsonNode remboursementNode = result.path("remboursement");
            BigDecimal montantFacture = parseMontant(remboursementNode.path("montant_facture").asText(null));
            BigDecimal montantRembourse = parseMontant(remboursementNode.path("montant_rembourse").asText(null));

            // Fallback : lire le TTC depuis facture.montant_ttc si remboursement vide
            if (montantFacture == null || montantFacture.compareTo(BigDecimal.ZERO) == 0) {
                montantFacture = parseMontant(result.path("facture").path("montant_ttc").asText(null));
            }

            // Sauvegarder le JSON complet de l'analyse pour l'affichage Angular
            // Si le dossier est de type ALD, forcer la prise en charge 100% côté backend
            try {
                if (doc.getDossier() != null && doc.getDossier().getTypeSoin() != null
                        && "ALD".equalsIgnoreCase(doc.getDossier().getTypeSoin().name())) {
                    // override montantRembourse
                    if (montantFacture != null) montantRembourse = montantFacture;
                    // Mettre à jour le JSON renvoyé pour affichage front
                    if (result.isObject()) {
                        ObjectNode root = (ObjectNode) result;
                        ObjectNode remb = root.with("remboursement");
                        remb.put("montant_rembourse", montantRembourse != null ? montantRembourse.toString() : "0");
                        remb.put("taux_applique", 1.0);
                        remb.put("ald", true);
                    }
                }
            } catch (Exception e) {
                log.debug("Impossible d'appliquer override ALD pour doc {}: {}", doc.getId(), e.getMessage());
            }

            String analyseJson = objectMapper.writeValueAsString(result);

            doc.setStatutIA(estValide ? AIValidationStatus.VALIDE : AIValidationStatus.INVALIDE);
            doc.setScoreConfidenceIA(score);
            doc.setMontantDetecteIA(montantFacture);
            doc.setMontantRembourseIA(montantRembourse);
            doc.setResultatIA(rapport);
            doc.setAnalyseIAJson(analyseJson);
            doc.setAnalyseAt(LocalDateTime.now());
            doc.setWorkflowStatus(DocumentWorkflowStatus.ANALYSED);

            // Gérer le type détecté par l'IA
            String typeDetecteStr = result.path("type_detecte").asText(null);
            if (typeDetecteStr != null) {
                try {
                    doc.setTypeDetecteIA(DocumentType.valueOf(typeDetecteStr));
                } catch (IllegalArgumentException e) {
                    log.warn("Type détecté inconnu : {}", typeDetecteStr);
                }
            }

            documentRepository.save(doc);

            boolean aDesAnomalies = anomalies != null && anomalies.isArray() && anomalies.size() > 0;
            if (besoinVerification || aDesAnomalies) {
                DossierMedical dossier = doc.getDossier();
                if (dossier != null) {
                    dossier.setStatut(DossierStatus.A_VERIFIER);
                    dossierRepository.save(dossier);
                    log.warn("Dossier #{} marqué A_VERIFIER. besoinVerification={}, aDesAnomalies={}",
                            dossier.getId(), besoinVerification, aDesAnomalies);
                }
            }

            log.info("Analyse terminée — doc #{}: valide={} | ttc={} TND | rembourse={} TND",
                    documentId, estValide, montantFacture, montantRembourse);

        } catch (Exception e) {
            log.error("Erreur analyse doc #{}: {}", documentId, e.getMessage());
            doc.setStatutIA(AIValidationStatus.ERREUR);
            doc.setResultatIA("Erreur analyse IA : " + e.getMessage()
                    + "\n→ Vérifiez que le microservice Python tourne sur " + aiServiceUrl);
            documentRepository.save(doc);
        }
    }

    private JsonNode callPythonService(byte[] imageBytes, DocumentMedical doc) throws Exception {
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("fichier", new ByteArrayResource(imageBytes) {
            @Override
            public String getFilename() {
                return doc.getNomFichier() != null ? doc.getNomFichier() : "document.jpg";
            }
        });
        body.add("type_document", doc.getType().name());
        
        // Transmettre le nom du patient attendu
        String patientAttendu = "";
        try {
            if (doc.getDossier() != null) {
                if (doc.getDossier().getBeneficiary() != null) {
                    patientAttendu = doc.getDossier().getBeneficiary().getPrenom() + " " + doc.getDossier().getBeneficiary().getNom();
                } else if (doc.getDossier().getAssure() != null) {
                    patientAttendu = doc.getDossier().getAssure().getPrenom() + " " + doc.getDossier().getAssure().getNom();
                }
            }
        } catch (Exception e) {
            log.debug("Impossible d'obtenir le patient pour doc {}: {}", doc.getId(), e.getMessage());
        }
        body.add("patient_attendu", patientAttendu);

        // Transmettre un flag si le dossier est marqué ALD (maladie chronique)
        try {
            if (doc.getDossier() != null && doc.getDossier().getTypeSoin() != null
                    && "ALD".equalsIgnoreCase(doc.getDossier().getTypeSoin().name())) {
                body.add("dossier_ald", "true");
            }
        } catch (Exception e) {
            // safe: ne pas bloquer l'analyse si récupération dossier échoue
            log.debug("Impossible de déterminer typeSoin dossier pour doc {}: {}", doc.getId(), e.getMessage());
        }

        try {
            ResponseEntity<String> resp = restTemplate.exchange(
                    aiServiceUrl + "/analyser",
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    String.class);
            return objectMapper.readTree(resp.getBody());
        } catch (Exception e) {
            throw new Exception("Service Python inaccessible — démarrez : python analyse_service.py");
        }
    }

    private BigDecimal parseMontant(String val) {
        if (val == null || val.equals("null") || val.isBlank())
            return null;
        try {
            double d = Double.parseDouble(val);
            return d > 0 ? BigDecimal.valueOf(d).setScale(3, RoundingMode.HALF_UP) : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public BigDecimal calculerRemboursementTotal(Long dossierId) {
        return documentRepository.findByDossierId(dossierId).stream()
                .filter(d -> d.getStatutIA() == AIValidationStatus.VALIDE
                        && d.getMontantRembourseIA() != null)
                .map(DocumentMedical::getMontantRembourseIA)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal calculerMontantTotal(Long dossierId) {
        return documentRepository.findByDossierId(dossierId).stream()
                .filter(d -> d.getStatutIA() == AIValidationStatus.VALIDE
                        && d.getMontantDetecteIA() != null)
                .map(DocumentMedical::getMontantDetecteIA)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
