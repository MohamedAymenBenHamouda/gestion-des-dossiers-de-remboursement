import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/dossier_provider.dart';
import '../models/dossier_model.dart';
import '../config/app_theme.dart';
import '../services/dossier_service.dart';
import 'package:intl/intl.dart';

class DossiersScreen extends StatefulWidget {
  final VoidCallback? onOpenDrawer;
  const DossiersScreen({Key? key, this.onOpenDrawer}) : super(key: key);

  @override
  State<DossiersScreen> createState() => _DossiersScreenState();
}

class _DossiersScreenState extends State<DossiersScreen> {
  String _activeFilter = '';
  bool _inited = false;

  // Create dossier modal state
  bool _showCreateModal = false;
  bool _creating = false;
  String _createError = '';
  String _newTypeSoin = '';
  String _newDescription = 'Nouveau dossier';
  final _descController = TextEditingController(text: 'Nouveau dossier');
  List<dynamic> _familyMembers = [];
  int? _selectedBeneficiaryId;

  final _filters = [
    {'key': '', 'icon': '🗂️', 'label': 'Tous'},
    {'key': 'BROUILLON', 'icon': '✏️', 'label': 'Brouillon'},
    {'key': 'SOUMIS', 'icon': '📤', 'label': 'Soumis'},
    {'key': 'EN_COURS', 'icon': '⚙️', 'label': 'En cours'},
    {'key': 'INCOMPLET', 'icon': '⚠️', 'label': 'Incomplets'},
    {'key': 'APPROUVE', 'icon': '✅', 'label': 'Approuvés'},
    {'key': 'REJETE', 'icon': '❌', 'label': 'Rejetés'},
  ];

