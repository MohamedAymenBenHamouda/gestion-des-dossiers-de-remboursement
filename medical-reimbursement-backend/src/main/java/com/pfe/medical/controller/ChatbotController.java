package com.pfe.medical.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.pfe.medical.dto.response.ApiResponse;
import com.pfe.medical.dto.response.DossierResponse;
import com.pfe.medical.entity.User;
import com.pfe.medical.service.impl.DossierService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Chatbot IA GRATUIT — deux modes configurables :
 *
 *  MODE 1 : Groq (gratuit, cloud, très rapide)
 *    chatbot.provider=groq
 *    chatbot.groq.api-key=gsk_VOTRE_CLE_GROQ   ← gratuit sur console.groq.com
 *    chatbot.groq.model=llama3-8b-8192
 *
 *  MODE 2 : Ollama (100% local, aucune clé, aucun paiement)
 *    chatbot.provider=ollama
 *    chatbot.ollama.url=http://localhost:11434
 *    chatbot.ollama.model=llama3
 */
@RestController
@RequestMapping("/assure/chatbot")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ASSURE', 'ADMIN')")
@Slf4j
public class ChatbotController {

    private final DossierService dossierService;
    private final ObjectMapper objectMapper;

    // ---- Configuration ----
    @Value("${chatbot.provider:groq}")
    private String provider;

    // Groq
    @Value("${chatbot.groq.api-key:}")
    private String groqApiKey;

    @Value("${chatbot.groq.model:llama3-8b-8192}")
    private String groqModel;

    // Ollama
    @Value("${chatbot.ollama.url:http://localhost:11434}")
    private String ollamaUrl;

    @Value("${chatbot.ollama.model:llama3}")
    private String ollamaModel;

    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String API_KEY = "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";
    // -------------------------------------------------------
    @PostMapping
    public ResponseEntity<ApiResponse<String>> chat(
            @AuthenticationPrincipal User user,
            @RequestBody ChatRequest request) {
        try {
            // 1. Charger les dossiers
            var page = dossierService.getDossiersAssure(user.getId(), PageRequest.of(0, 200));
            List<Map<String, Object>> liste = buildDossiersList(page.getContent());
            String dossiersJson = objectMapper.writeValueAsString(liste);

            String today = LocalDate.now()
                    .format(DateTimeFormatter.ofPattern("dd MMMM yyyy", Locale.FRENCH));
            String systemPrompt = buildSystemPrompt(user, dossiersJson, today);

            String reply;
            if ("ollama".equalsIgnoreCase(provider)) {
                reply = callOllama(systemPrompt, request);
            } else {
                reply = callGroq(systemPrompt, request);
            }

            return ResponseEntity.ok(ApiResponse.success("OK", reply));

        } catch (Exception e) {
            log.error("Erreur chatbot [{}]: {}", provider, e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.success(
                    "⚠️ Erreur : " + e.getMessage(), null));
        }
    }

    // ============================================================
    //  GROQ  (gratuit — https://console.groq.com)
    // ============================================================
    private String callGroq(String systemPrompt, ChatRequest request) throws Exception {
        if (groqApiKey == null || groqApiKey.isBlank()) {
            return "⚠️ Clé Groq manquante.<br>Ajoutez <strong>chatbot.groq.api-key=gsk_...</strong> dans application.properties.<br>Clé gratuite sur <strong>https://console.groq.com</strong>";
        }

        ArrayNode messages = objectMapper.createArrayNode();

        // System message
        ObjectNode sys = objectMapper.createObjectNode();
        sys.put("role", "system");
        sys.put("content", systemPrompt);
        messages.add(sys);

        // Historique
        addHistory(messages, request);

        // Message utilisateur
        ObjectNode userMsg = objectMapper.createObjectNode();
        userMsg.put("role", "user");
        userMsg.put("content", request.getMessage());
        messages.add(userMsg);

        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", groqModel);
        body.put("max_tokens", 1024);
        body.put("temperature", 0.7);
        body.set("messages", messages);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        RestTemplate rt = new RestTemplate();
        ResponseEntity<JsonNode> resp = rt.exchange(
                GROQ_API_URL, HttpMethod.POST,
                new HttpEntity<>(body.toString(), headers),
                JsonNode.class);

        return resp.getBody()
                .path("choices").get(0)
                .path("message").path("content").asText();
    }

