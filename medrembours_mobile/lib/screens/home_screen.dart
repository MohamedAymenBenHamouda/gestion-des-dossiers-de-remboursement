import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/dossier_provider.dart';
import '../services/auth_service.dart';
import '../models/dossier_model.dart';
import '../config/app_theme.dart';
class HomeScreen extends StatefulWidget {
  final VoidCallback? onOpenDrawer;
  final Function(int)? onNavigate;
  const HomeScreen({Key? key, this.onOpenDrawer, this.onNavigate}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<DossierProvider>(context, listen: false).fetchDossiers();
    });
  }

  String get _greetingText {
    final h = DateTime.now().hour;
    if (h < 12) return 'Bonjour 👋';
    if (h < 18) return 'Bon après-midi 👋';
    return 'Bonsoir 👋';
  }

  String get _dateText {
    return DateFormat("EEEE d MMMM yyyy", 'fr_FR').format(DateTime.now());
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthService>(context).currentUser;
    final prov = Provider.of<DossierProvider>(context);

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: RefreshIndicator(
        onRefresh: () => prov.fetchDossiers(),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // ── Hero Banner ──
            SliverToBoxAdapter(
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(20, 52, 20, 24),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color(0xFF0F172A),
                      Color(0xFF1E3A5F),
                      AppTheme.primaryDark,
                    ],
                  ),
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(24),
                    bottomRight: Radius.circular(24),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── Hamburger + Titre ──
                    Row(
                      children: [
                        GestureDetector(
                          onTap: widget.onOpenDrawer,
                          child: Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: Colors.white.withOpacity(0.15),
                              ),
                            ),
                            child: const Icon(
                              Icons.menu,
                              color: Colors.white,
                              size: 22,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          'MedRembours',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: Colors.white.withOpacity(0.85),
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Greeting
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _greetingText,
                                style: TextStyle(
                                  fontSize: 13,
                                  color: Colors.white.withOpacity(0.55),
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                user?.fullName ?? 'Assuré',
                                style: const TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _dateText,
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.white.withOpacity(0.4),
                                ),
                              ),
                              const SizedBox(height: 10),
                              // Badge couverture active
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                decoration: BoxDecoration(
                                  color: AppTheme.success.withOpacity(0.18),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(color: AppTheme.success.withOpacity(0.5)),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      width: 7, height: 7,
                                      decoration: const BoxDecoration(color: AppTheme.success, shape: BoxShape.circle),
                                    ),
                                    const SizedBox(width: 6),
                                    const Text(
                                      'Couverture active',
                                      style: TextStyle(color: AppTheme.success, fontSize: 11, fontWeight: FontWeight.w700),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 16),
                        // Protection Shield Card
                        Container(
                          width: 90,
                          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.07),
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: Colors.white.withOpacity(0.13)),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Stack(
                                alignment: Alignment.center,
                                children: [
                                  Container(
                                    width: 52, height: 52,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      gradient: LinearGradient(
                                        colors: [AppTheme.success.withOpacity(0.3), AppTheme.accent.withOpacity(0.2)],
                                      ),
                                    ),
                                  ),
                                  const Icon(Icons.verified_user_rounded, color: AppTheme.success, size: 30),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Text(
                                user?.initials ?? '?',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 16,
                                  letterSpacing: 1,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'ASSURÉ',
                                style: TextStyle(
                                  color: AppTheme.accent.withOpacity(0.85),
                                  fontSize: 8,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 1.2,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // ── Alerte Incomplets ── CORRECTION
if (prov.dossiersIncomplets > 0)
  SliverToBoxAdapter(
    child: Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      padding: const EdgeInsets.symmetric(
          horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF3C7),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
            color: const Color(0xFFFDE68A), width: 1.5),
      ),
      child: Row(
        children: [
          const Text('⚠️', style: TextStyle(fontSize: 18)),
          const SizedBox(width: 10),
          Expanded(
            child: RichText(
              text: TextSpan(
                style: const TextStyle(
                    fontSize: 13, color: Color(0xFF92400E)),
                children: [
                  TextSpan(
                    text:
                        '${prov.dossiersIncomplets} dossier(s) incomplet(s)',
                    style: const TextStyle(
                        fontWeight: FontWeight.bold),
                  ),
                  const TextSpan(
                      text:
                          ' — documents supplémentaires demandés'),
                ],
              ),
            ),
          ),
          GestureDetector(
            // ✅ CORRECTION : utiliser onNavigate au lieu de
            // DefaultTabController.of(context)
            onTap: () => widget.onNavigate?.call(1),
            child: Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AppTheme.warning,
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text(
                'Compléter →',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ],
      ),
    ),
  ),

            // ── KPI Cards ──
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: _KpiCard(
                            icon: '📁',
                            iconBg: AppTheme.primary.withOpacity(0.1),
                            value: prov.totalDossiers.toString(),
                            label: 'Total dossiers',
                            barColor: AppTheme.primary,
                            barPct: 1.0,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _KpiCard(
                            icon: '⚙️',
                            iconBg: AppTheme.warning.withOpacity(0.15),
                            value: prov.dossiersEnCours.toString(),
                            label: 'En traitement',
                            barColor: AppTheme.warning,
                            barPct: prov.totalDossiers > 0
                                ? prov.dossiersEnCours / prov.totalDossiers
                                : 0,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: _KpiCard(
                            icon: '✅',
                            iconBg: AppTheme.success.withOpacity(0.12),
                            value: prov.dossiersApprouves.toString(),
                            label: 'Approuvés',
                            barColor: AppTheme.success,
                            barPct: prov.totalDossiers > 0
                                ? prov.dossiersApprouves / prov.totalDossiers
                                : 0,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _KpiCard(
                            icon: '💰',
                            iconBg: const Color(0xFFF0FDF4),
                            value:
                                '${prov.montantTotalRembourse.toStringAsFixed(0)} TND',
                            label: 'Total remboursé',
                            barColor: AppTheme.success,
                            barPct: prov.totalDossiers > 0
                                ? prov.dossiersApprouves / prov.totalDossiers
                                : 0,
                            isSmallValue: true,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // ── Loading skeleton ──
            if (prov.loading)
              SliverToBoxAdapter(
                child: Container(
                  margin: const EdgeInsets.all(16),
                  height: 220,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE5E7EB),
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),

            // ── Dernier Dossier Spotlight ──
            if (!prov.loading && prov.dernierDossier != null)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _sectionTitle('📌 Dernier dossier'),
                      const SizedBox(height: 10),
                      _SpotlightCard(dossier: prov.dernierDossier!),
                    ],
                  ),
                ),
              ),

            // ── Raccourcis ── CORRECTION
SliverToBoxAdapter(
  child: Padding(
    padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionTitle('⚡ Accès rapide'),
        const SizedBox(height: 10),
        Row(
          children: [
            _ShortcutCard(
              icon: '📝',
              label: 'Mes dossiers',
              // ✅ CORRECTION : utiliser onNavigate(1)
              onTap: () => widget.onNavigate?.call(1),
            ),
            const SizedBox(width: 10),
            _ShortcutCard(
              icon: '👤',
              label: 'Mon profil',
              // ✅ CORRECTION : utiliser onNavigate(2)
              onTap: () => widget.onNavigate?.call(2),
            ),
            const SizedBox(width: 10),
            _ShortcutCard(
              icon: '💸',
              label: 'Historique',
              onTap: () =>
                  Navigator.pushNamed(context, '/historique'),
            ),
          ],
        ),
      ],
    ),
  ),
),
            // ── Historique Récent ──
            if (!prov.loading && prov.recentDossiers.isNotEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _sectionTitle('🕐 Historique récent'),
                          GestureDetector(
                            onTap: () => widget.onNavigate?.call(1),
                            child: const Text(
                              'Tout voir →',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.primary,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      ...prov.recentDossiers.map(
                        (d) => _HistoryRow(
                          dossier: d,
                          onTap: () => Navigator.pushNamed(
                            context,
                            '/dossiers/detail',
                            arguments: d.id,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // ── Empty State ──
            if (!prov.loading && prov.dossiers.isEmpty)
              SliverToBoxAdapter(
                child: Container(
                  margin: const EdgeInsets.all(16),
                  padding: const EdgeInsets.symmetric(vertical: 40),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(
                      color: const Color(0xFFE5E7EB),
                      width: 2,
                      style: BorderStyle.solid,
                    ),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Column(
                    children: [
                      const Text('📋',
                          style: TextStyle(fontSize: 48)),
                      const SizedBox(height: 12),
                      const Text(
                        'Aucun dossier pour l\'instant',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 16,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Créez votre premier dossier de remboursement',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () =>
                            DefaultTabController.of(context).animateTo(1),
                        child: const Text('+ Créer un dossier'),
                      ),
                    ],
                  ),
                ),
              ),

            const SliverToBoxAdapter(child: SizedBox(height: 24)),
          ],
        ),
      ),
    );
  }

  Widget _sectionTitle(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w800,
        color: AppTheme.textSecondary,
        letterSpacing: 0.5,
      ),
    );
  }
}

