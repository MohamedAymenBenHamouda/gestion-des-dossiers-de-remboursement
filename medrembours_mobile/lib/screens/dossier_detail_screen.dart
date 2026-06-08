import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../services/dossier_service.dart';
import '../models/dossier_model.dart';
import '../models/document_model.dart';
import '../config/app_theme.dart';

class DossierDetailScreen extends StatefulWidget {
  const DossierDetailScreen({Key? key}) : super(key: key);

  @override
  State<DossierDetailScreen> createState() => _DossierDetailScreenState();
}

class _DossierDetailScreenState extends State<DossierDetailScreen> {
  DossierModel? _dossier;
  bool _loading = true;
  int? _dossierId;
  bool _isSubmitting = false;
  bool _showUploadSheet = false;
  DossierService? _service;

  // Upload state
  XFile? _selectedFile;
  String _selectedDocType = '';
  bool _isUploading = false;
  final ImagePicker _picker = ImagePicker();

  // Document categories based on typeSoin
  static const _allDocCats = [
    {'key': 'ORDONNANCE', 'label': 'Ordonnance', 'icon': '💊', 'hint': 'Prescription médicale'},
    {'key': 'FACTURE_PHARMACIE', 'label': 'Facture Pharmacie', 'icon': '🧾', 'hint': 'Achat de médicaments'},
    {'key': 'FACTURE_RADIO', 'label': 'Facture Radio', 'icon': '🦴', 'hint': 'Frais de radiologie'},
    {'key': 'FACTURE_SCANNER', 'label': 'Facture Scanner', 'icon': '🧲', 'hint': 'Frais de scanner'},
    {'key': 'FACTURE_LABO', 'label': 'Facture Laboratoire', 'icon': '🔬', 'hint': 'Analyses médicales'},
    {'key': 'FACTURE_IRM', 'label': 'Facture IRM', 'icon': '🧲', 'hint': 'Frais d\'IRM'},
    {'key': 'BULLETIN_SORTIE', 'label': 'Bulletin de sortie', 'icon': '🏥', 'hint': 'Hospitalisation'},
    {'key': 'FACTURE', 'label': 'Facture', 'icon': '🧾', 'hint': 'Clinique, Dentiste...'},
    {'key': 'ANALYSE', 'label': 'Résultats d\'analyse', 'icon': '🔬', 'hint': 'Analyses sanguines...'},
    {'key': 'RADIO', 'label': 'Radiographie', 'icon': '🦴', 'hint': 'Radio pulmonaire, osseuse...'},
    {'key': 'AUTRE', 'label': 'Autre document', 'icon': '📄', 'hint': 'Tout autre justificatif'},
  ];

  static const _typeSoinMapping = {
    'CONSULTATION': ['ORDONNANCE', 'FACTURE_PHARMACIE', 'FACTURE_RADIO', 'FACTURE_SCANNER', 'FACTURE_LABO', 'FACTURE_IRM', 'AUTRE'],
    'HOSPITALISATION': ['FACTURE', 'BULLETIN_SORTIE', 'ORDONNANCE', 'AUTRE'],
    'OPTIQUE': ['FACTURE', 'ORDONNANCE', 'AUTRE'],
    'ALD': ['ORDONNANCE', 'FACTURE_PHARMACIE', 'FACTURE_RADIO', 'FACTURE_SCANNER', 'FACTURE_LABO', 'FACTURE_IRM', 'AUTRE'],
    'DENTAIRE': ['FACTURE', 'RADIO', 'AUTRE'],
  };

