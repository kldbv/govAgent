import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/models/program.dart';
import '../../../core/services/program_service.dart';

// Events
abstract class ProgramsEvent extends Equatable {
  const ProgramsEvent();

  @override
  List<Object?> get props => [];
}

class LoadPrograms extends ProgramsEvent {
  final ProgramFilter? filter;
  final int page;
  final bool forceRefresh;

  const LoadPrograms({this.filter, this.page = 1, this.forceRefresh = false});

  @override
  List<Object?> get props => [filter, page, forceRefresh];
}

class LoadMorePrograms extends ProgramsEvent {
  const LoadMorePrograms();
}

class LoadRecommendations extends ProgramsEvent {
  final bool forceRefresh;

  const LoadRecommendations({this.forceRefresh = false});

  @override
  List<Object?> get props => [forceRefresh];
}

class LoadProgramDetail extends ProgramsEvent {
  final String programId;

  const LoadProgramDetail({required this.programId});

  @override
  List<Object?> get props => [programId];
}

class SearchPrograms extends ProgramsEvent {
  final String query;

  const SearchPrograms({required this.query});

  @override
  List<Object?> get props => [query];
}

class UpdateFilter extends ProgramsEvent {
  final ProgramFilter filter;

  const UpdateFilter({required this.filter});

  @override
  List<Object?> get props => [filter];
}

class ClearFilter extends ProgramsEvent {
  const ClearFilter();
}

// States
abstract class ProgramsState extends Equatable {
  const ProgramsState();

  @override
  List<Object?> get props => [];
}

class ProgramsInitial extends ProgramsState {
  const ProgramsInitial();
}

class ProgramsLoading extends ProgramsState {
  const ProgramsLoading();
}

class ProgramsLoaded extends ProgramsState {
  final List<Program> programs;
  final ProgramFilter? filter;
  final int currentPage;
  final bool hasMore;

  const ProgramsLoaded({
    required this.programs,
    this.filter,
    this.currentPage = 1,
    this.hasMore = true,
  });

  @override
  List<Object?> get props => [programs, filter, currentPage, hasMore];

  ProgramsLoaded copyWith({
    List<Program>? programs,
    ProgramFilter? filter,
    int? currentPage,
    bool? hasMore,
  }) {
    return ProgramsLoaded(
      programs: programs ?? this.programs,
      filter: filter ?? this.filter,
      currentPage: currentPage ?? this.currentPage,
      hasMore: hasMore ?? this.hasMore,
    );
  }
}

class ProgramsLoadingMore extends ProgramsState {
  final List<Program> programs;
  final ProgramFilter? filter;
  final int currentPage;

  const ProgramsLoadingMore({
    required this.programs,
    this.filter,
    required this.currentPage,
  });

  @override
  List<Object?> get props => [programs, filter, currentPage];
}

class RecommendationsLoaded extends ProgramsState {
  final List<Program> programs;

  const RecommendationsLoaded({required this.programs});

  @override
  List<Object?> get props => [programs];
}

class ProgramDetailLoaded extends ProgramsState {
  final Program program;

  const ProgramDetailLoaded({required this.program});

  @override
  List<Object?> get props => [program];
}

class ProgramsError extends ProgramsState {
  final String message;

  const ProgramsError({required this.message});

  @override
  List<Object?> get props => [message];
}

// Bloc
class ProgramsBloc extends Bloc<ProgramsEvent, ProgramsState> {
  final ProgramService _programService;
  static const int _pageSize = 20;

  // Cache for recommendations (Home screen)
  List<Program>? _cachedRecommendations;

  // Cache for programs list (Programs screen)
  ProgramsLoaded? _cachedProgramsList;

  ProgramsBloc({required ProgramService programService})
      : _programService = programService,
        super(const ProgramsInitial()) {
    on<LoadPrograms>(_onLoadPrograms);
    on<LoadMorePrograms>(_onLoadMorePrograms);
    on<LoadRecommendations>(_onLoadRecommendations);
    on<LoadProgramDetail>(_onLoadProgramDetail);
    on<SearchPrograms>(_onSearchPrograms);
    on<UpdateFilter>(_onUpdateFilter);
    on<ClearFilter>(_onClearFilter);
  }