// ═══════════════════════════════════════════════
// KPI Card
// ═══════════════════════════════════════════════
class _KpiCard extends StatelessWidget {
  final String icon;
  final Color iconBg;
  final String value;
  final String label;
  final Color barColor;
  final double barPct;
  final bool isSmallValue;

  const _KpiCard({
    required this.icon,
    required this.iconBg,
    required this.value,
    required this.label,
    required this.barColor,
    required this.barPct,
    this.isSmallValue = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFF3F4F6)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: iconBg,
              borderRadius: BorderRadius.circular(8),
            ),
            alignment: Alignment.center,
            child: Text(icon, style: const TextStyle(fontSize: 18)),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: TextStyle(
              fontSize: isSmallValue ? 16 : 26,
              fontWeight: FontWeight.w800,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: AppTheme.textSecondary,
              letterSpacing: 0.3,
            ),
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: barPct.clamp(0.02, 1.0),
              backgroundColor: const Color(0xFFF3F4F6),
              valueColor: AlwaysStoppedAnimation(barColor),
              minHeight: 4,
            ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════
// Spotlight Card (dernier dossier)
// ═══════════════════════════════════════════════
class _SpotlightCard extends StatelessWidget {
  final DossierModel dossier;
  const _SpotlightCard({required this.dossier});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.pushNamed(
        context,
        '/dossiers/detail',
        arguments: dossier.id,
      ),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFE5E7EB)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      dossier.numeroDossier,
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.primary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      dossier.description.isNotEmpty
                          ? dossier.description
                          : 'Sans description',
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                  ],
                ),
                _StatusBadge(status: dossier.statut),
              ],
            ),

            // Message agent
            if (dossier.messageAgent != null &&
                dossier.messageAgent!.isNotEmpty) ...[
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '💬 ${dossier.messageAgent}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF92400E),
                  ),
                ),
              ),
            ],

            // Amounts
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF9FAFB),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  if (dossier.montantTotal != null)
                    _AmountChip(
                        label: 'Montant demandé',
                        value:
                            '${dossier.montantTotal!.toStringAsFixed(2)} TND'),
                  if (dossier.isApprouve && dossier.montantRembourse != null)
                    _AmountChip(
                        label: 'Remboursé',
                        value:
                            '${dossier.montantRembourse!.toStringAsFixed(2)} TND',
                        isGreen: true),
                  _AmountChip(
                      label: 'Créé le',
                      value: _formatDate(dossier.createdAt)),
                ],
              ),
            ),

            // Workflow stepper
            const SizedBox(height: 16),
            _WorkflowStepper(status: dossier.statut),

            // CTA
            const SizedBox(height: 14),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              alignment: Alignment.center,
              child: const Text(
                'Voir le dossier complet →',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.primary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(String? iso) {
    if (iso == null || iso.isEmpty) return 'N/A';
    try {
      return DateFormat('dd MMM yyyy').format(DateTime.parse(iso));
    } catch (_) {
      return iso;
    }
  }
}

