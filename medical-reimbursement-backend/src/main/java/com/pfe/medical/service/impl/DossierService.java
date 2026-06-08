package com.pfe.medical.service.impl;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pfe.medical.dto.request.AgentValidationRequest;
import com.pfe.medical.dto.request.DossierRequest;
import com.pfe.medical.dto.response.AnalyseIAResult;
import com.pfe.medical.dto.response.DocumentResponse;
import com.pfe.medical.dto.response.DossierResponse;
import com.pfe.medical.dto.response.UserResponse;
import com.pfe.medical.entity.DocumentMedical;
import com.pfe.medical.entity.DossierMedical;
import com.pfe.medical.entity.HistoriqueAction;
import com.pfe.medical.entity.User;
import com.pfe.medical.enums.AIValidationStatus;
import com.pfe.medical.enums.DocumentType;
import com.pfe.medical.enums.DossierStatus;
import com.pfe.medical.exception.BusinessException;
import com.pfe.medical.exception.ResourceNotFoundException;
import com.pfe.medical.repository.DocumentMedicalRepository;
import com.pfe.medical.repository.DossierMedicalRepository;
import com.pfe.medical.repository.HistoriqueActionRepository;
import com.pfe.medical.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class DossierService {

    private final DossierMedicalRepository dossierRepository;
    private final DocumentMedicalRepository documentRepository;
    private final HistoriqueActionRepository historiqueRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final AIAnalysisService aiAnalysisService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    // =============================================
    // ASSURÉ: Créer un dossier
    // =============================================
    public DossierResponse creerDossier(DossierRequest request, Long assureId) {
        User assure = userRepository.findById(assureId)
                .orElseThrow(() -> new ResourceNotFoundException("Assuré", assureId));

        DossierMedical.DossierMedicalBuilder builder = DossierMedical.builder()
            .description(request.getDescription())
            .motif(request.getMotif())
            .typeSoin(request.getTypeSoin())
            .assure(assure)
            .statut(DossierStatus.BROUILLON);

        // beneficiary optional
        if (request.getBeneficiaryId() != null) {
            com.pfe.medical.entity.FamilyMember fm =
                new com.pfe.medical.entity.FamilyMember();
            fm.setId(request.getBeneficiaryId());
            builder.beneficiary(fm);
        }

        DossierMedical dossier = builder.build();

        dossier = dossierRepository.save(dossier);
        enregistrerHistorique(dossier, assure, "CREATION", "Dossier créé par l'assuré", null, "BROUILLON");
        return mapToDossierResponse(dossier);
    }

    // =============================================
    // ASSURÉ: Mettre à jour un dossier
    // =============================================
    public DossierResponse updateDossier(Long dossierId, DossierRequest request, Long assureId) {
        DossierMedical dossier = getDossierById(dossierId);

        if (!dossier.getAssure().getId().equals(assureId)) {
            throw new BusinessException("Accès non autorisé à ce dossier.");
        }

        if (dossier.getStatut() != DossierStatus.BROUILLON && dossier.getStatut() != DossierStatus.INCOMPLET) {
            throw new BusinessException("Impossible de modifier un dossier " + dossier.getStatut());
        }

        if (request.getDescription() != null) {
            dossier.setDescription(request.getDescription());
        }
        if (request.getMotif() != null) {
            dossier.setMotif(request.getMotif());
        }
        if (request.getTypeSoin() != null) {
            dossier.setTypeSoin(request.getTypeSoin());
        }
        if (request.getBeneficiaryId() != null) {
            com.pfe.medical.entity.FamilyMember fm =
                    new com.pfe.medical.entity.FamilyMember();
            fm.setId(request.getBeneficiaryId());
            dossier.setBeneficiary(fm);
        }

        dossier = dossierRepository.save(dossier);
        return mapToDossierResponse(dossier);
    }

    // =============================================
    // ASSURÉ: Uploader un document médical
    // =============================================
    public DocumentResponse ajouterDocument(Long dossierId, MultipartFile fichier,
            DocumentType type, Long assureId) {
        DossierMedical dossier = getDossierById(dossierId);

        if (!dossier.getAssure().getId().equals(assureId)) {
            throw new BusinessException("Accès non autorisé à ce dossier.");
        }

        if (dossier.getStatut() == DossierStatus.APPROUVE || dossier.getStatut() == DossierStatus.REJETE) {
            throw new BusinessException("Impossible d'ajouter des documents à un dossier " + dossier.getStatut());
        }

        String chemin = fileStorageService.stocker(fichier, "dossiers/" + dossierId);

        DocumentMedical document = DocumentMedical.builder()
                .dossier(dossier)
                .type(type)
                .nomFichier(fichier.getOriginalFilename())
                .cheminFichier(chemin)
                .contentType(fichier.getContentType())
                .tailleFichier(fichier.getSize())
                .statutIA(AIValidationStatus.EN_ATTENTE)
                .build();

        document = documentRepository.save(document);

        // Lancer l'analyse IA en arrière-plan SEULEMENT après le commit de la
        // transaction
        final Long documentId = document.getId();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                aiAnalysisService.analyserDocument(documentId);
            }
        });

        enregistrerHistorique(dossier, dossier.getAssure(), "DOCUMENT_AJOUTE",
                "Document ajouté: " + type.name() + " - " + fichier.getOriginalFilename(), null, null);

        return mapToDocumentResponse(document);
    }

    // =============================================
    // ASSURÉ: Soumettre le dossier
    // =============================================
    public DossierResponse soumettreDossier(Long dossierId, Long assureId) {
        DossierMedical dossier = getDossierById(dossierId);

        if (!dossier.getAssure().getId().equals(assureId)) {
            throw new BusinessException("Accès non autorisé à ce dossier.");
        }

        if (dossier.getStatut() != DossierStatus.BROUILLON && dossier.getStatut() != DossierStatus.INCOMPLET) {
            throw new BusinessException("Le dossier ne peut pas être soumis depuis l'état: " + dossier.getStatut());
        }

        if (dossier.getDocuments().isEmpty()) {
            throw new BusinessException("Vous devez ajouter au moins un document avant de soumettre.");
        }

        // Attendre que l'IA ait analysé tous les documents (ou forcer le statut SOUMIS)
        String ancienStatut = dossier.getStatut().name();
        dossier.setStatut(DossierStatus.SOUMIS);
        dossier.setDateSoumission(LocalDateTime.now());
        dossier.setMessageAgent(null);
        dossierRepository.save(dossier);

        enregistrerHistorique(dossier, dossier.getAssure(), "SOUMISSION",
                "Dossier soumis pour validation", ancienStatut, "SOUMIS");

        // Notifier les agents
        notifierAgentsNouveauDossier(dossier);

        return mapToDossierResponse(dossier);
    }

    // =============================================
    // AGENT: Récupérer les dossiers soumis
    // =============================================
    @Transactional(readOnly = true)
    public Page<DossierResponse> getDossiersSoumis(Pageable pageable) {
        return dossierRepository.findByStatut(DossierStatus.SOUMIS, pageable)
                .map(this::mapToDossierResponse);
    }

    // =============================================
    // AGENT: Prendre en charge un dossier
    // =============================================
    public DossierResponse prendreEnCharge(Long dossierId, Long agentId) {
        DossierMedical dossier = getDossierById(dossierId);
        User agent = userRepository.findById(agentId)
                .orElseThrow(() -> new ResourceNotFoundException("Agent", agentId));

        if (dossier.getStatut() != DossierStatus.SOUMIS) {
            throw new BusinessException("Le dossier doit être dans l'état SOUMIS.");
        }

        dossier.setAgent(agent);
        dossier.setStatut(DossierStatus.EN_COURS);
        dossierRepository.save(dossier);

        enregistrerHistorique(dossier, agent, "PRISE_EN_CHARGE",
                "Dossier pris en charge par l'agent " + agent.getPrenom() + " " + agent.getNom(),
                "SOUMIS", "EN_COURS");

        // Notifier l'assuré
        notificationService.creerNotification(
                dossier.getAssure(),
                "Dossier en cours de traitement",
                "Votre dossier " + dossier.getNumeroDossier() + " est maintenant en cours de traitement.",
                "INFO",
                dossier.getId());

        return mapToDossierResponse(dossier);
    }

    // =============================================
    // AGENT: Valider ou rejeter un dossier
    // =============================================
    public DossierResponse validerDossier(Long dossierId, AgentValidationRequest request, Long agentId) {
        DossierMedical dossier = getDossierById(dossierId);
        User agent = userRepository.findById(agentId)
                .orElseThrow(() -> new ResourceNotFoundException("Agent", agentId));

        if (dossier.getStatut() != DossierStatus.EN_COURS) {
            throw new BusinessException("Le dossier doit être EN_COURS pour être validé.");
        }

        String ancienStatut = dossier.getStatut().name();

        if (request.isApprouve()) {
            // Approbation
            BigDecimal montantIA = aiAnalysisService.calculerRemboursementTotal(dossierId);
            BigDecimal montantTotal = aiAnalysisService.calculerMontantTotal(dossierId);

            dossier.setStatut(DossierStatus.APPROUVE);
            dossier.setMontantTotal(montantTotal);
            dossier.setMontantCalculeIA(montantIA);
            // L'agent peut ajuster le montant
            dossier.setMontantRembourse(
                    request.getMontantRembourse() != null ? request.getMontantRembourse() : montantIA);
            dossier.setDateValidation(LocalDateTime.now());

            notificationService.creerNotification(
                    dossier.getAssure(),
                    "🎉 Dossier approuvé!",
                    "Votre dossier " + dossier.getNumeroDossier() + " a été approuvé. " +
                            "Montant remboursé: " + dossier.getMontantRembourse() + " TND",
                    "SUCCESS",
                    dossier.getId());

            notificationService.envoyerEmail(
                    dossier.getAssure().getEmail(),
                    "Dossier de remboursement approuvé - " + dossier.getNumeroDossier(),
                    "Bonjour " + dossier.getAssure().getPrenom() + ",\n\n" +
                            "Votre dossier " + dossier.getNumeroDossier() + " a été approuvé.\n" +
                            "Montant remboursé: " + dossier.getMontantRembourse() + " TND\n\n" +
                            "Cordialement,\nL'équipe de gestion");

        } else if (request.getMessageCompletion() != null && !request.getMessageCompletion().isEmpty()) {
            // Dossier incomplet
            dossier.setStatut(DossierStatus.INCOMPLET);
            dossier.setMessageAgent(request.getMessageCompletion());

            notificationService.creerNotification(
                    dossier.getAssure(),
                    "⚠️ Dossier incomplet",
                    "Votre dossier " + dossier.getNumeroDossier() + " nécessite des compléments. " +
                            "Message de l'agent: " + request.getMessageCompletion(),
                    "WARNING",
                    dossier.getId());

            notificationService.envoyerEmail(
                    dossier.getAssure().getEmail(),
                    "Dossier incomplet - " + dossier.getNumeroDossier(),
                    "Bonjour " + dossier.getAssure().getPrenom() + ",\n\n" +
                            "Votre dossier " + dossier.getNumeroDossier() + " est incomplet.\n" +
                            "Message de l'agent: " + request.getMessageCompletion() + "\n\n" +
                            "Veuillez le compléter dans votre espace personnel.\n\n" +
                            "Cordialement,\nL'équipe de gestion");

        } else {
            // Rejet
            dossier.setStatut(DossierStatus.REJETE);
            dossier.setNoteRejet(request.getNote());
            dossier.setDateValidation(LocalDateTime.now());

            notificationService.creerNotification(
                    dossier.getAssure(),
                    "❌ Dossier rejeté",
                    "Votre dossier " + dossier.getNumeroDossier() + " a été rejeté. " +
                            (request.getNote() != null ? "Motif: " + request.getNote() : ""),
                    "ERROR",
                    dossier.getId());
        }

        dossierRepository.save(dossier);
        enregistrerHistorique(dossier, agent, "VALIDATION",
                "Dossier " + dossier.getStatut().name().toLowerCase() + " par l'agent. " +
                        (request.getNote() != null ? "Note: " + request.getNote() : ""),
                ancienStatut, dossier.getStatut().name());

        return mapToDossierResponse(dossier);
    }

    // =============================================
    // READ operations
    // =============================================

    @Transactional(readOnly = true)
    public DossierResponse getDossier(Long dossierId) {
        return mapToDossierResponse(getDossierById(dossierId));
    }

    @Transactional(readOnly = true)
    public Page<DossierResponse> getDossiersAssure(Long assureId, Pageable pageable) {
        return dossierRepository.findByAssureId(assureId, pageable)
                .map(this::mapToDossierResponse);
    }

    @Transactional(readOnly = true)
    public Page<DossierResponse> getDossiersAgent(Long agentId, Pageable pageable) {
        return dossierRepository.findByAgentId(agentId, pageable)
                .map(this::mapToDossierResponse);
    }

    @Transactional(readOnly = true)
    public Page<DossierResponse> getTousDossiers(DossierStatus statut, Long assureId, Long agentId, Pageable pageable) {
        return getTousDossiers(statut, assureId, agentId, null, pageable);
    }

    @Transactional(readOnly = true)
    public Page<DossierResponse> getTousDossiers(DossierStatus statut, Long assureId, Long agentId, String search, Pageable pageable) {
        return dossierRepository.findWithFilters(statut, assureId, agentId, search, pageable)
                .map(this::mapToDossierResponse);
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> getDocumentsDossier(Long dossierId) {
        return documentRepository.findByDossierId(dossierId).stream()
                .map(this::mapToDocumentResponse)
                .collect(Collectors.toList());
    }

    // =============================================
    // Helpers
    // =============================================

    private DossierMedical getDossierById(Long id) {
        return dossierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dossier", id));
    }

    private void enregistrerHistorique(DossierMedical dossier, User utilisateur,
            String action, String details,
            String ancienStatut, String nouveauStatut) {
        HistoriqueAction historique = HistoriqueAction.builder()
                .dossier(dossier)
                .utilisateur(utilisateur)
                .action(action)
                .details(details)
                .ancienStatut(ancienStatut)
                .nouveauStatut(nouveauStatut)
                .build();
        historiqueRepository.save(historique);
    }

    private void notifierAgentsNouveauDossier(DossierMedical dossier) {
        userRepository.findByRoleAndActif(com.pfe.medical.enums.Role.ROLE_AGENT, true)
                .forEach(agent -> notificationService.creerNotification(
                        agent,
                        "Nouveau dossier à traiter",
                        "Un nouveau dossier " + dossier.getNumeroDossier() + " a été soumis.",
                        "INFO",
                        dossier.getId()));
    }

    // === Mappers ===

    public DossierResponse mapToDossierResponse(DossierMedical dossier) {
        return DossierResponse.builder()
                .id(dossier.getId())
                .numeroDossier(dossier.getNumeroDossier())
                .description(dossier.getDescription())
                .motif(dossier.getMotif())
                .typeSoin(dossier.getTypeSoin())
                .statut(dossier.getStatut())
                .assure(mapToUserResponse(dossier.getAssure()))
                .agent(dossier.getAgent() != null ? mapToUserResponse(dossier.getAgent()) : null)
                .montantTotal(dossier.getMontantTotal())
                .montantRembourse(dossier.getMontantRembourse())
                .montantCalculeIA(dossier.getMontantCalculeIA())
                .messageAgent(dossier.getMessageAgent())
                .noteRejet(dossier.getNoteRejet())
                .createdAt(dossier.getCreatedAt())
                .dateSoumission(dossier.getDateSoumission())
                .dateValidation(dossier.getDateValidation())
                .documents(dossier.getDocuments().stream()
                        .map(this::mapToDocumentResponse)
                        .collect(Collectors.toList()))
                .beneficiary(dossier.getBeneficiary() != null ?
                    com.pfe.medical.dto.response.FamilyMemberResponse.builder()
                        .id(dossier.getBeneficiary().getId())
                        .nom(dossier.getBeneficiary().getNom())
                        .prenom(dossier.getBeneficiary().getPrenom())
                        .relation(dossier.getBeneficiary().getRelation())
                        .dateNaissance(dossier.getBeneficiary().getDateNaissance())
                        .build()
                    : null)
                .build();
    }

    private UserResponse mapToUserResponse(User user) {
        if (user == null)
            return null;
        return UserResponse.builder()
                .id(user.getId())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .email(user.getEmail())
                .cin(user.getCin())
                .telephone(user.getTelephone())
                .role(user.getRole())
                .actif(user.isActif())
                .build();
    }

    private DocumentResponse mapToDocumentResponse(DocumentMedical doc) {

        AnalyseIAResult analyseIA = null;

        try {
            if (doc.getAnalyseIAJson() != null && !doc.getAnalyseIAJson().isEmpty()) {
                analyseIA = objectMapper.readValue(
                        doc.getAnalyseIAJson(),
                        AnalyseIAResult.class);
            }
        } catch (Exception e) {
            e.printStackTrace(); // ou logger
        }

        return DocumentResponse.builder()
                .id(doc.getId())
                .type(doc.getType())
                .typeDetecteIA(doc.getTypeDetecteIA())
                .workflowStatus(doc.getWorkflowStatus())
                .nomFichier(doc.getNomFichier())
                .contentType(doc.getContentType())
                .tailleFichier(doc.getTailleFichier())
                .statutIA(doc.getStatutIA())
                .resultatIA(doc.getResultatIA()) // brut (optionnel)
                .montantDetecteIA(doc.getMontantDetecteIA())
                .montantRembourseIA(doc.getMontantRembourseIA())
                .scoreConfidenceIA(doc.getScoreConfidenceIA())
                .createdAt(doc.getCreatedAt())
                .analyseAt(doc.getAnalyseAt())
                .analyseIA(analyseIA) // 🔥 JSON PARSÉ
                .build();
    }
}
