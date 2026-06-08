import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import '../services/dossier_service.dart';
import '../config/app_theme.dart';

class UploadDocumentScreen extends StatefulWidget {
  const UploadDocumentScreen({Key? key}) : super(key: key);

  @override
  State<UploadDocumentScreen> createState() => _UploadDocumentScreenState();
}

class _UploadDocumentScreenState extends State<UploadDocumentScreen> {
  String? _dossierId;
  List<PlatformFile> _selectedFiles = [];
  String _selectedType = 'ORDONNANCE';
  bool _isUploading = false;
  // final ImagePicker _picker = ImagePicker();

  final List<String> _documentTypes = [
    'ORDONNANCE',
    'FACTURE',
    'BON_DE_CAISSE',
    'LETTRE_CONFIDENTIELLE',
    'RAPPORT_MEDICAL',
    'AUTRE'
  ];

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _dossierId ??= ModalRoute.of(context)?.settings.arguments as String?;
  }

  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles(
      allowMultiple: true,
      type: FileType.custom,
      allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
      withData: true,
    );
    if (result != null && result.files.isNotEmpty) {
      setState(() {
        _selectedFiles = result.files;
      });
    }
  }

  Future<void> _upload() async {
    if (_dossierId == null || _selectedFiles.isEmpty) return;

    setState(() => _isUploading = true);
    try {
      final svc = await DossierService.create();
      // Upload each selected file sequentially
      for (final pf in _selectedFiles) {
        dynamic fileObj;
        if (pf.path != null) {
          fileObj = File(pf.path!);
        } else if (pf.bytes != null) {
          fileObj = pf; // dossier_service will handle bytes
        }
        if (fileObj != null) await svc.uploadDocument(_dossierId!, fileObj, _selectedType);
      }
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Document rattaché avec succès !'), backgroundColor: AppTheme.success),
        );
        Navigator.of(context).pop(true); // Return True to indicate success
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Erreur lors du téléchargement'), backgroundColor: AppTheme.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
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
        title: const Row(
          children: [
            Icon(Icons.upload_file, color: Colors.white, size: 18),
            SizedBox(width: 8),
            Text('Ajouter un document', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Type de document',
              style: TextStyle(fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _selectedType,
              decoration: const InputDecoration(border: OutlineInputBorder()),
              items: _documentTypes.map((t) => DropdownMenuItem(
                value: t,
                child: Text(t.replaceAll('_', ' ')),
              )).toList(),
              onChanged: (v) => setState(() => _selectedType = v!),
            ),
            const SizedBox(height: 24),
            
            const Text(
              'Fichier (PDF, JPG, PNG)',
              style: TextStyle(fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
            ),
            const SizedBox(height: 8),
            
            // Upload Zone
            GestureDetector(
              onTap: _isUploading ? null : _pickFile,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(40),
                decoration: BoxDecoration(
                  color: _selectedFile == null ? AppTheme.surface : AppTheme.primaryLight.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: _selectedFile == null ? const Color(0xFFD1D5DB) : AppTheme.primary,
                    width: 2,
                    style: BorderStyle.solid,
                  ),
                ),
                child: Column(
                  children: [
                    Icon(
                      _selectedFile == null ? Icons.cloud_upload_outlined : Icons.check_circle_outline,
                      size: 48,
                      color: _selectedFiles.isEmpty ? AppTheme.textSecondary : AppTheme.primary,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      _selectedFiles.isEmpty ? 'Appuyez pour sélectionner un ou plusieurs fichiers' : '${_selectedFiles.length} fichier(s) sélectionné(s)',
                      style: TextStyle(
                        color: _selectedFile == null ? AppTheme.textSecondary : AppTheme.primary,
                        fontWeight: FontWeight.w500
                      ),
                    ),
                    if (_selectedFiles.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Column(
                        children: _selectedFiles.map((pf) => Text(
                          pf.name,
                          style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                          textAlign: TextAlign.center,
                        )).toList(),
                      )
                    ]
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 48),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _selectedFiles.isNotEmpty && !_isUploading ? _upload : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.success,
                  disabledBackgroundColor: AppTheme.success.withOpacity(0.5),
                ),
                child: _isUploading
                    ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Envoyer et Analyser'),
              ),
            )
          ],
        ),
      ),
    );
  }
}
