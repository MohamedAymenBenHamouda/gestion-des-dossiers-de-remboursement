class DocumentModel {
  final int id;
  final String type;
  final String? typeDetecteIA;
  final String workflowStatus;
  final String nomFichier;
  final String? contentType;
  final int? tailleFichier;
  final String statutIA;
  final String? resultatIA;
  final double? montantDetecteIA;
  final double? montantRembourseIA;
  final double? scoreConfidenceIA;
  final String? createdAt;
  final String? analyseAt;
  final Map<String, dynamic>? analyseIA;

  DocumentModel({
    required this.id,
    required this.type,
    this.typeDetecteIA,
    this.workflowStatus = 'UPLOADED',
    required this.nomFichier,
    this.contentType,
    this.tailleFichier,
    this.statutIA = 'EN_ATTENTE',
    this.resultatIA,
    this.montantDetecteIA,
    this.montantRembourseIA,
    this.scoreConfidenceIA,
    this.createdAt,
    this.analyseAt,
    this.analyseIA,
  });

  bool get isValidatedByIA => statutIA == 'VALIDE';
  bool get isInvalidByIA => statutIA == 'INVALIDE' || statutIA == 'ERREUR';
  bool get isPendingIA => statutIA == 'EN_ATTENTE';

  /// Icône fichier selon le contentType
  String get fileIcon {
    if (contentType?.contains('pdf') == true) return '📋';
    if (contentType?.contains('image') == true) return '🖼️';
    return '📄';
  }

  /// Vérifier si le type détecté par l'IA diffère du type déclaré
  bool get hasTypeInconsistency =>
      typeDetecteIA != null && typeDetecteIA != type;

  factory DocumentModel.fromJson(Map<String, dynamic> json) {
    return DocumentModel(
      id: json['id'] ?? 0,
      type: json['type'] ?? 'AUTRE',
      typeDetecteIA: json['typeDetecteIA'],
      workflowStatus: json['workflowStatus'] ?? 'UPLOADED',
      nomFichier: json['nomFichier'] ?? '',
      contentType: json['contentType'],
      tailleFichier: json['tailleFichier'],
      statutIA: json['statutIA'] ?? 'EN_ATTENTE',
      resultatIA: json['resultatIA'],
      montantDetecteIA: _toDouble(json['montantDetecteIA']),
      montantRembourseIA: _toDouble(json['montantRembourseIA']),
      scoreConfidenceIA: _toDouble(json['scoreConfidenceIA']),
      createdAt: json['createdAt']?.toString(),
      analyseAt: json['analyseAt']?.toString(),
      analyseIA: json['analyseIA'] != null
          ? Map<String, dynamic>.from(json['analyseIA'])
          : null,
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
