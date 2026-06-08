import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/dossier_provider.dart';
import '../models/dossier_model.dart';
import '../config/app_theme.dart';

class HistoriqueScreen extends StatefulWidget {
  const HistoriqueScreen({Key? key}) : super(key: key);

  @override
  State<HistoriqueScreen> createState() => _HistoriqueScreenState();
}

class _HistoriqueScreenState extends State<HistoriqueScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<DossierProvider>(context, listen: false).fetchDossiers();
    });
  }

  @override
  Widget build(BuildContext context) {
    final prov = Provider.of<DossierProvider>(context);
    final historique = prov.dossiers.where((d) => d.statut == 'APPROUVE').toList();
    final total = historique.fold<double>(0, (s, d) => s + (d.montantRembourse ?? _calcMontantFromDocs(d)));

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        elevation: 0,
        leading: GestureDetector(
          onTap: () => Navigator.of(context).pop(),
          child: Container(
            margin: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 16),
          ),
        ),
        title: const Row(
          children: [
            Icon(Icons.history, color: Colors.white, size: 20),
            SizedBox(width: 8),
            Text('Historique de remboursement', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
          ],
        ),
      ),
      body: prov.loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => prov.fetchDossiers(),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  // Summary
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [Color(0xFFDCFCE7), Color(0xFFBBF7D0)]),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF86EFAC)),
                    ),
                    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        const Text('Total Remboursé', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF166534))),
                        const SizedBox(height: 6),
                        Text('Cumul de tous vos dossiers approuvés (${historique.length})', style: const TextStyle(color: Color(0xFF15803D))),
                      ]),
                      Text('${total.toStringAsFixed(2)} TND', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF14532D))),
                    ]),
                  ),

                  const SizedBox(height: 18),

                  // List
                  Column(children: [
                    if (historique.isEmpty)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 40),
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFE5E7EB))),
                        child: Column(children: const [Icon(Icons.money_off, size: 48), SizedBox(height: 12), Text('Aucun remboursement', style: TextStyle(fontWeight: FontWeight.w700)), SizedBox(height: 6), Text('Vous n\'avez pas encore de dossiers approuvés.')]),
                      )
                    else
                      ...historique.map((d) => _DossierCard(dossier: d)).toList(),
                  ])
                ]),
              ),
            ),
    );
  }

  double _calcMontantFromDocs(DossierModel d) {
    if (d.montantRembourse != null) return d.montantRembourse!;
    return d.documents.where((doc) => doc.statutIA == 'VALIDE' && doc.analyseIA != null).fold(0.0, (s, doc) => s + ((doc.analyseIA?['remboursement']?['montant_rembourse'] ?? 0) as num).toDouble());
  }
}

class _DossierCard extends StatelessWidget {
  final DossierModel dossier;
  const _DossierCard({required this.dossier});

  @override
  Widget build(BuildContext context) {
    final montant = dossier.montantRembourse ?? 0.0;
    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, '/dossiers/detail', arguments: dossier.id),
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFE5E7EB)), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 8)]),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(dossier.numeroDossier, style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.w700)), const SizedBox(height: 6), Text('${dossier.typeSoinLabel} - ${dossier.description.isNotEmpty ? dossier.description : 'Sans description'}', style: const TextStyle(fontWeight: FontWeight.w600))])),
            Text('+ ${montant.toStringAsFixed(2)} TND', style: const TextStyle(color: AppTheme.success, fontWeight: FontWeight.w800)),
          ]),
          const SizedBox(height: 10),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text('Remboursé le : ${_formatDate(dossier.dateValidation ?? dossier.createdAt)}', style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12)), Text('Demande initiale : ${_formatCurrency(dossier.montantTotal)}', style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12))]),
        ]),
      ),
    );
  }

  String _formatDate(String? iso) {
    if (iso == null) return 'N/A';
    try {
      final d = DateTime.parse(iso);
      return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
    } catch (_) {
      return iso;
    }
  }

  String _formatCurrency(double? v) {
    if (v == null) return '0 TND';
    return '${v.toStringAsFixed(2)} TND';
  }
}
