package com.pfe.medical.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class AnalyseIAResult {

    @JsonProperty("est_valide")
    private boolean est_valide;

    @JsonProperty("score_confiance")
    private double score_confiance;

    @JsonProperty("type_detecte")
    private String type_detecte;

    @JsonProperty("motif_rejet")
    private String motif_rejet;

    @JsonProperty("type_soin_detecte")
    private String type_soin_detecte;

    @JsonProperty("type_medecin")
    private String type_medecin;

    @JsonProperty("anomalies")
    private List<String> anomalies;

    @JsonProperty("besoin_verification")
    private boolean besoin_verification;

    private Patient patient;
    private Prestataire prestataire;
    private Facture facture;
    private Remboursement remboursement;

    private String rapport;

    @JsonProperty("montant_facture")
    private BigDecimal montant_facture;

    @JsonProperty("montant_rembourse")
    private BigDecimal montant_rembourse;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Patient {
        private String nom;
        private String adresse;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Prestataire {
        private String nom;
        private String adresse;
        private String telephone;
        private String medecin;      // ✅ Ajouté : utilisé par le frontend
        private String specialite;   // ✅ Ajouté : utilisé par le frontend
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Facture {
        private String numero;
        private String date;
        private List<Acte> actes;

        @JsonProperty("montant_ttc")
        private BigDecimal montant_ttc;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Acte {
        private String libelle;
        private BigDecimal montant;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Remboursement {
        @JsonProperty("taux_applique")
        private double taux_applique;

        @JsonProperty("montant_facture")
        private BigDecimal montant_facture;    // ✅ Ajouté

        @JsonProperty("montant_rembourse")
        private BigDecimal montant_rembourse;
    }
}