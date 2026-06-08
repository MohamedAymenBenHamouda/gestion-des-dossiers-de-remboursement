import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';
import 'api_client.dart';
import '../models/dossier_model.dart';
import '../models/document_model.dart';
import 'package:file_picker/file_picker.dart';

class DossierService {
  final ApiClient _client;

  DossierService._(this._client);

  static Future<DossierService> create() async {
    final client = await ApiClient.create();
    return DossierService._(client);
  }

  // ══════════════════════════════════════════════════════════
  // DOSSIERS
  // ══════════════════════════════════════════════════════════

  /// Récupérer la liste des dossiers de l'assuré
  Future<List<DossierModel>> getDossiers() async {
    final resp = await _client.get('/assure/dossiers', queryParameters: {
      'page': 0,
      'size': 100,
      'sort': 'createdAt,desc',
    });
    if (resp.statusCode == 200) {
      final data = resp.data['data'];
      if (data != null && data['content'] != null) {
        return (data['content'] as List)
            .map((e) => DossierModel.fromJson(Map<String, dynamic>.from(e)))
            .toList();
      }
      return [];
    }
    throw Exception('Échec du chargement des dossiers');
  }

  /// Récupérer un dossier par son ID
  Future<DossierModel> getDossier(int id) async {
    final resp = await _client.get('/assure/dossiers/$id');
    if (resp.statusCode == 200) {
      return DossierModel.fromJson(
          Map<String, dynamic>.from(resp.data['data']));
    }
    throw Exception('Échec du chargement du dossier');
  }

  /// Créer un nouveau dossier
  Future<DossierModel> createDossier({
    required String description,
    required String typeSoin,
    String? motif,
    int? beneficiaryId,
  }) async {
    final body = <String, dynamic>{
      'description': description,
      'typeSoin': typeSoin,
    };
    if (motif != null && motif.isNotEmpty) body['motif'] = motif;
    if (beneficiaryId != null) body['beneficiaryId'] = beneficiaryId;

    final resp = await _client.post('/assure/dossiers', data: body);
    if (resp.statusCode == 200 || resp.statusCode == 201) {
      return DossierModel.fromJson(
          Map<String, dynamic>.from(resp.data['data']));
    }
    throw Exception('Échec de la création du dossier');
  }

  /// Récupérer les membres de la famille de l'assuré
  Future<List<dynamic>> getFamilyMembers() async {
    final resp = await _client.get('/assure/famille');
    if (resp.statusCode == 200) {
      final data = resp.data['data'];
      if (data != null) {
        return (data as List).cast<dynamic>();
      }
      return [];
    }
    throw Exception('Échec du chargement de la famille');
  }

  /// Mettre à jour un dossier (description, typeSoin)
  Future<DossierModel> updateDossier(int id, {
    String? description,
    String? typeSoin,
  }) async {
    final body = <String, dynamic>{};
    if (description != null) body['description'] = description;
    if (typeSoin != null) body['typeSoin'] = typeSoin;

    final resp = await _client.put('/assure/dossiers/$id', data: body);
    if (resp.statusCode == 200) {
      return DossierModel.fromJson(
          Map<String, dynamic>.from(resp.data['data']));
    }
    throw Exception('Échec de la mise à jour du dossier');
  }

  /// Soumettre un dossier
  Future<DossierModel> soumettreDossier(int id) async {
    final resp = await _client.post('/assure/dossiers/$id/soumettre');
    if (resp.statusCode == 200 || resp.statusCode == 201) {
      return DossierModel.fromJson(
          Map<String, dynamic>.from(resp.data['data']));
    }
    throw Exception('Échec de la soumission du dossier');
  }

  // ══════════════════════════════════════════════════════════
  // DOCUMENTS
  // ══════════════════════════════════════════════════════════

  /// Récupérer les documents d'un dossier
  Future<List<DocumentModel>> getDocuments(int dossierId) async {
    final resp = await _client.get('/assure/dossiers/$dossierId/documents');
    if (resp.statusCode == 200) {
      final data = resp.data['data'];
      if (data != null) {
        return (data as List)
            .map((d) => DocumentModel.fromJson(Map<String, dynamic>.from(d)))
            .toList();
      }
      return [];
    }
    throw Exception('Échec du chargement des documents');
  }

  /// Upload un document sur un dossier
  Future<DocumentModel> uploadDocument(
    dynamic dossierId,
    dynamic file,
    String type,
  ) async {
    final id = int.tryParse(dossierId.toString()) ?? (dossierId is int ? dossierId : int.parse(dossierId.toString()));

    late MultipartFile multipartFile;

    if (file is XFile) {
      final bytes = await file.readAsBytes();
      final name = (file.name.isNotEmpty) ? file.name : file.path.split('/').last;
      multipartFile = MultipartFile.fromBytes(bytes, filename: name);
      } else if (file is File) {
      final fileName = file.path.split(Platform.pathSeparator).last;
      multipartFile = await MultipartFile.fromFile(file.path, filename: fileName);
      } else if (file is PlatformFile) {
        // FilePicker PlatformFile (may have bytes or path)
        if (file.path != null) {
          final fileName = file.path!.split(Platform.pathSeparator).last;
          multipartFile = await MultipartFile.fromFile(file.path!, filename: fileName);
        } else if (file.bytes != null) {
          multipartFile = MultipartFile.fromBytes(file.bytes!, filename: file.name);
        } else {
          throw Exception('Unsupported PlatformFile for upload');
        }
    } else {
      throw Exception('Unsupported file type for upload');
    }

    final formData = FormData.fromMap({
      'fichier': multipartFile,
      'type': type,
    });

    final resp = await _client.postMultipart(
      '/assure/dossiers/$id/documents',
      formData,
    );
    if (resp.statusCode == 200 || resp.statusCode == 201) {
      return DocumentModel.fromJson(
          Map<String, dynamic>.from(resp.data['data']));
    }
    throw Exception('Échec de l\'upload du document');
  }
}
