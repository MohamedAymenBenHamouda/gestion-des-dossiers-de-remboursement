import 'api_client.dart';

class ProfileService {
  final ApiClient _client;

  ProfileService._(this._client);

  static Future<ProfileService> create() async {
    final client = await ApiClient.create();
    return ProfileService._(client);
  }

  /// Mettre à jour le profil
  Future<bool> updateProfil(Map<String, dynamic> data) async {
    final resp = await _client.put('/assure/profil', data: data);
    return resp.statusCode == 200 || resp.statusCode == 201;
  }

  /// Changer le mot de passe
  Future<bool> changerMotDePasse(String currentPwd, String newPwd) async {
    final resp = await _client.post('/assure/profil/changer-mot-de-passe', data: {
      'ancienMotDePasse': currentPwd,
      'nouveauMotDePasse': newPwd,
    });
    return resp.statusCode == 200 || resp.statusCode == 201;
  }

  // ══════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ══════════════════════════════════════════════════════════

  /// Récupérer toutes les notifications
  Future<List<dynamic>> getNotifications() async {
    final resp = await _client.get('/assure/notifications');
    if (resp.statusCode == 200) {
      return resp.data['data'] as List<dynamic>? ?? [];
    }
    return [];
  }

  /// Récupérer les notifications non lues
  Future<List<dynamic>> getNotificationsNonLues() async {
    final resp = await _client.get('/assure/notifications/non-lues');
    if (resp.statusCode == 200) {
      return resp.data['data'] as List<dynamic>? ?? [];
    }
    return [];
  }

  /// Compter les notifications non lues
  Future<int> countNotificationsNonLues() async {
    final resp = await _client.get('/assure/notifications/count');
    if (resp.statusCode == 200) {
      return resp.data['data'] ?? 0;
    }
    return 0;
  }

  /// Marquer une notification comme lue
  Future<void> marquerLue(int notifId) async {
    await _client.patch('/assure/notifications/$notifId/lire');
  }

  /// Marquer toutes les notifications comme lues
  Future<void> marquerToutesLues() async {
    await _client.patch('/assure/notifications/lire-toutes');
  }
}