// ═══════════════════════════════════════════════
// Workflow Stepper
// ═══════════════════════════════════════════════
class _WorkflowStepper extends StatelessWidget {
  final String status;
  const _WorkflowStepper({required this.status});

  static const _steps = [
    {'key': 'BROUILLON', 'label': 'Créé', 'icon': '✏️'},
    {'key': 'SOUMIS', 'label': 'Soumis', 'icon': '📤'},
    {'key': 'EN_COURS', 'label': 'Analyse', 'icon': '⚙️'},
    {'key': 'FINAL', 'label': 'Terminé', 'icon': '🏁'},
  ];

  static const _order = ['BROUILLON', 'SOUMIS', 'EN_COURS', 'APPROUVE', 'REJETE'];

  bool _isDone(String key) {
    if (key == 'FINAL') return status == 'APPROUVE' || status == 'REJETE';
    final si = _order.indexOf(key);
    final ci = _order.indexOf(status);
    return si >= 0 && ci >= 0 && si < ci;
  }

  bool _isActive(String key) {
    if (key == 'FINAL') return status == 'APPROUVE' || status == 'REJETE';
    return status == key;
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(_steps.length * 2 - 1, (i) {
        if (i.isOdd) {
          final prevStep = _steps[i ~/ 2]['key']!;
          return Expanded(
            child: Container(
              height: 2,
              margin: const EdgeInsets.only(bottom: 16),
              color: _isDone(prevStep)
                  ? AppTheme.primary
                  : const Color(0xFFE5E7EB),
            ),
          );
        }
        final step = _steps[i ~/ 2];
        final done = _isDone(step['key']!);
        final active = _isActive(step['key']!);
        return Column(
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: active
                    ? AppTheme.primary
                    : done
                        ? AppTheme.primary.withOpacity(0.1)
                        : const Color(0xFFF3F4F6),
                shape: BoxShape.circle,
                border: Border.all(
                  color: active || done
                      ? AppTheme.primary
                      : const Color(0xFFE5E7EB),
                  width: 2,
                ),
                boxShadow: active
                    ? [
                        BoxShadow(
                          color: AppTheme.primary.withOpacity(0.3),
                          blurRadius: 8,
                          spreadRadius: 2,
                        )
                      ]
                    : null,
              ),
              alignment: Alignment.center,
              child: (done || active)
                  ? Text(step['icon']!, style: TextStyle(fontSize: active ? 12 : 10))
                  : null,
            ),
            const SizedBox(height: 4),
            Text(
              step['label']!,
              style: TextStyle(
                fontSize: 8,
                fontWeight: active ? FontWeight.w800 : FontWeight.w700,
                color: active || done
                    ? AppTheme.primary
                    : AppTheme.textSecondary,
              ),
            ),
          ],
        );
      }),
    );
  }
}

