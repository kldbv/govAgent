part of 'applications_bloc.dart';

abstract class ApplicationsState extends Equatable {
  const ApplicationsState();

  @override
  List<Object?> get props => [];
}

class ApplicationsInitial extends ApplicationsState {
  const ApplicationsInitial();
}

class ApplicationsLoading extends ApplicationsState {
  const ApplicationsLoading();
}

class ApplicationsLoaded extends ApplicationsState {
  final List<Application> applications;
  final Map<String, int> stats;

  const ApplicationsLoaded({
    required this.applications,
    this.stats = const {},
  });

  List<Application> get activeApplications =>
      applications.where((app) => !app.isCompleted).toList();

  List<Application> get completedApplications =>
      applications.where((app) => app.isCompleted).toList();

  @override
  List<Object?> get props => [applications, stats];
}

class ApplicationDetailLoaded extends ApplicationsState {
  final Application application;
  final List<Application> applications;
  final Map<String, int> stats;

  const ApplicationDetailLoaded({
    required this.application,
    this.applications = const [],
    this.stats = const {},
  });

  @override
  List<Object?> get props => [application, applications, stats];
}

class ApplicationSubmitting extends ApplicationsState {
  const ApplicationSubmitting();
}

class ApplicationCreated extends ApplicationsState {
  final Application application;

  const ApplicationCreated({required this.application});

  @override
  List<Object?> get props => [application];
}

class ApplicationSubmitted extends ApplicationsState {
  final Application application;

  const ApplicationSubmitted({required this.application});

  @override
  List<Object?> get props => [application];
}

class ApplicationCancelled extends ApplicationsState {
  const ApplicationCancelled();
}

class ApplicationsError extends ApplicationsState {
  final String message;

  const ApplicationsError({required this.message});

  @override
  List<Object?> get props => [message];
}

/// Черновик сохранён
class DraftSaved extends ApplicationsState {
  final Application draft;

  const DraftSaved({required this.draft});

  @override
  List<Object?> get props => [draft];
}

/// Черновик загружен для редактирования
class DraftLoaded extends ApplicationsState {
  final Application draft;

  const DraftLoaded({required this.draft});

  @override
  List<Object?> get props => [draft];
}
