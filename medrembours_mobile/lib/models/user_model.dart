class UserModel {
  final int id;
  final String nom;
  final String prenom;
  final String email;
  final String? cin;
  final String? telephone;
  final String? adresse;
  final String role;
  final bool actif;
  final String? createdAt;

  UserModel({
    required this.id,
    required this.nom,
    required this.prenom,
    required this.email,
    this.cin,
    this.telephone,
    this.adresse,
    this.role = 'ROLE_ASSURE',
    this.actif = true,
    this.createdAt,
  });

  /// Nom complet pour l'affichage
  String get fullName => '$prenom $nom';

  /// Initiales pour l'avatar
  String get initials {
    final p = prenom.isNotEmpty ? prenom[0] : '';
    final n = nom.isNotEmpty ? nom[0] : '';
    return '$p$n'.toUpperCase();
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? 0,
      nom: json['nom'] ?? '',
      prenom: json['prenom'] ?? '',
      email: json['email'] ?? '',
      cin: json['cin'],
      telephone: json['telephone'],
      adresse: json['adresse'],
      role: json['role'] ?? 'ROLE_ASSURE',
      actif: json['actif'] ?? true,
      createdAt: json['createdAt'],
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'nom': nom,
        'prenom': prenom,
        'email': email,
        'cin': cin,
        'telephone': telephone,
        'adresse': adresse,
        'role': role,
        'actif': actif,
        'createdAt': createdAt,
      };

  UserModel copyWith({
    String? nom,
    String? prenom,
    String? cin,
    String? telephone,
    String? adresse,
  }) {
    return UserModel(
      id: id,
      nom: nom ?? this.nom,
      prenom: prenom ?? this.prenom,
      email: email,
      cin: cin ?? this.cin,
      telephone: telephone ?? this.telephone,
      adresse: adresse ?? this.adresse,
      role: role,
      actif: actif,
      createdAt: createdAt,
    );
  }
}