// ═══════════════════════════════════════════════
// Shortcut Card
// ═══════════════════════════════════════════════
class _ShortcutCard extends StatelessWidget {
  final String icon;
  final String label;
  final VoidCallback onTap;

  const _ShortcutCard({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 8),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFF3F4F6)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.03),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            children: [
              Text(icon, style: const TextStyle(fontSize: 24)),
              const SizedBox(height: 8),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════
// History Row
// ═══════════════════════════════════════════════
class _HistoryRow extends StatelessWidget {
  final DossierModel dossier;
  final VoidCallback onTap;

  const _HistoryRow({required this.dossier, required this.onTap});

  static const _statutIcons = {
    'BROUILLON': '✏️', 'SOUMIS': '📤', 'EN_COURS': '⚙️',
    'INCOMPLET': '⚠️', 'APPROUVE': '✅', 'REJETE': '❌', 'A_VERIFIER': '🔍',
  };

  static const _statutBg = {
    'BROUILLON': Color(0xFFF3F4F6), 'SOUMIS': Color(0xFFDBEAFE),
    'EN_COURS': Color(0xFFFEF3C7), 'INCOMPLET': Color(0xFFFFEDD5),
    'APPROUVE': Color(0xFFDCFCE7), 'REJETE': Color(0xFFFEE2E2),
    'A_VERIFIER': Color(0xFFDBEAFE),
  };

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFF3F4F6)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 6,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: _statutBg[dossier.statut] ?? const Color(0xFFF3F4F6),
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child: Text(
                _statutIcons[dossier.statut] ?? '📁',
                style: const TextStyle(fontSize: 15),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        dossier.numeroDossier,
                        style: const TextStyle(
                          fontFamily: 'monospace',
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.primary,
                        ),
                      ),
                      Text(
                        _formatDate(dossier.createdAt),
                        style: const TextStyle(
                          fontSize: 10,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(
                    dossier.description.isNotEmpty
                        ? dossier.description
                        : 'Sans description',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppTheme.textSecondary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                if (dossier.isApprouve && dossier.montantRembourse != null)
                  Text(
                    '+${dossier.montantRembourse!.toStringAsFixed(0)} TND',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.success,
                    ),
                  ),
                const SizedBox(height: 2),
                _StatusBadge(status: dossier.statut, small: true),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(String? iso) {
    if (iso == null) return '';
    try {
      return DateFormat('dd/MM/yy').format(DateTime.parse(iso));
    } catch (_) {
      return '';
    }
  }
}

// ═══════════════════════════════════════════════
// Amount Chip
// ═══════════════════════════════════════════════
class _AmountChip extends StatelessWidget {
  final String label;
  final String value;
  final bool isGreen;

  const _AmountChip({
    required this.label,
    required this.value,
    this.isGreen = false,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              fontSize: 8,
              fontWeight: FontWeight.w700,
              color: AppTheme.textSecondary,
              letterSpacing: 0.3,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: isGreen ? AppTheme.success : AppTheme.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════
// Status Badge (shared)
// ═══════════════════════════════════════════════
class _StatusBadge extends StatelessWidget {
  final String status;
  final bool small;

  const _StatusBadge({required this.status, this.small = false});

  static const _colors = {
    'BROUILLON': (Color(0xFFF1F5F9), Color(0xFF64748B)),
    'SOUMIS': (Color(0xFFEFF6FF), Color(0xFF3B82F6)),
    'A_VERIFIER': (Color(0xFFEFF6FF), Color(0xFF3B82F6)),
    'EN_COURS': (Color(0xFFFEFCE8), Color(0xFFCA8A04)),
    'INCOMPLET': (Color(0xFFFFF7ED), Color(0xFFEA580C)),
    'APPROUVE': (Color(0xFFF0FDF4), Color(0xFF16A34A)),
    'REJETE': (Color(0xFFFEF2F2), Color(0xFFDC2626)),
  };

  static const _labels = {
    'BROUILLON': 'Brouillon',
    'SOUMIS': 'Soumis',
    'A_VERIFIER': 'À vérifier',
    'EN_COURS': 'En cours',
    'INCOMPLET': 'Incomplet',
    'APPROUVE': 'Approuvé',
    'REJETE': 'Rejeté',
  };

  @override
  Widget build(BuildContext context) {
    final colors = _colors[status] ?? (const Color(0xFFF1F5F9), const Color(0xFF64748B));
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: small ? 7 : 10,
        vertical: small ? 2 : 4,
      ),
      decoration: BoxDecoration(
        color: colors.$1,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        _labels[status] ?? status,
        style: TextStyle(
          fontSize: small ? 9 : 11,
          fontWeight: FontWeight.w700,
          color: colors.$2,
        ),
      ),
    );
  }
}
