package com.pfe.medical.service.impl;

import com.pfe.medical.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${app.upload.dir}")
    private String uploadDir;

    private static final List<String> ALLOWED_TYPES = Arrays.asList(
        "image/jpeg", "image/jpg", "image/png", "image/webp",
        "application/pdf"
    );

    private static final long MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

    public String stocker(MultipartFile file, String sousDossier) {
        validateFile(file);

        try {
            Path uploadPath = Paths.get(uploadDir, sousDossier);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String extension = getExtension(file.getOriginalFilename());
            String nomFichier = UUID.randomUUID().toString() + extension;
            Path destination = uploadPath.resolve(nomFichier);

            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

            return sousDossier + "/" + nomFichier;
        } catch (IOException e) {
            throw new BusinessException("Erreur lors du stockage du fichier: " + e.getMessage());
        }
    }

    public byte[] lire(String chemin) {
        try {
            Path filePath = Paths.get(uploadDir, chemin);
            return Files.readAllBytes(filePath);
        } catch (IOException e) {
            throw new BusinessException("Fichier introuvable: " + chemin);
        }
    }

    public void supprimer(String chemin) {
        try {
            Path filePath = Paths.get(uploadDir, chemin);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            // Log but don't throw
        }
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BusinessException("Le fichier est vide.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessException("Le fichier dépasse la taille maximale autorisée (20MB).");
        }
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new BusinessException("Type de fichier non autorisé. Formats acceptés: JPG, PNG, PDF.");
        }
    }

    private String getExtension(String filename) {
        if (filename == null) return "";
        int dotIndex = filename.lastIndexOf('.');
        return dotIndex > 0 ? filename.substring(dotIndex) : "";
    }
}
