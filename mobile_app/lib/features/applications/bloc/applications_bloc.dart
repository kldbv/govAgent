import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/models/application.dart';
import '../../../core/services/application_service.dart';

part 'applications_event.dart';
part 'applications_state.dart';

class ApplicationsBloc extends Bloc<ApplicationsEvent, ApplicationsState> {
  final ApplicationService _applicationService;

  ApplicationsBloc({required ApplicationService applicationService})
      : _applicationService = applicationService,
        super(const ApplicationsInitial()) {
    on<LoadApplications>(_onLoadApplications);
    on<LoadApplicationDetail>(_onLoadApplicationDetail);
    on<CreateApplication>(_onCreateApplication);
    on<SubmitApplication>(_onSubmitApplication);
    on<CancelApplication>(_onCancelApplication);
    on<RefreshApplications>(_onRefreshApplications);
    on<SaveDraft>(_onSaveDraft);
    on<UpdateDraft>(_onUpdateDraft);
    on<LoadDraftForEditing>(_onLoadDraftForEditing);
  }

  Future<void> _onLoadApplications(
    LoadApplications event,
    Emitter<ApplicationsState> emit,
  ) async {
    emit(const ApplicationsLoading());

    try {
      final applications = await _applicationService.getApplications(
        status: event.status,
      );

      final stats = await _applicationService.getApplicationStats();

      emit(ApplicationsLoaded(
        applications: applications,
        stats: stats,
      ));
    } catch (e) {
      emit(ApplicationsError(message: e.toString()));
    }
  }

  Future<void> _onLoadApplicationDetail(
    LoadApplicationDetail event,
    Emitter<ApplicationsState> emit,
  ) async {
    // Сохраняем текущий список заявок перед загрузкой детали
    final currentState = state;
    List<Application> currentApplications = [];
    Map<String, int> currentStats = {};

    if (currentState is ApplicationsLoaded) {
      currentApplications = currentState.applications;
      currentStats = currentState.stats;
    } else if (currentState is ApplicationDetailLoaded) {
      currentApplications = currentState.applications;
      currentStats = currentState.stats;
    }

    emit(const ApplicationsLoading());

    try {
      final application = await _applicationService.getApplication(event.applicationId);

      emit(ApplicationDetailLoaded(
        application: application,
        applications: currentApplications,
        stats: currentStats,
      ));
    } catch (e) {
      emit(ApplicationsError(message: e.toString()));
    }
  }

  Future<void> _onCreateApplication(
    CreateApplication event,
    Emitter<ApplicationsState> emit,
  ) async {
    emit(const ApplicationSubmitting());

    try {
      final application = await _applicationService.createDraft(
        programId: event.programId,
        requestedAmount: event.requestedAmount,
        formData: event.formData,
      );

      // Auto-submit if requested
      if (event.autoSubmit) {
        final submittedApp = await _applicationService.submitApplication(application.id);
        emit(ApplicationSubmitted(application: submittedApp));
      } else {
        emit(ApplicationCreated(application: application));
      }
    } catch (e) {
      emit(ApplicationsError(message: e.toString()));
    }
  }

  Future<void> _onSubmitApplication(
    SubmitApplication event,
    Emitter<ApplicationsState> emit,
  ) async {
    emit(const ApplicationSubmitting());

    try {
      final application = await _applicationService.submitApplication(event.applicationId);

      emit(ApplicationSubmitted(application: application));
    } catch (e) {
      emit(ApplicationsError(message: e.toString()));
    }
  }

  Future<void> _onCancelApplication(
    CancelApplication event,
    Emitter<ApplicationsState> emit,
  ) async {
    emit(const ApplicationsLoading());

    try {
      await _applicationService.cancelApplication(event.applicationId);

      emit(const ApplicationCancelled());
    } catch (e) {
      emit(ApplicationsError(message: e.toString()));
    }
  }

  Future<void> _onRefreshApplications(
    RefreshApplications event,
    Emitter<ApplicationsState> emit,
  ) async {
    try {
      final applications = await _applicationService.getApplications();
      final stats = await _applicationService.getApplicationStats();

      emit(ApplicationsLoaded(
        applications: applications,
        stats: stats,
      ));
    } catch (e) {
      emit(ApplicationsError(message: e.toString()));
    }
  }

  Future<void> _onSaveDraft(
    SaveDraft event,
    Emitter<ApplicationsState> emit,
  ) async {
    try {
      final draft = await _applicationService.createDraft(
        programId: event.programId,
        requestedAmount: event.requestedAmount,
        formData: event.formData,
      );

      emit(DraftSaved(draft: draft));
    } catch (e) {
      emit(ApplicationsError(message: e.toString()));
    }
  }

  Future<void> _onUpdateDraft(
    UpdateDraft event,
    Emitter<ApplicationsState> emit,
  ) async {
    try {
      final draft = await _applicationService.updateDraft(
        applicationId: event.applicationId,
        requestedAmount: event.requestedAmount,
        formData: event.formData,
      );

      emit(DraftSaved(draft: draft));
    } catch (e) {
      emit(ApplicationsError(message: e.toString()));
    }
  }

  Future<void> _onLoadDraftForEditing(
    LoadDraftForEditing event,
    Emitter<ApplicationsState> emit,
  ) async {
    emit(const ApplicationsLoading());

    try {
      final draft = await _applicationService.getApplication(event.applicationId);

      if (!draft.isDraft) {
        emit(const ApplicationsError(message: 'Заявка уже отправлена и не может быть отредактирована'));
        return;
      }

      emit(DraftLoaded(draft: draft));
    } catch (e) {
      emit(ApplicationsError(message: e.toString()));
    }
  }
}