    // ============================================================
    //  OLLAMA  (100% local — https://ollama.com)
    // ============================================================
    private String callOllama(String systemPrompt, ChatRequest request) throws Exception {
        // Construire le prompt complet pour Ollama (format simple)
        StringBuilder fullPrompt = new StringBuilder();
        fullPrompt.append("<|system|>\n").append(systemPrompt).append("\n");

        if (request.getHistory() != null) {
            for (HistoryMessage h : request.getHistory()) {
                if ("user".equals(h.getRole())) {
                    fullPrompt.append("<|user|>\n").append(h.getContent()).append("\n");
                } else {
                    fullPrompt.append("<|assistant|>\n").append(h.getContent()).append("\n");
                }
            }
        }
        fullPrompt.append("<|user|>\n").append(request.getMessage()).append("\n<|assistant|>\n");

        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", ollamaModel);
        body.put("prompt", fullPrompt.toString());
        body.put("stream", false);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        RestTemplate rt = new RestTemplate();
        try {
            ResponseEntity<JsonNode> resp = rt.exchange(
                    ollamaUrl + "/api/generate",
                    HttpMethod.POST,
                    new HttpEntity<>(body.toString(), headers),
                    JsonNode.class);
            return resp.getBody().path("response").asText();
        } catch (Exception e) {
            return "⚠️ Ollama inaccessible sur " + ollamaUrl + ".<br>" +
                   "Vérifiez qu'Ollama est démarré : <strong>ollama serve</strong><br>" +
                   "Et que le modèle est téléchargé : <strong>ollama pull " + ollamaModel + "</strong>";
        }
    }

    // ============================================================
    //  Helpers
    // ============================================================
    private void addHistory(ArrayNode messages, ChatRequest request) {
        if (request.getHistory() == null) return;
        for (HistoryMessage h : request.getHistory()) {
            ObjectNode msg = objectMapper.createObjectNode();
            msg.put("role",    "user".equals(h.getRole()) ? "user" : "assistant");
            msg.put("content", h.getContent());
            messages.add(msg);
        }
    }

    private List<Map<String, Object>> buildDossiersList(List<DossierResponse> dossiers) {
        return dossiers.stream().map(d -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("numeroDossier",    d.getNumeroDossier());
            m.put("description",      nvl(d.getDescription()));
            m.put("motif",            nvl(d.getMotif()));
            m.put("statut",           d.getStatut().name());
            m.put("montantTotal",     d.getMontantTotal()     != null ? d.getMontantTotal()     : 0);
            m.put("montantRembourse", d.getMontantRembourse() != null ? d.getMontantRembourse() : 0);
            m.put("messageAgent",     nvl(d.getMessageAgent()));
            m.put("noteRejet",        nvl(d.getNoteRejet()));
            m.put("dateCreation",     d.getCreatedAt()      != null ? d.getCreatedAt().toString()      : "");
            m.put("dateSoumission",   d.getDateSoumission() != null ? d.getDateSoumission().toString() : "");
            m.put("dateValidation",   d.getDateValidation() != null ? d.getDateValidation().toString() : "");
            m.put("nombreDocuments",  d.getDocuments()      != null ? d.getDocuments().size() : 0);
            return m;
        }).toList();
    }

    private String buildSystemPrompt(User user, String dossiersJson, String today) {
        return String.format(
            "Tu es l'assistant virtuel de MedRembours, système de remboursement médical en Tunisie.\n" +
            "Tu parles à l'assuré : %s %s (email: %s).\n" +
            "Date d'aujourd'hui : %s\n\n" +
            "Voici TOUS ses dossiers (JSON) :\n%s\n\n" +
            "STATUTS :\n" +
            "- BROUILLON : non soumis\n" +
            "- SOUMIS : en attente d'un agent\n" +
            "- EN_COURS : traitement en cours\n" +
            "- INCOMPLET : documents manquants\n" +
            "- APPROUVE : remboursement accordé\n" +
            "- REJETE : dossier refusé\n\n" +
            "RÈGLES :\n" +
            "1. Réponds TOUJOURS en français, de façon claire et bienveillante.\n" +
            "2. Utilise UNIQUEMENT les données JSON fournies. Ne devine rien.\n" +
            "3. Montants : 2 décimales + TND.\n" +
            "4. Dates : format lisible (ex: 15 janvier 2025).\n" +
            "5. Formate avec des emojis et des listes pour la lisibilité.\n" +
            "6. Si aucun dossier ne correspond, dis-le clairement.\n" +
            "7. Réponds uniquement aux questions liées aux dossiers médicaux.",
            user.getPrenom(), user.getNom(), user.getEmail(), today, dossiersJson);
    }

    private String nvl(String s) { return s != null ? s : ""; }

    // DTOs
    @Data
    public static class ChatRequest {
        private String message;
        private List<HistoryMessage> history;
    }

    @Data
    public static class HistoryMessage {
        private String role;
        private String content;
    }
}
