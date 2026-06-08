import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/auth_service.dart';
import '../services/profile_service.dart';
import '../services/dossier_service.dart';
import '../models/user_model.dart';
import '../models/dossier_model.dart';
import '../config/app_theme.dart';

class ProfileScreen extends StatefulWidget {
  final VoidCallback? onOpenDrawer;
  const ProfileScreen({Key? key, this.onOpenDrawer}) : super(key: key);

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _editMode = false;
  bool _saving = false;
  bool _savingPass = false;
  String _successMsg = '';
  String _errorMsg = '';
  bool _showOld = false;
  bool _showNew = false;

  // Edit form
  final _prenomCtrl = TextEditingController();
  final _nomCtrl = TextEditingController();
  final _telCtrl = TextEditingController();
  final _cinCtrl = TextEditingController();
  final _adresseCtrl = TextEditingController();

  // Password form
  final _oldPassCtrl = TextEditingController();
  final _newPassCtrl = TextEditingController();
  final _confirmPassCtrl = TextEditingController();

  // Dossiers tab
  List<DossierModel> _dossiers = [];
  bool _loadingDossiers = false;
  int _totalDossiers = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      if (_tabController.index == 2 && _dossiers.isEmpty) _loadDossiers();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _prenomCtrl.dispose();
    _nomCtrl.dispose();
    _telCtrl.dispose();
    _cinCtrl.dispose();
    _adresseCtrl.dispose();
    _oldPassCtrl.dispose();
    _newPassCtrl.dispose();
    _confirmPassCtrl.dispose();
    super.dispose();
  }

  void _startEdit() {
    final user = Provider.of<AuthService>(context, listen: false).currentUser;
    if (user == null) return;
    _prenomCtrl.text = user.prenom;
    _nomCtrl.text = user.nom;
    _telCtrl.text = user.telephone ?? '';
    _cinCtrl.text = user.cin ?? '';
    _adresseCtrl.text = user.adresse ?? '';
    setState(() {
      _editMode = true;
      _successMsg = '';
      _errorMsg = '';
    });
  }

  Future<void> _sauvegarder() async {
    setState(() {
      _saving = true;
      _successMsg = '';
      _errorMsg = '';
    });
    try {
      final svc = await ProfileService.create();
      final data = {
        'prenom': _prenomCtrl.text,
        'nom': _nomCtrl.text,
        'telephone': _telCtrl.text,
        'cin': _cinCtrl.text,
        'adresse': _adresseCtrl.text,
      };
      final success = await svc.updateProfil(data);
      if (success && mounted) {
        final authService = Provider.of<AuthService>(context, listen: false);
        final user = authService.currentUser!;
        final updated = user.copyWith(
          prenom: _prenomCtrl.text,
          nom: _nomCtrl.text,
          telephone: _telCtrl.text,
          cin: _cinCtrl.text,
          adresse: _adresseCtrl.text,
        );
        authService.updateLocalUser(updated);
        setState(() {
          _editMode = false;
          _successMsg = 'Profil mis à jour avec succès.';
        });
        Future.delayed(const Duration(seconds: 3), () {
          if (mounted) setState(() => _successMsg = '');
        });
      }
    } catch (e) {
      setState(() => _errorMsg = 'Erreur lors de la mise à jour.');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _changerMotDePasse() async {
    if (!_canChangePass) return;
    setState(() {
      _savingPass = true;
      _successMsg = '';
      _errorMsg = '';
    });
    try {
      final svc = await ProfileService.create();
      final success = await svc.changerMotDePasse(
        _oldPassCtrl.text,
        _newPassCtrl.text,
      );
      if (success && mounted) {
        _oldPassCtrl.clear();
        _newPassCtrl.clear();
        _confirmPassCtrl.clear();
        setState(() => _successMsg = 'Mot de passe changé avec succès.');
        Future.delayed(const Duration(seconds: 3), () {
          if (mounted) setState(() => _successMsg = '');
        });
      }
    } catch (e) {
      setState(() => _errorMsg = 'Mot de passe actuel incorrect.');
    } finally {
      if (mounted) setState(() => _savingPass = false);
    }
  }

  bool get _canChangePass =>
      _oldPassCtrl.text.isNotEmpty &&
      _newPassCtrl.text.length >= 6 &&
      _newPassCtrl.text == _confirmPassCtrl.text;

  double get _strengthPct {
    final p = _newPassCtrl.text;
    if (p.isEmpty) return 0;
    int score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (RegExp(r'[A-Z]').hasMatch(p)) score++;
    if (RegExp(r'[0-9]').hasMatch(p)) score++;
    if (RegExp(r'[^A-Za-z0-9]').hasMatch(p)) score++;
    return score / 5;
  }

  String get _strengthLabel {
    final pct = _strengthPct;
    if (pct <= 0.4) return 'Faible';
    if (pct <= 0.7) return 'Moyen';
    return 'Fort';
  }

  Color get _strengthColor {
    final pct = _strengthPct;
    if (pct <= 0.4) return AppTheme.danger;
    if (pct <= 0.7) return AppTheme.warning;
    return AppTheme.success;
  }

  Future<void> _loadDossiers() async {
    setState(() => _loadingDossiers = true);
    try {
      final svc = await DossierService.create();
      final list = await svc.getDossiers();
      if (mounted) {
        setState(() {
          _dossiers = list;
          _totalDossiers = list.length;
        });
      }
    } catch (_) {}
    if (mounted) setState(() => _loadingDossiers = false);
  }

  void _logout() async {
    await Provider.of<AuthService>(context, listen: false).logout();
    if (mounted) {
      Navigator.of(context).pushNamedAndRemoveUntil('/login', (route) => false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthService>(context).currentUser;

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: Column(
        children: [
          // ── Profile Header ──
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(20, 52, 20, 24),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF0F172A), Color(0xFF1E3A5F)],
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
                      'Mon profil',
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
                // ── Infos utilisateur ──
                Row(
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [AppTheme.primary, Color(0xFF6AA3F8)],
                        ),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white.withOpacity(0.2), width: 3),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        user?.initials ?? '?',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 22),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user?.fullName ?? 'Assuré',
                            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Text('👤 Assuré', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600)),
                              ),
                              const SizedBox(width: 8),
                              Flexible(
                                child: Text(
                                  user?.email ?? '',
                                  style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 12),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // ── Tabs ──
          Container(
            margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: const Color(0xFFF3F4F6),
              borderRadius: BorderRadius.circular(12),
            ),
            child: TabBar(
              controller: _tabController,
              indicator: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 1)),
                ],
              ),
              indicatorSize: TabBarIndicatorSize.tab,
              labelColor: AppTheme.primary,
              unselectedLabelColor: AppTheme.textSecondary,
              labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
              tabs: [
                const Tab(text: '📋 Infos'),
                const Tab(text: '🔒 Sécurité'),
                Tab(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('📁 Dossiers'),
                      if (_totalDossiers > 0) ...[
                        const SizedBox(width: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                          decoration: BoxDecoration(
                            color: AppTheme.primary,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            _totalDossiers.toString(),
                            style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w700),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ── Tab Content ──
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildInfosTab(user),
                _buildSecurityTab(),
                _buildDossiersTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════
  // INFOS TAB
  // ═══════════════════════════════════════════════
  Widget _buildInfosTab(UserModel? user) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          if (_successMsg.isNotEmpty) _alertWidget(_successMsg, AppTheme.success),
          if (_errorMsg.isNotEmpty) _alertWidget(_errorMsg, AppTheme.danger),

          Container(
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFE5E7EB)),
            ),
            child: Column(
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Informations personnelles', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      if (!_editMode)
                        TextButton.icon(
                          onPressed: _startEdit,
                          icon: const Icon(Icons.edit, size: 16),
                          label: const Text('Modifier', style: TextStyle(fontSize: 13)),
                        ),
                    ],
                  ),
                ),
                const Divider(height: 1),

                if (!_editMode) ...[
                  _infoItem('Prénom', user?.prenom ?? '—'),
                  _infoItem('Nom', user?.nom ?? '—'),
                  _infoItem('Email', user?.email ?? '—'),
                  _infoItem('Téléphone', user?.telephone ?? '—'),
                  _infoItem('CIN', user?.cin ?? '—'),
                  _infoItem('Adresse', user?.adresse ?? '—'),
                ] else ...[
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Expanded(child: _editField('Prénom', _prenomCtrl)),
                            const SizedBox(width: 12),
                            Expanded(child: _editField('Nom', _nomCtrl)),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(child: _editField('Téléphone', _telCtrl)),
                            const SizedBox(width: 12),
                            Expanded(child: _editField('CIN', _cinCtrl)),
                          ],
                        ),
                        const SizedBox(height: 12),
                        _editField('Adresse', _adresseCtrl),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: const BoxDecoration(
                      color: Color(0xFFF9FAFB),
                      border: Border(top: BorderSide(color: Color(0xFFF3F4F6))),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton(
                          onPressed: () => setState(() => _editMode = false),
                          child: const Text('Annuler'),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton(
                          onPressed: _saving ? null : _sauvegarder,
                          child: _saving
                              ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : const Text('Enregistrer', style: TextStyle(color: Colors.white)),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════
  // SECURITY TAB
  // ═══════════════════════════════════════════════
  Widget _buildSecurityTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          if (_successMsg.isNotEmpty) _alertWidget(_successMsg, AppTheme.success),
          if (_errorMsg.isNotEmpty) _alertWidget(_errorMsg, AppTheme.danger),

          // Change password
          Container(
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFE5E7EB)),
            ),
            child: Column(
              children: [
                const Padding(
                  padding: EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Text('Changer le mot de passe', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    ],
                  ),
                ),
                const Divider(height: 1),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _passField('Mot de passe actuel', _oldPassCtrl, _showOld, () => setState(() => _showOld = !_showOld)),
                      const SizedBox(height: 14),
                      _passField('Nouveau mot de passe', _newPassCtrl, _showNew, () => setState(() => _showNew = !_showNew)),
                      if (_newPassCtrl.text.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(2),
                                child: LinearProgressIndicator(
                                  value: _strengthPct,
                                  backgroundColor: const Color(0xFFF3F4F6),
                                  valueColor: AlwaysStoppedAnimation(_strengthColor),
                                  minHeight: 4,
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Text(_strengthLabel, style: TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                          ],
                        ),
                      ],
                      const SizedBox(height: 14),
                      _passField('Confirmer', _confirmPassCtrl, _showNew, null),
                      if (_confirmPassCtrl.text.isNotEmpty && _newPassCtrl.text != _confirmPassCtrl.text)
                        const Padding(
                          padding: EdgeInsets.only(top: 4),
                          child: Text('Les mots de passe ne correspondent pas', style: TextStyle(fontSize: 12, color: AppTheme.danger)),
                        ),
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _canChangePass && !_savingPass ? _changerMotDePasse : null,
                          child: _savingPass
                              ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : const Text('🔒 Changer le mot de passe', style: TextStyle(color: Colors.white)),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Danger zone
          Container(
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFE5E7EB)),
            ),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: const BoxDecoration(
                    borderRadius: BorderRadius.vertical(top: Radius.circular(14)),
                    border: Border(bottom: BorderSide(color: Color(0xFFF3F4F6))),
                  ),
                  
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Se déconnecter', style: TextStyle(fontWeight: FontWeight.w700)),
                            Text('Vous serez redirigé vers la page de connexion.',
                                style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                          ],
                        ),
                      ),
                      ElevatedButton(
                        onPressed: _logout,
                        style: ElevatedButton.styleFrom(backgroundColor: AppTheme.danger),
                        child: const Text('⬅️ Déconnexion', style: TextStyle(color: Colors.white)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════
  // DOSSIERS TAB
  // ═══════════════════════════════════════════════
  Widget _buildDossiersTab() {
    if (_loadingDossiers) {
      return const Center(child: CircularProgressIndicator());
    }

    final approved = _dossiers.where((d) => d.statut == 'APPROUVE').length;
    final enCours = _dossiers.where((d) => d.statut == 'SOUMIS' || d.statut == 'EN_COURS').length;
    final totalRemb = _dossiers.fold(0.0, (s, d) => s + (d.montantRembourse ?? 0));

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Stats
          Row(
            children: [
              _statMini('📁', _totalDossiers.toString(), 'Total', const Color(0xFF6366F1)),
              const SizedBox(width: 8),
              _statMini('✅', approved.toString(), 'Approuvés', AppTheme.success),
              const SizedBox(width: 8),
              _statMini('⏳', enCours.toString(), 'En cours', AppTheme.warning),
              const SizedBox(width: 8),
              _statMini('💰', '${totalRemb.toStringAsFixed(0)}', 'TND', AppTheme.info),
            ],
          ),

          const SizedBox(height: 16),

          // Dossiers list
          Container(
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFE5E7EB)),
            ),
            child: Column(
              children: [
                const Padding(
                  padding: EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Text('Historique de mes dossiers', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    ],
                  ),
                ),
                const Divider(height: 1),
                if (_dossiers.isEmpty)
                  const Padding(
                    padding: EdgeInsets.all(40),
                    child: Column(
                      children: [
                        Text('📂', style: TextStyle(fontSize: 40)),
                        SizedBox(height: 8),
                        Text('Aucun dossier', style: TextStyle(color: AppTheme.textSecondary)),
                      ],
                    ),
                  )
                else
                  ...List.generate(_dossiers.length, (i) {
                    final d = _dossiers[i];
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        border: i < _dossiers.length - 1
                            ? const Border(bottom: BorderSide(color: Color(0xFFF3F4F6)))
                            : null,
                      ),
                      child: Row(
                        children: [
                          Text(d.numeroDossier,
                              style: const TextStyle(fontFamily: 'monospace', fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.primary)),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(d.description, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500), maxLines: 1, overflow: TextOverflow.ellipsis),
                                Text(_formatDate(d.createdAt), style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                              ],
                            ),
                          ),
                          if (d.montantRembourse != null && d.montantRembourse! > 0)
                            Text('${d.montantRembourse!.toStringAsFixed(2)} TND',
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.success))
                          else
                            const Text('—', style: TextStyle(color: AppTheme.textSecondary)),
                        ],
                      ),
                    );
                  }),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(String? iso) {
    if (iso == null) return '';
    try {
      return DateFormat('dd/MM/yyyy').format(DateTime.parse(iso));
    } catch (_) {
      return '';
    }
  }

  // ── Widgets ──
  Widget _infoItem(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.textSecondary, letterSpacing: 0.3)),
          Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _editField(String label, TextEditingController ctrl) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.textSecondary, letterSpacing: 0.3)),
        const SizedBox(height: 4),
        TextFormField(controller: ctrl, decoration: InputDecoration(hintText: label)),
      ],
    );
  }

  Widget _passField(String label, TextEditingController ctrl, bool show, VoidCallback? toggleVisibility) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.textSecondary, letterSpacing: 0.3)),
        const SizedBox(height: 4),
        TextFormField(
          controller: ctrl,
          obscureText: !show,
          onChanged: (_) => setState(() {}),
          decoration: InputDecoration(
            hintText: '••••••••',
            suffixIcon: toggleVisibility != null
                ? IconButton(
                    icon: Icon(show ? Icons.visibility_off : Icons.visibility, size: 20),
                    onPressed: toggleVisibility,
                  )
                : null,
          ),
        ),
      ],
    );
  }

  Widget _alertWidget(String msg, Color color) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        color == AppTheme.success ? '✅ $msg' : '⚠️ $msg',
        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: color),
      ),
    );
  }

  Widget _statMini(String icon, String value, String label, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border(
            top: BorderSide(color: color, width: 3),
            left: const BorderSide(color: Color(0xFFE5E7EB)),
            right: const BorderSide(color: Color(0xFFE5E7EB)),
            bottom: const BorderSide(color: Color(0xFFE5E7EB)),
          ),
        ),
        child: Column(
          children: [
            Text(icon, style: const TextStyle(fontSize: 20)),
            const SizedBox(height: 4),
            Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            Text(label.toUpperCase(), style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w700, color: AppTheme.textSecondary, letterSpacing: 0.3)),
          ],
        ),
      ),
    );
  }
}
