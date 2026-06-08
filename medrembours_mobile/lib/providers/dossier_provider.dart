import 'package:flutter/foundation.dart';
import '../services/dossier_service.dart';
import '../models/dossier_model.dart';

class DossierProvider with ChangeNotifier {
  List<DossierModel> _dossiers = [];
  bool _loading = false;
  DossierService? _service;

  List<DossierModel> get dossiers => _dossiers;
  bool get loading => _loading;

  // ── Computed getters ──

  int get totalDossiers => _dossiers.length;

  double get montantTotalRembourse => _dossiers
      .where((d) => d.statut == 'APPROUVE')
      .fold(0.0, (sum, d) => sum + (d.montantRembourse ?? 0));

  int get dossiersEnCours => _dossiers
      .where((d) =>
          d.statut == 'EN_COURS' ||
          d.statut == 'SOUMIS' ||
          d.statut == 'A_VERIFIER')
      .length;

  int get dossiersApprouves =>
      _dossiers.where((d) => d.statut == 'APPROUVE').length;

  int get dossiersRejetes =>
      _dossiers.where((d) => d.statut == 'REJETE').length;

  int get dossiersIncomplets =>
      _dossiers.where((d) => d.statut == 'INCOMPLET').length;

  int get dossiersBrouillon =>
      _dossiers.where((d) => d.statut == 'BROUILLON').length;

  int get dossiersSoumis =>
      _dossiers.where((d) => d.statut == 'SOUMIS').length;

  DossierModel? get dernierDossier =>
      _dossiers.isNotEmpty ? _dossiers.first : null;

  List<DossierModel> get recentDossiers =>
      _dossiers.take(6).toList();

  int countFor(String statut) =>
      _dossiers.where((d) => d.statut == statut).length;

  List<DossierModel> filtered(String statut) =>
      statut.isEmpty ? _dossiers : _dossiers.where((d) => d.statut == statut).toList();

  // ── Init service ──

  Future<void> _ensureService() async {
    _service ??= await DossierService.create();
  }

  // ── Fetch all dossiers ──

  Future<void> fetchDossiers() async {
    _loading = true;
    notifyListeners();
    try {
      await _ensureService();
      _dossiers = await _service!.getDossiers();
    } catch (e) {
      debugPrint('Fetch dossiers error: $e');
      _dossiers = [];
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  // ── Create dossier ──

  Future<DossierModel> createDossier({
    required String description,
    required String typeSoin,
    String? motif,
    int? beneficiaryId,
  }) async {
    await _ensureService();
    final dossier = await _service!.createDossier(
      description: description,
      typeSoin: typeSoin,
      motif: motif,
      beneficiaryId: beneficiaryId,
    );
    await fetchDossiers(); // refresh list
    return dossier;
  }

  // ── Get dossier detail ──

  Future<DossierModel> getDossierDetail(int id) async {
    await _ensureService();
    return await _service!.getDossier(id);
  }
}
