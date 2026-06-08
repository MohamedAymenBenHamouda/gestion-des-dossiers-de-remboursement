import 'document_model.dart';
import 'user_model.dart';

class DossierModel {
  final int id;
  final String numeroDossier;
  final String description;
  final String? motif;
  final String? typeSoin;
  final String statut;
  final UserModel? assure;
  final UserModel? agent;
  final double? montantTotal;
  final double? montantRembourse;
  final double? montantCalculeIA;
  final String? messageAgent;
  final String? noteRejet;
  final String? createdAt;
  final String? dateSoumission;
  final String? dateValidation;
  final List<DocumentModel> documents;

  DossierModel({
    required this.id,
    required this.numeroDossier,
    required this.description,
    this.motif,
    this.typeSoin,
    required this.statut,
    this.assure,
    this.agent,
    this.montantTotal,
    this.montantRembourse,
    this.montantCalculeIA,
    this.messageAgent,
    this.noteRejet,
    this.createdAt,
    this.dateSoumission,
    this.dateValidation,
    this.documents = const [],
  });

  bool get isBrouillon => statut == 'BROUILLON';
  bool get isSoumis => statut == 'SOUMIS';
  bool get isApprouve => statut == 'APPROUVE';
  bool get isRejete => statut == 'REJETE';
  bool get isIncomplet => statut == 'INCOMPLET';
  bool get isEditable => statut == 'BROUILLON' || statut == 'INCOMPLET';

  /// Label lisible du type de soin
  String get typeSoinLabel {
    const mapping = {
      'CONSULTATION': 'Consultation',
      'HOSPITALISATION': 'Hospitalisation',
      'DENTAIRE': 'Soins Dentaires',
      'OPTIQUE': 'Optique',
      'ALD': 'Maladie Chronique (ALD)',
      'PHARMACIE': 'Pharmacie',
      'AUTRE': 'Autre',
    };
    return mapping[typeSoin] ?? typeSoin ?? 'Non défini';
  }

  /// Label lisible du statut
  String get statutLabel {
    const mapping = {
      'BROUILLON': 'Brouillon',
      'SOUMIS': 'Soumis',
      'A_VERIFIER': 'À vérifier',
      'EN_COURS': 'En cours',
      'INCOMPLET': 'Incomplet',
      'APPROUVE': 'Approuvé',
      'REJETE': 'Rejeté',
    };
    return mapping[statut] ?? statut;
  }

  factory DossierModel.fromJson(Map<String, dynamic> json) {
    return DossierModel(
      id: json['id'] ?? 0,
      numeroDossier: json['numeroDossier'] ?? 'N/A',
      description: json['description'] ?? '',
      motif: json['motif'],
      typeSoin: json['typeSoin'],
      statut: json['statut'] ?? 'BROUILLON',
      assure: json['assure'] != null
          ? UserModel.fromJson(Map<String, dynamic>.from(json['assure']))
          : null,
      agent: json['agent'] != null
          ? UserModel.fromJson(Map<String, dynamic>.from(json['agent']))
          : null,
      montantTotal: _toDouble(json['montantTotal']),
      montantRembourse: _toDouble(json['montantRembourse']),
      montantCalculeIA: _toDouble(json['montantCalculeIA']),
      messageAgent: json['messageAgent'],
      noteRejet: json['noteRejet'],
      createdAt: json['createdAt']?.toString(),
      dateSoumission: json['dateSoumission']?.toString(),
      dateValidation: json['dateValidation']?.toString(),
      documents: json['documents'] != null
          ? (json['documents'] as List)
              .map((d) => DocumentModel.fromJson(Map<String, dynamic>.from(d)))
              .toList()
          : [],
    );
  }

  static double? _toDouble(dynamic v) {
    if (v == null) return null;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    if (v is String) return double.tryParse(v);
    return null;
  }
}
