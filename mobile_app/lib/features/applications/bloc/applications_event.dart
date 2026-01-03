part of 'applications_bloc.dart';

abstract class ApplicationsEvent extends Equatable {
  const ApplicationsEvent();

  @override
  List<Object?> get props => [];
}

class LoadApplications extends ApplicationsEvent {
  final ApplicationStatus? status;

  const LoadApplications({this.status});

  @override
  List<Object?> get props => [status];
}

class LoadApplicationDetail extends ApplicationsEvent {
  final String applicationId;

  const LoadApplicationDetail({required this.applicationId});

  @override
  List<Object?> get props => [applicationId];
}

class CreateApplication extends ApplicationsEvent {
  final String programId;
  final double requestedAmount;
  final Map<String, dynamic>? formData;
  final bool autoSubmit;

  const CreateApplication({
    required this.programId,
    required this.requestedAmount,
    this.formData,
    this.autoSubmit = false,
  });

  @override
  List<Object?> get props => [programId, requestedAmount, formData, autoSubmit];
}

class SubmitApplication extends ApplicationsEvent {
  final String applicationId;

  const SubmitApplication({required this.applicationId});

  @override
  List<Object?> get props => [applicationId];
}

class CancelApplication extends ApplicationsEvent {
  final String applicationId;

  const CancelApplication({required this.applicationId});

  @override
  List<Object?> get props => [applicationId];
}

class RefreshApplications extends ApplicationsEvent {
  const RefreshApplications();
}

/// Сохранить черновик заявки
class SaveDraft extends ApplicationsEvent {
  final String programId;
  final double requestedAmount;
  final Map<String, dynamic> formData;

  const SaveDraft({
    required this.programId,
    required this.requestedAmount,
    required this.formData,
  });

  @override
  List<Object?> get props => [programId, requestedAmount, formData];
}

/// Обновить существующий черновик
class UpdateDraft extends ApplicationsEvent {
  final String applicationId;
  final double? requestedAmount;
  final Map<String, dynamic>? formData;

  const UpdateDraft({
    required this.applicationId,
    this.requestedAmount,
    this.formData,
  });

  @override
  List<Object?> get props => [applicationId, requestedAmount, formData];
}

/// Загрузить черновик для редактирования
class LoadDraftForEditing extends ApplicationsEvent {
  final String applicationId;

  const LoadDraftForEditing({required this.applicationId});

  @override
  List<Object?> get props => [applicationId];
}
