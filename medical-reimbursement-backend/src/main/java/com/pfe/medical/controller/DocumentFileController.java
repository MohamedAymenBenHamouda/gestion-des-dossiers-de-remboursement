package com.pfe.medical.controller;

import com.pfe.medical.entity.DocumentMedical;
import com.pfe.medical.repository.DocumentMedicalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Endpoint pour servir les fichiers images/PDF des documents médicaux.
 * Accessible par l'agent ET l'assuré ET l'admin.
 *
 * URL : GET /agent/documents/{id}/fichier
 *       GET /assure/documents/{id}/fichier   ← aussi depuis la vue assuré
 */
@RestController
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('AGENT', 'ADMIN', 'ASSURE')")
public class DocumentFileController {

    private final DocumentMedicalRepository documentRepository;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    /** Endpoint agent */
    @GetMapping("/agent/documents/{id}/fichier")
    public ResponseEntity<Resource> getFichierAgent(@PathVariable Long id) {
        return serveFichier(id);
    }

    /** Endpoint assuré (même logique) */
    @GetMapping("/assure/documents/{id}/fichier")
    public ResponseEntity<Resource> getFichierAssure(@PathVariable Long id) {
        return serveFichier(id);
    }

    /** Endpoint admin */
    @GetMapping("/admin/documents/{id}/fichier")
    public ResponseEntity<Resource> getFichierAdmin(@PathVariable Long id) {
        return serveFichier(id);
    }

    // ── Logique commune ────────────────────────────────────────
    private ResponseEntity<Resource> serveFichier(Long id) {
        // 1. Trouver le document en base
        DocumentMedical doc = documentRepository.findById(id).orElse(null);
        if (doc == null) {
            log.warn("Document {} introuvable", id);
            return ResponseEntity.notFound().build();
        }

        try {
            // 2. Construire le chemin du fichier
            Path filePath = Paths.get(uploadDir).resolve(doc.getCheminFichier()).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                log.warn("Fichier non lisible : {}", filePath);
                return ResponseEntity.notFound().build();
            }

            // 3. Déterminer le Content-Type
            String contentType = doc.getContentType();
            if (contentType == null || contentType.isBlank()) {
                // Deviner depuis l'extension
                String nom = doc.getNomFichier().toLowerCase();
                if (nom.endsWith(".pdf"))  contentType = "application/pdf";
                else if (nom.endsWith(".png"))  contentType = "image/png";
                else if (nom.endsWith(".gif"))  contentType = "image/gif";
                else if (nom.endsWith(".webp")) contentType = "image/webp";
                else contentType = "image/jpeg";
            }

            // 4. Retourner le fichier
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + doc.getNomFichier() + "\"")
                    .body(resource);

        } catch (MalformedURLException e) {
            log.error("Erreur URL fichier {} : {}", id, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
