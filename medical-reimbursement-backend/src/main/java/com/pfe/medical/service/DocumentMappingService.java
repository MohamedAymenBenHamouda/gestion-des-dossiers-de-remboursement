package com.pfe.medical.service;

import com.pfe.medical.enums.DocumentType;
import com.pfe.medical.enums.TypeSoin;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class DocumentMappingService {

    private static final Map<TypeSoin, List<DocumentType>> MAPPING = Map.of(
            TypeSoin.CONSULTATION, List.of(
                    DocumentType.ORDONNANCE,
                    DocumentType.FACTURE_PHARMACIE,
                    DocumentType.FACTURE_RADIO,
                    DocumentType.FACTURE_SCANNER,
                    DocumentType.FACTURE_LABO,
                    DocumentType.FACTURE_IRM,
                    DocumentType.AUTRE),
            TypeSoin.HOSPITALISATION, List.of(
                    DocumentType.FACTURE,
                    DocumentType.BULLETIN_SORTIE,
                    DocumentType.AUTRE),
            TypeSoin.OPTIQUE, List.of(
                    DocumentType.FACTURE,
                    DocumentType.ORDONNANCE,
                    DocumentType.AUTRE),
            TypeSoin.ALD, List.of(
                    DocumentType.ORDONNANCE,
                    DocumentType.FACTURE_PHARMACIE,
                    DocumentType.FACTURE_RADIO,
                    DocumentType.FACTURE_SCANNER,
                    DocumentType.FACTURE_LABO,
                    DocumentType.FACTURE_IRM,
                    DocumentType.AUTRE),
            TypeSoin.DENTAIRE, List.of(
                    DocumentType.FACTURE,
                    DocumentType.RADIO,
                    DocumentType.AUTRE),
            TypeSoin.PHARMACIE, List.of(
                    DocumentType.ORDONNANCE,
                    DocumentType.FACTURE_PHARMACIE,
                    DocumentType.AUTRE));

    public List<DocumentType> getRequiredDocuments(TypeSoin typeSoin) {
        return MAPPING.getOrDefault(typeSoin, List.of(DocumentType.AUTRE));
    }
}