  Future<void> _onLoadPrograms(
    LoadPrograms event,
    Emitter<ProgramsState> emit,
  ) async {
    // Use cache if available and not forcing refresh and no filter change
    if (!event.forceRefresh &&
        _cachedProgramsList != null &&
        event.filter == null &&
        event.page == 1) {
      emit(_cachedProgramsList!);
      return;
    }

    emit(const ProgramsLoading());

    try {
      final programs = await _programService.getPrograms(
        filter: event.filter,
        page: event.page,
        limit: _pageSize,
      );

      final loadedState = ProgramsLoaded(
        programs: programs,
        filter: event.filter,
        currentPage: event.page,
        hasMore: programs.length >= _pageSize,
      );

      // Cache only default list (no filter, page 1)
      if (event.filter == null && event.page == 1) {
        _cachedProgramsList = loadedState;
      }

      emit(loadedState);
    } on ApiException catch (e) {
      emit(ProgramsError(message: e.message));
    }
  }

  Future<void> _onLoadMorePrograms(
    LoadMorePrograms event,
    Emitter<ProgramsState> emit,
  ) async {
    final currentState = state;
    if (currentState is! ProgramsLoaded || !currentState.hasMore) return;

    emit(ProgramsLoadingMore(
      programs: currentState.programs,
      filter: currentState.filter,
      currentPage: currentState.currentPage,
    ));

    try {
      final nextPage = currentState.currentPage + 1;
      final programs = await _programService.getPrograms(
        filter: currentState.filter,
        page: nextPage,
        limit: _pageSize,
      );

      emit(ProgramsLoaded(
        programs: [...currentState.programs, ...programs],
        filter: currentState.filter,
        currentPage: nextPage,
        hasMore: programs.length >= _pageSize,
      ));
    } on ApiException catch (e) {
      emit(ProgramsError(message: e.message));
    }
  }

  Future<void> _onLoadRecommendations(
    LoadRecommendations event,
    Emitter<ProgramsState> emit,
  ) async {
    // If we have cached recommendations and not forcing refresh, use them
    if (!event.forceRefresh &&
        _cachedRecommendations != null &&
        _cachedRecommendations!.isNotEmpty) {
      emit(RecommendationsLoaded(programs: _cachedRecommendations!));
      return;
    }

    emit(const ProgramsLoading());

    try {
      final programs = await _programService.getRecommendations(limit: 5);
      _cachedRecommendations = programs; // Cache for later
      emit(RecommendationsLoaded(programs: programs));
    } on ApiException catch (e) {
      emit(ProgramsError(message: e.message));
    }
  }

  Future<void> _onLoadProgramDetail(
    LoadProgramDetail event,
    Emitter<ProgramsState> emit,
  ) async {
    emit(const ProgramsLoading());

    try {
      final program = await _programService.getProgram(event.programId);
      emit(ProgramDetailLoaded(program: program));
    } on ApiException catch (e) {
      emit(ProgramsError(message: e.message));
    }
  }

  Future<void> _onSearchPrograms(
    SearchPrograms event,
    Emitter<ProgramsState> emit,
  ) async {
    emit(const ProgramsLoading());

    try {
      final programs = await _programService.searchPrograms(event.query);
      emit(ProgramsLoaded(
        programs: programs,
        filter: ProgramFilter(searchQuery: event.query),
        hasMore: false,
      ));
    } on ApiException catch (e) {
      emit(ProgramsError(message: e.message));
    }
  }

  Future<void> _onUpdateFilter(
    UpdateFilter event,
    Emitter<ProgramsState> emit,
  ) async {
    add(LoadPrograms(filter: event.filter));
  }

  Future<void> _onClearFilter(
    ClearFilter event,
    Emitter<ProgramsState> emit,
  ) async {
    add(const LoadPrograms());
  }
}