  List<Map<String, String>> get _filteredDocCats {
    if (_dossier?.typeSoin == null) return _allDocCats;
    final keys = _typeSoinMapping[_dossier!.typeSoin!] ?? ['AUTRE'];
    return _allDocCats.where((c) => keys.contains(c['key'])).toList();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_dossierId == null) {
      _dossierId = ModalRoute.of(context)?.settings.arguments as int?;
      if (_dossierId != null) _load(_dossierId!);
    }
  }

  Future<void> _load(int id) async {
    setState(() => _loading = true);
    try {
      _service ??= await DossierService.create();
      final data = await _service!.getDossier(id);
      if (mounted) setState(() => _dossier = data);
      // Poll for pending IA docs
      for (var doc in data.documents) {
        if (doc.isPendingIA) _pollDoc(doc.id);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Erreur de chargement'), backgroundColor: AppTheme.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _pollDoc(int docId) {
    int tries = 0;
    Timer.periodic(const Duration(seconds: 3), (timer) async {
      tries++;
      if (!mounted || _dossierId == null) { timer.cancel(); return; }
      try {
        final fresh = await _service!.getDossier(_dossierId!);
        if (!mounted) { timer.cancel(); return; }
        final docFresh = fresh.documents.where((d) => d.id == docId).firstOrNull;
        if (docFresh == null) { timer.cancel(); return; }
        final done = !docFresh.isPendingIA;
        if (done || tries >= 60) {
          timer.cancel();
          setState(() => _dossier = fresh);
        }
      } catch (_) {
        timer.cancel();
      }
    });
  }

  Future<void> _soumettre() async {
    if (_dossierId == null) return;
    setState(() => _isSubmitting = true);
    try {
      _service ??= await DossierService.create();
      final updated = await _service!.soumettreDossier(_dossierId!);
      if (mounted) {
        setState(() => _dossier = updated);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Dossier soumis avec succès !'), backgroundColor: AppTheme.success),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Impossible de soumettre'), backgroundColor: AppTheme.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _pickAndUpload(ImageSource source) async {
    if (_selectedDocType.isEmpty || _dossierId == null) return;
    final XFile? image = await _picker.pickImage(source: source, imageQuality: 85);
    if (image == null) return;

    setState(() {
      _selectedFile = image;
      _isUploading = true;
    });

    try {
      _service ??= await DossierService.create();
      final doc = await _service!.uploadDocument(_dossierId!, _selectedFile!, _selectedDocType);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Document envoyé — Analyse IA en cours...'), backgroundColor: AppTheme.success),
        );
        _pollDoc(doc.id);
        _load(_dossierId!);
        setState(() {
          _showUploadSheet = false;
          _selectedFile = null;
          _selectedDocType = '';
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Erreur lors de l\'upload'), backgroundColor: AppTheme.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  void _showSourceActionSheet() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt, color: AppTheme.primary),
              title: const Text('Prendre une photo'),
              onTap: () {
                Navigator.pop(ctx);
                _pickAndUpload(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library, color: AppTheme.primary),
              title: const Text('Choisir depuis la galerie'),
              onTap: () {
                Navigator.pop(ctx);
                _pickAndUpload(ImageSource.gallery);
              },
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(String? iso) {
    if (iso == null || iso.isEmpty) return 'N/A';
    try {
      return DateFormat('dd MMM yyyy à HH:mm').format(DateTime.parse(iso));
    } catch (_) {
      return iso;
    }
  }

  double get _totalRembourse {
    if (_dossier == null) return 0;
    return _dossier!.documents
        .where((d) => d.isValidatedByIA && d.analyseIA?['remboursement']?['montant_rembourse'] != null)
        .fold(0.0, (s, d) => s + (d.analyseIA!['remboursement']['montant_rembourse'] as num).toDouble());
  }

  @override
  Widget build(BuildContext context) {
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
        title: Row(
          children: [
            const Icon(Icons.folder_open, color: Colors.white, size: 18),
            const SizedBox(width: 8),
            Text(
              _dossier?.numeroDossier ?? 'Détail du dossier',
              style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700, fontFamily: 'monospace'),
            ),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _dossier == null
              ? const Center(child: Text('Aucun détail trouvé'))
              : Stack(
                  children: [
                    _buildBody(),
                    if (_showUploadSheet) _buildUploadSheet(),
                  ],
                ),
    );
  }

  Widget _buildBody() {
    final d = _dossier!;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header Card ──
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF0F172A), Color(0xFF1E3A5F)],
              ),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      d.numeroDossier,
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 6),
                    _buildWhiteStatusBadge(d.statut),
                  ],
                ),
                if (d.isEditable && d.documents.isNotEmpty)
                  ElevatedButton(
                    onPressed: _isSubmitting ? null : _soumettre,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: AppTheme.primary,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: _isSubmitting
                        ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Text('📤 Soumettre', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                  ),
              ],
            ),
          ),

          // ── Message Agent ──
          if (d.messageAgent != null && d.messageAgent!.isNotEmpty) ...[
            const SizedBox(height: 12),
            _buildAlertCard('💬', 'Message de votre agent', d.messageAgent!, const Color(0xFFFEF3C7), const Color(0xFF92400E)),
          ],

          // ── Note Rejet ──
          if (d.noteRejet != null && d.noteRejet!.isNotEmpty) ...[
            const SizedBox(height: 12),
            _buildAlertCard('❌', 'Motif de rejet', d.noteRejet!, const Color(0xFFFEE2E2), const Color(0xFF991B1B)),
          ],

          // ── Description Card ──
          const SizedBox(height: 16),
          _buildCard(
            title: '📝 Détails & Description',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _metaItem('Type de Soin', d.typeSoinLabel, color: AppTheme.primary),
                const SizedBox(height: 8),
                Text(
                  d.description.isNotEmpty ? d.description : 'Aucune note.',
                  style: const TextStyle(fontSize: 14, color: AppTheme.textSecondary, height: 1.5),
                ),
                const SizedBox(height: 12),
                const Divider(height: 1),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 20,
                  runSpacing: 8,
                  children: [
                    _metaChip('Créé le', _formatDate(d.createdAt)),
                    if (d.dateSoumission != null) _metaChip('Soumis le', _formatDate(d.dateSoumission)),
                    if (d.montantTotal != null)
                      _metaChip('Montant demandé', '${d.montantTotal!.toStringAsFixed(2)} TND'),
                    if (d.isApprouve && d.montantRembourse != null)
                      _metaChip('Remboursé', '${d.montantRembourse!.toStringAsFixed(2)} TND', isGreen: true),
                  ],
                ),
              ],
            ),
          ),

          // ── Documents ──
          if (d.documents.isNotEmpty) ...[
            const SizedBox(height: 16),
            _buildCard(
              title: '📂 Documents soumis (${d.documents.length})',
              trailing: _totalRembourse > 0
                  ? Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFDCFCE7),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: AppTheme.success),
                      ),
                      child: Text(
                        '💚 ${_totalRembourse.toStringAsFixed(2)} TND',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF166534)),
                      ),
                    )
                  : null,
              child: Column(
                children: d.documents.map((doc) => _buildDocCard(doc)).toList(),
              ),
            ),
          ],

          // ── Add Document Button ──
          if (d.isEditable) ...[
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => setState(() {
                  _showUploadSheet = true;
                  _selectedDocType = '';
                  _selectedFile = null;
                }),
                icon: const Icon(Icons.add_circle_outline),
                label: const Text('Ajouter un document'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  side: BorderSide(color: AppTheme.primary.withOpacity(0.4)),
                ),
              ),
            ),
          ],

          // ── Submit Button ──
          if (d.isEditable && d.documents.isNotEmpty) ...[
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _soumettre,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryDark,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _isSubmitting
                    ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                    : const Text('📤 Soumettre le dossier définitivement',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
              ),
            ),
          ],

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  // ── Document Card ──
  Widget _buildDocCard(DocumentModel doc) {
    return Container(
      padding: const EdgeInsets.all(14),
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFFF3F4F6)),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Text(doc.fileIcon, style: const TextStyle(fontSize: 24)),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(doc.nomFichier,
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                        maxLines: 1, overflow: TextOverflow.ellipsis),
                    Text(_docTypeLabel(doc.type),
                        style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                  ],
                ),
              ),
              _buildIAChip(doc),
            ],
          ),

          // Type inconsistency alert
          if (doc.hasTypeInconsistency) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF3C7),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                '⚠️ L\'IA a détecté: ${_docTypeLabel(doc.typeDetecteIA!)} (déclaré: ${_docTypeLabel(doc.type)})',
                style: const TextStyle(fontSize: 11, color: Color(0xFF92400E)),
              ),
            ),
          ],

          // Anomalies
          if (doc.analyseIA?['anomalies'] != null &&
              (doc.analyseIA!['anomalies'] as List).isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFFEE2E2),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('⚠️ Incohérences:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF991B1B))),
                  ...((doc.analyseIA!['anomalies'] as List).map((a) => Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text('• $a', style: const TextStyle(fontSize: 11, color: Color(0xFF991B1B))),
                  ))),
                ],
              ),
            ),
          ],

          // IA Results - VALIDE
          if (doc.isValidatedByIA && doc.analyseIA != null) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFBBF7D0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Prestataire + Patient
                  if (doc.analyseIA!['prestataire']?['nom'] != null ||
                      doc.analyseIA!['patient']?['nom'] != null)
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (doc.analyseIA!['prestataire']?['nom'] != null)
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('🏥 ÉTABLISSEMENT', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: Color(0xFF166534))),
                                Text(doc.analyseIA!['prestataire']['nom'],
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF166534))),
                                if (doc.analyseIA!['prestataire']?['medecin'] != null)
                                  Text('Dr ${doc.analyseIA!['prestataire']['medecin']}',
                                      style: const TextStyle(fontSize: 11, color: Color(0xFF166534))),
                              ],
                            ),
                          ),
                        if (doc.analyseIA!['patient']?['nom'] != null)
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('👤 PATIENT', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: Color(0xFF166534))),
                                Text(doc.analyseIA!['patient']['nom'],
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF166534))),
                              ],
                            ),
                          ),
                      ],
                    ),

                  // Montants
                  if (doc.analyseIA!['remboursement']?['montant_rembourse'] != null) ...[
                    const SizedBox(height: 10),
                    const Divider(height: 1, color: Color(0xFFBBF7D0)),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 12,
                      runSpacing: 8,
                      children: [
                        if (doc.analyseIA!['facture']?['montant_ttc'] != null)
                          _iaAmountChip('Total TTC', '${doc.analyseIA!['facture']['montant_ttc']} TND'),
                        if (doc.analyseIA!['remboursement']?['taux_applique'] != null)
                          _iaAmountChip('Taux', '${((doc.analyseIA!['remboursement']['taux_applique'] as num) * 100).toStringAsFixed(0)}%'),
                        _iaAmountChip('Remboursement', '${doc.analyseIA!['remboursement']['montant_rembourse']} TND', isBold: true),
                      ],
                    ),
                  ],

                  // Score
                  if (doc.scoreConfidenceIA != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      '📊 Confiance IA : ${(doc.scoreConfidenceIA! * 100).toStringAsFixed(0)}%',
                      style: const TextStyle(fontSize: 11, color: Color(0xFF166534)),
                    ),
                  ],
                ],
              ),
            ),
          ],

          // IA Results - INVALIDE
          if (doc.isInvalidByIA) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFFEE2E2),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFFCA5A5)),
              ),
              child: Text(
                doc.resultatIA ?? 'Document non reconnu comme facture médicale valide.',
                style: const TextStyle(fontSize: 12, color: Color(0xFF991B1B)),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _iaAmountChip(String label, String value, {bool isBold = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: isBold ? const Color(0xFFDCFCE7) : Colors.white.withOpacity(0.6),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label.toUpperCase(), style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: Color(0xFF166534))),
          Text(value, style: TextStyle(
            fontSize: isBold ? 15 : 13,
            fontWeight: FontWeight.w700,
            color: isBold ? const Color(0xFF15803D) : const Color(0xFF166534),
          )),
        ],
      ),
    );
  }

  Widget _buildIAChip(DocumentModel doc) {
    if (doc.isPendingIA) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: const Color(0xFFFEF3C7),
          borderRadius: BorderRadius.circular(99),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 10, height: 10,
              child: CircularProgressIndicator(strokeWidth: 1.5, color: AppTheme.warning),
            ),
            const SizedBox(width: 4),
            const Text('Analyse IA...', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFFCA8A04))),
          ],
        ),
      );
    }
    if (doc.isValidatedByIA) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: const Color(0xFFDCFCE7),
          borderRadius: BorderRadius.circular(99),
        ),
        child: const Text('✅ Validée', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF16A34A))),
      );
    }
    if (doc.isInvalidByIA) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: const Color(0xFFFEE2E2),
          borderRadius: BorderRadius.circular(99),
        ),
        child: const Text('❌ Invalide', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFFDC2626))),
      );
    }
    return const SizedBox.shrink();
  }