  final _typeSoinsOptions = [
    {'key': 'CONSULTATION', 'label': 'Consultation'},
    {'key': 'HOSPITALISATION', 'label': 'Hospitalisation'},
    {'key': 'DENTAIRE', 'label': 'Soins Dentaires'},
    {'key': 'OPTIQUE', 'label': 'Optique'},
    {'key': 'ALD', 'label': 'Maladie Chronique (ALD)'},
    {'key': 'PHARMACIE', 'label': 'Pharmacie'},
  ];

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_inited) {
      Provider.of<DossierProvider>(context, listen: false).fetchDossiers();
      _inited = true;
    }
  }

  @override
  void dispose() {
    _descController.dispose();
    super.dispose();
  }

  Future<void> _loadFamilyMembers() async {
    try {
      final svc = await DossierService.create();
      final list = await svc.getFamilyMembers();
      if (mounted) setState(() => _familyMembers = list);
    } catch (e) {
      debugPrint('Failed to load family members: $e');
    }
  }

  Future<void> _creerDossier() async {
    if (_newTypeSoin.isEmpty) return;
    setState(() {
      _creating = true;
      _createError = '';
    });

    try {
      final prov = Provider.of<DossierProvider>(context, listen: false);
      final dossier = await prov.createDossier(
        description: _descController.text,
        typeSoin: _newTypeSoin,
        beneficiaryId: _selectedBeneficiaryId,
      );
      if (mounted) {
        setState(() {
          _showCreateModal = false;
          _creating = false;
        });
        Navigator.pushNamed(context, '/dossiers/detail', arguments: dossier.id);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _creating = false;
          _createError = 'Erreur lors de la création du dossier.';
        });
      }
    }
  }

  String _formatDate(String? isoString) {
    if (isoString == null || isoString.isEmpty) return '';
    try {
      return DateFormat('dd MMM yyyy').format(DateTime.parse(isoString));
    } catch (_) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final prov = Provider.of<DossierProvider>(context);
    final filtered = prov.filtered(_activeFilter);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        leading: GestureDetector(
          onTap: widget.onOpenDrawer,
          child: Container(
            margin: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppTheme.primary.withOpacity(0.08),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(
              Icons.menu,
              color: AppTheme.primary,
              size: 20,
            ),
          ),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Mes dossiers', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            Text(
              '${prov.totalDossiers} dossier(s)',
              style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary, fontWeight: FontWeight.normal),
            ),
          ],
        ),
        actions: [
          TextButton.icon(
            onPressed: () => setState(() {
              _showCreateModal = true;
              _newTypeSoin = '';
              _descController.text = 'Nouveau dossier';
              _createError = '';
              _selectedBeneficiaryId = null;
              _loadFamilyMembers();
            }),
            icon: const Icon(Icons.add, size: 18),
            label: const Text('Nouveau', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
        ],
      ),
      body: Column(
        children: [
          // ── Filter Pills ──
          SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _filters.length,
              separatorBuilder: (_, __) => const SizedBox(width: 6),
              itemBuilder: (context, idx) {
                final f = _filters[idx];
                final isActive = _activeFilter == f['key'];
                final count = f['key']!.isEmpty ? 0 : prov.countFor(f['key']!);

                return GestureDetector(
                  onTap: () => setState(() => _activeFilter = f['key']!),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    decoration: BoxDecoration(
                      color: isActive ? AppTheme.primary : Colors.white,
                      borderRadius: BorderRadius.circular(99),
                      border: Border.all(
                        color: isActive ? AppTheme.primary : const Color(0xFFE5E7EB),
                        width: 1.5,
                      ),
                    ),
                    alignment: Alignment.center,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '${f['icon']} ${f['label']}',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: isActive ? Colors.white : AppTheme.textSecondary,
                          ),
                        ),
                        if (count > 0 && f['key']!.isNotEmpty) ...[
                          const SizedBox(width: 5),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                            decoration: BoxDecoration(
                              color: isActive ? Colors.white.withOpacity(0.25) : const Color(0xFFF3F4F6),
                              borderRadius: BorderRadius.circular(99),
                            ),
                            child: Text(
                              count.toString(),
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                color: isActive ? Colors.white : AppTheme.textSecondary,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          const SizedBox(height: 12),

          // ── Dossier List ──
          Expanded(
            child: prov.loading
                ? _buildSkeletons()
                : filtered.isEmpty
                    ? _buildEmptyState()
                    : RefreshIndicator(
                        onRefresh: () => prov.fetchDossiers(),
                        child: ListView.separated(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: filtered.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (_, idx) => _buildDossierCard(filtered[idx]),
                        ),
                      ),
          ),

          // ── Create Modal (bottom sheet overlay) ──
          if (_showCreateModal) _buildCreateOverlay(),
        ],
      ),
    );
  }

  // ── Skeleton loading ──
  Widget _buildSkeletons() {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: 3,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (_, __) => Container(
        height: 95,
        decoration: BoxDecoration(
          color: const Color(0xFFE5E7EB),
          borderRadius: BorderRadius.circular(14),
        ),
      ),
    );
  }

  // ── Empty state ──
  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text('📋', style: TextStyle(fontSize: 60)),
          const SizedBox(height: 16),
          Text(
            'Aucun dossier',
            style: Theme.of(context).textTheme.displayMedium?.copyWith(fontSize: 20),
          ),
          const SizedBox(height: 8),
          const Text(
            'Cliquez sur "+ Nouveau" pour commencer',
            style: TextStyle(color: AppTheme.textSecondary),
          ),
        ],
      ),
    );
  }

  // ── Dossier Card ──
  Widget _buildDossierCard(DossierModel d) {
    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, '/dossiers/detail', arguments: d.id),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFF3F4F6)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top row
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        d.numeroDossier,
                        style: const TextStyle(
                          fontFamily: 'monospace',
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.primary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        d.description.isNotEmpty ? d.description : d.typeSoinLabel,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
                _buildStatusBadge(d.statut),
              ],
            ),

            // Agent message
            if (d.messageAgent != null && d.messageAgent!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '💬 ${d.messageAgent}',
                  style: const TextStyle(fontSize: 11, color: Color(0xFF92400E)),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],

            // Footer
            const SizedBox(height: 12),
            const Divider(height: 1),
            const SizedBox(height: 10),
            Row(
              children: [
                Row(
                  children: [
                    const Text('📎', style: TextStyle(fontSize: 12)),
                    const SizedBox(width: 3),
                    Text(
                      '${d.documents.length} doc(s)',
                      style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                    ),
                    const SizedBox(width: 8),
                    const Text('📅', style: TextStyle(fontSize: 12)),
                    const SizedBox(width: 3),
                    Text(
                      _formatDate(d.createdAt),
                      style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                    ),
                  ],
                ),
                const Spacer(),
                if (d.isApprouve && d.montantRembourse != null)
                  Text(
                    '✅ ${d.montantRembourse!.toStringAsFixed(2)} TND',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.success,
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    const colors = {
      'BROUILLON': (Color(0xFFF1F5F9), Color(0xFF64748B)),
      'SOUMIS': (Color(0xFFEFF6FF), Color(0xFF3B82F6)),
      'A_VERIFIER': (Color(0xFFEFF6FF), Color(0xFF3B82F6)),
      'EN_COURS': (Color(0xFFFEFCE8), Color(0xFFCA8A04)),
      'INCOMPLET': (Color(0xFFFFF7ED), Color(0xFFEA580C)),
      'APPROUVE': (Color(0xFFF0FDF4), Color(0xFF16A34A)),
      'REJETE': (Color(0xFFFEF2F2), Color(0xFFDC2626)),
    };
    const labels = {
      'BROUILLON': 'Brouillon', 'SOUMIS': 'Soumis',
      'A_VERIFIER': 'À vérifier', 'EN_COURS': 'En cours',
      'INCOMPLET': 'Incomplet', 'APPROUVE': 'Approuvé', 'REJETE': 'Rejeté',
    };
    final c = colors[status] ?? (const Color(0xFFF1F5F9), const Color(0xFF64748B));
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: c.$1,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        labels[status] ?? status,
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: c.$2),
      ),
    );
  }

  // ── Create Dossier Overlay ──
  Widget _buildCreateOverlay() {
    return GestureDetector(
      onTap: () => setState(() => _showCreateModal = false),
      child: Container(
        color: Colors.black.withOpacity(0.5),
        child: GestureDetector(
          onTap: () {}, // block tap through
          child: Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(24, 28, 24, 32),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Handle
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: const Color(0xFFE5E7EB),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  const Text(
                    'Nouveau Dossier Médical',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                  ),
                  const SizedBox(height: 20),

                  // Type de soin
                  Text('TYPE DE SOIN', style: _labelStyle),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    value: _newTypeSoin.isEmpty ? null : _newTypeSoin,
                    decoration: const InputDecoration(
                      hintText: '-- Sélectionnez un type --',
                    ),
                    items: _typeSoinsOptions.map((t) => DropdownMenuItem(
                      value: t['key'],
                      child: Text(t['label']!),
                    )).toList(),
                    onChanged: (v) => setState(() => _newTypeSoin = v ?? ''),
                  ),

                  const SizedBox(height: 16),

                    // Beneficiaire
                    Text('POUR', style: _labelStyle),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<int?>(
                      value: _selectedBeneficiaryId,
                      decoration: const InputDecoration(hintText: '-- Pour qui --'),
                      items: [
                        DropdownMenuItem<int?>(value: null, child: Text('Moi-même')),
                        ..._familyMembers.map((f) => DropdownMenuItem<int?>(value: f['id'] as int, child: Text('${f['prenom']} ${f['nom']} — ${f['relation']}'))).toList(),
                      ],
                      onChanged: (v) => setState(() => _selectedBeneficiaryId = v),
                    ),


                  // Description
                  Text('DESCRIPTION', style: _labelStyle),
                  const SizedBox(height: 6),
                  TextFormField(
                    controller: _descController,
                    decoration: const InputDecoration(
                      hintText: 'Ex: Consultation dentaire du 12/05...',
                    ),
                  ),

                  if (_createError.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppTheme.danger.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '⚠️ $_createError',
                        style: const TextStyle(fontSize: 13, color: AppTheme.danger),
                      ),
                    ),
                  ],

                  const SizedBox(height: 24),

                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => setState(() => _showCreateModal = false),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          child: const Text('Annuler'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _creating || _newTypeSoin.isEmpty ? null : _creerDossier,
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          child: _creating
                              ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : const Text('Créer', style: TextStyle(color: Colors.white)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  TextStyle get _labelStyle => const TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w700,
    color: AppTheme.textSecondary,
    letterSpacing: 0.5,
  );
}
