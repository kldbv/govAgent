import 'package:equatable/equatable.dart';
import 'program.dart';

class Application extends Equatable {
  final String id;
  final String programId;
  final String userId;
  final Program? program;
  final ApplicationStatus status;
  final double requestedAmount;
  final Map<String, dynamic> formData;
  final List<ApplicationDocument> documents;
  final String? rejectionReason;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? submittedAt;
  final DateTime? reviewedAt;

  const Application({
    required this.id,
    required this.programId,
    required this.userId,
    this.program,
    required this.status,
    required this.requestedAmount,
    this.formData = const {},
    this.documents = const [],
    this.rejectionReason,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
    this.submittedAt,
    this.reviewedAt,
  });

  bool get isDraft => status == ApplicationStatus.draft;
  bool get isSubmitted => status == ApplicationStatus.submitted;
  bool get isUnderReview => status == ApplicationStatus.underReview;
  bool get isApproved => status == ApplicationStatus.approved;
  bool get isRejected => status == ApplicationStatus.rejected;
  bool get isCompleted =>
      status == ApplicationStatus.approved ||
      status == ApplicationStatus.rejected;

  bool get canEdit => isDraft;
  bool get canSubmit => isDraft && documents.isNotEmpty;
  bool get canCancel => !isCompleted;

  factory Application.fromJson(Map<String, dynamic> json) {
    return Application(
      id: json['id'] as String,
      programId: json['programId'] as String,
      userId: json['userId'] as String,
      program: json['program'] != null
          ? Program.fromJson(json['program'] as Map<String, dynamic>)
          : null,
      status: ApplicationStatus.fromString(json['status'] as String?),
      requestedAmount: (json['requestedAmount'] as num).toDouble(),
      formData: json['formData'] as Map<String, dynamic>? ?? {},
      documents: (json['documents'] as List<dynamic>?)
              ?.map((e) =>
                  ApplicationDocument.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      rejectionReason: json['rejectionReason'] as String?,
      notes: json['notes'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      submittedAt: json['submittedAt'] != null
          ? DateTime.parse(json['submittedAt'] as String)
          : null,
      reviewedAt: json['reviewedAt'] != null
          ? DateTime.parse(json['reviewedAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'programId': programId,
      'userId': userId,
      'program': program?.toJson(),
      'status': status.value,
      'requestedAmount': requestedAmount,
      'formData': formData,
      'documents': documents.map((d) => d.toJson()).toList(),
      'rejectionReason': rejectionReason,
      'notes': notes,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'submittedAt': submittedAt?.toIso8601String(),
      'reviewedAt': reviewedAt?.toIso8601String(),
    };
  }

  Application copyWith({
    String? id,
    String? programId,
    String? userId,
    Program? program,
    ApplicationStatus? status,
    double? requestedAmount,
    Map<String, dynamic>? formData,
    List<ApplicationDocument>? documents,
    String? rejectionReason,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? submittedAt,
    DateTime? reviewedAt,
  }) {
    return Application(
      id: id ?? this.id,
      programId: programId ?? this.programId,
      userId: userId ?? this.userId,
      program: program ?? this.program,
      status: status ?? this.status,
      requestedAmount: requestedAmount ?? this.requestedAmount,
      formData: formData ?? this.formData,
      documents: documents ?? this.documents,
      rejectionReason: rejectionReason ?? this.rejectionReason,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      submittedAt: submittedAt ?? this.submittedAt,
      reviewedAt: reviewedAt ?? this.reviewedAt,
    );
  }

  @override
  List<Object?> get props => [
        id,
        programId,
        userId,
        program,
        status,
        requestedAmount,
        formData,
        documents,
        rejectionReason,
        notes,
        createdAt,
        updatedAt,
        submittedAt,
        reviewedAt,
      ];
}

enum ApplicationStatus {
  draft('draft', 'Черновик', 0xFF64748B),
  submitted('submitted', 'Отправлено', 0xFF3B82F6),
  underReview('under_review', 'На рассмотрении', 0xFFF59E0B),
  additionalInfo('additional_info', 'Требуется информация', 0xFFF97316),
  approved('approved', 'Одобрено', 0xFF22C55E),
  rejected('rejected', 'Отклонено', 0xFFEF4444);

  final String value;
  final String label;
  final int colorValue;

  const ApplicationStatus(this.value, this.label, this.colorValue);

  static ApplicationStatus fromString(String? value) {
    return ApplicationStatus.values.firstWhere(
      (status) => status.value == value,
      orElse: () => ApplicationStatus.draft,
    );
  }
}

class ApplicationDocument extends Equatable {
  final String id;
  final String name;
  final String type;
  final String url;
  final int size;
  final DateTime uploadedAt;

  const ApplicationDocument({
    required this.id,
    required this.name,
    required this.type,
    required this.url,
    required this.size,
    required this.uploadedAt,
  });

  factory ApplicationDocument.fromJson(Map<String, dynamic> json) {
    return ApplicationDocument(
      id: json['id'] as String,
      name: json['name'] as String,
      type: json['type'] as String,
      url: json['url'] as String,
      size: json['size'] as int,
      uploadedAt: DateTime.parse(json['uploadedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'type': type,
      'url': url,
      'size': size,
      'uploadedAt': uploadedAt.toIso8601String(),
    };
  }

  @override
  List<Object?> get props => [id, name, type, url, size, uploadedAt];
}