// ── Upload Bottom Sheet ──
  Widget _buildUploadSheet() {
    return GestureDetector(
      onTap: () => setState(() => _showUploadSheet = false),
      child: Container(
        color: Colors.black.withOpacity(0.5),
        child: GestureDetector(
          onTap: () {},
          child: Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.75),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Handle de glissement
                  Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Container(
                      width: 40, height: 4,
                      decoration: BoxDecoration(
                        color: const Color(0xFFE5E7EB),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  // Header
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Ajouter un document', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        GestureDetector(
                          onTap: () => setState(() => _showUploadSheet = false),
                          child: const Icon(Icons.close, color: AppTheme.textSecondary),
                        ),
                      ],
                    ),
                  ),
                  const Divider(height: 1),
                  // Liste des catégories de documents
                  Flexible(
                    child: ListView(
                      padding: const EdgeInsets.all(16),
                      shrinkWrap: true,
                      children: _filteredDocCats.map((cat) {
                        final isSelected = _selectedDocType == cat['key'];
                        
                        // 1. Compter combien de documents de ce type sont déjà téléversés
                        final uploadedDocsCount = _dossier!.documents.where((d) => d.type == cat['key']).length;
                        final hasDocuments = uploadedDocsCount > 0;

                        return GestureDetector(
                          // 2. Le bouton reste cliquable pour permettre l'ajout multiple !
                          onTap: () {
                            setState(() => _selectedDocType = cat['key']!);
                            _showSourceActionSheet();
                          },
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              border: Border.all(
                                color: isSelected 
                                    ? AppTheme.primary 
                                    : hasDocuments 
                                        ? AppTheme.success.withOpacity(0.5) 
                                        : const Color(0xFFE5E7EB),
                                width: 1.5,
                              ),
                              borderRadius: BorderRadius.circular(12),
                              // Un fond légèrement teinté si la catégorie contient déjà des éléments
                              color: hasDocuments ? const Color(0xFFF8FAFC) : Colors.white,
                            ),
                            child: Row(
                              children: [
                                Text(cat['icon']!, style: const TextStyle(fontSize: 24)),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Text(cat['label']!, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                                          
                                          // 3. Affichage d'un badge avec le nombre de fichiers déjà ajoutés
                                          if (hasDocuments) ...[
                                            const SizedBox(width: 8),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFDCFCE7),
                                                borderRadius: BorderRadius.circular(6),
                                              ),
                                              child: Text(
                                                '$uploadedDocsCount envoyé(s)',
                                                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF16A34A)),
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                      Text(cat['hint']!, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                                    ],
                                  ),
                                ),
                                if (_isUploading && isSelected)
                                  const SizedBox(
                                    width: 18, height: 18,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  )
                                else
                                  // Laisse l'icône d'ajout visible pour inviter à en ajouter d'autres
                                  const Icon(Icons.add_photo_alternate_outlined, color: AppTheme.textSecondary),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ── Helpers ──
  Widget _buildCard({required String title, Widget? trailing, required Widget child}) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                if (trailing != null) trailing,
              ],
            ),
          ),
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.all(16),
            child: child,
          ),
        ],
      ),
    );
  }

  Widget _buildAlertCard(String emoji, String title, String message, Color bg, Color textColor) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: textColor.withOpacity(0.2)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 18)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: textColor)),
                const SizedBox(height: 3),
                Text(message, style: TextStyle(fontSize: 13, color: textColor)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWhiteStatusBadge(String status) {
    const labels = {
      'BROUILLON': 'Brouillon', 'SOUMIS': 'Soumis', 'A_VERIFIER': 'À vérifier',
      'EN_COURS': 'En cours', 'INCOMPLET': 'Incomplet', 'APPROUVE': 'Approuvé', 'REJETE': 'Rejeté',
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.15),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        labels[status] ?? status,
        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 11),
      ),
    );
  }

  Widget _metaItem(String label, String value, {Color? color}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
        Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: color ?? AppTheme.textPrimary)),
      ],
    );
  }

  Widget _metaChip(String label, String value, {bool isGreen = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(), style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: AppTheme.textSecondary)),
        const SizedBox(height: 2),
        Text(value, style: TextStyle(
          fontSize: 13, fontWeight: FontWeight.w700,
          color: isGreen ? AppTheme.success : AppTheme.textPrimary,
        )),
      ],
    );
  }

  String _docTypeLabel(String type) {
    const labels = {
      'ORDONNANCE': 'Ordonnance', 'FACTURE': 'Facture', 'FACTURE_PHARMACIE': 'Facture Pharmacie',
      'FACTURE_RADIO': 'Facture Radio', 'FACTURE_SCANNER': 'Facture Scanner',
      'FACTURE_LABO': 'Facture Labo', 'FACTURE_IRM': 'Facture IRM',
      'BULLETIN_SORTIE': 'Bulletin de sortie', 'ANALYSE': 'Analyse',
      'RADIO': 'Radiographie', 'SCANNER': 'Scanner', 'AUTRE': 'Autre',
      'VISITE_MEDICALE': 'Visite médicale', 'BON_DE_CAISSE': 'Bon de caisse',
      'LETTRE_CONFIDENTIELLE': 'Lettre confidentielle', 'RAPPORT_MEDICAL': 'Rapport médical',
    };
    return labels[type] ?? type;
  }
}
