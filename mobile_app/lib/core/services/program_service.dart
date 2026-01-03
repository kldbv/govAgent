import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../models/program.dart';
import 'cache_service.dart';

class ProgramService {
  final ApiClient _apiClient;
  final CacheService? _cacheService;

  // Cache durations
  static const Duration _programsCacheDuration = Duration(minutes: 10);
  static const Duration _recommendationsCacheDuration = Duration(minutes: 15);
  static const Duration _statsCacheDuration = Duration(minutes: 30);

  ProgramService({
    required ApiClient apiClient,
    CacheService? cacheService,
  })  : _apiClient = apiClient,
        _cacheService = cacheService;

  Future<List<Program>> getPrograms({
    ProgramFilter? filter,
    int page = 1,
    int limit = 20,
    bool forceRefresh = false,
  }) async {
    // Build stable cache key from filter parameters
    final filterKey = filter?.toCacheKey() ?? 'no_filter';
    final cacheKey = '${CacheKeys.programs}_p${page}_l${limit}_$filterKey';

    // Try cache first
    if (!forceRefresh && _cacheService != null) {
      final cached = _cacheService.get<List<dynamic>>(
        cacheKey,
        maxAge: _programsCacheDuration,
      );
      if (cached != null) {
        try {
          print('ProgramService: Cache HIT for $cacheKey');
          return cached
              .map((json) => Program.fromJson(json as Map<String, dynamic>))
              .toList();
        } catch (e) {
          print('ProgramService: Cache corrupted for $cacheKey: $e');
        }
      } else {
        print('ProgramService: Cache MISS for $cacheKey');
      }
    }

    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
        ...?filter?.toQueryParams(),
      };

      final response = await _apiClient.get<Map<String, dynamic>>(
        ApiEndpoints.programs,
        queryParameters: queryParams,
      );

      // Backend returns: { success, data: { programs: [...] } }
      final data = response['data'] as Map<String, dynamic>?;
      final programsJson = data?['programs'] as List<dynamic>? ?? [];

      // Cache the result
      if (_cacheService != null) {
        await _cacheService.set(cacheKey, programsJson);
        print('ProgramService: Cached ${programsJson.length} programs for $cacheKey');
      }

      return programsJson
          .map((json) => Program.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      print('ProgramService: Error fetching programs: $e');
      // Return mock data for demo, with local filtering applied
      return _filterMockPrograms(_getMockPrograms(), filter);
    }
  }

  /// Apply filter locally to mock programs
  List<Program> _filterMockPrograms(List<Program> programs, ProgramFilter? filter) {
    if (filter == null || !filter.hasFilters) {
      return programs;
    }

    return programs.where((program) {
      // Filter by type
      if (filter.types != null && filter.types!.isNotEmpty) {
        if (!filter.types!.contains(program.type)) {
          return false;
        }
      }

      // Filter by status
      if (filter.statuses != null && filter.statuses!.isNotEmpty) {
        if (!filter.statuses!.contains(program.status)) {
          return false;
        }
      }

      // Filter by region
      if (filter.regions != null && filter.regions!.isNotEmpty) {
        final programRegions = program.regions.map((r) => r.toLowerCase()).toList();
        final filterRegions = filter.regions!.map((r) => r.toLowerCase()).toList();
        // Check if any filter region matches program regions or program has "Все регионы"
        final hasMatchingRegion = filterRegions.any((r) =>
            programRegions.contains(r) ||
            programRegions.any((pr) => pr.contains('все')));
        if (!hasMatchingRegion) {
          return false;
        }
      }

      // Filter by amount range
      if (filter.minAmount != null && program.maxAmount < filter.minAmount!) {
        return false;
      }
      if (filter.maxAmount != null && program.minAmount > filter.maxAmount!) {
        return false;
      }

      // Filter by search query
      if (filter.searchQuery != null && filter.searchQuery!.isNotEmpty) {
        final query = filter.searchQuery!.toLowerCase();
        final matchesName = program.name.toLowerCase().contains(query);
        final matchesDescription = program.description.toLowerCase().contains(query);
        final matchesProvider = program.provider.toLowerCase().contains(query);
        if (!matchesName && !matchesDescription && !matchesProvider) {
          return false;
        }
      }

      return true;
    }).toList();
  }

  Future<Program> getProgram(String id, {bool forceRefresh = false}) async {
    final cacheKey = CacheKeys.forProgram(id);

    // Try cache first
    if (!forceRefresh && _cacheService != null) {
      final cached = _cacheService.get<Map<String, dynamic>>(
        cacheKey,
        maxAge: _programsCacheDuration,
      );
      if (cached != null) {
        try {
          print('ProgramService: Cache HIT for program $id');
          return Program.fromJson(cached);
        } catch (e) {
          print('ProgramService: Cache corrupted for program $id: $e');
        }
      } else {
        print('ProgramService: Cache MISS for program $id');
      }
    }

    try {
      final response = await _apiClient.get<Map<String, dynamic>>(
        ApiEndpoints.programDetail(id),
      );

      // Backend returns: { success, data: { program: {...} } }
      final data = response['data'] as Map<String, dynamic>?;
      final programJson = data?['program'] as Map<String, dynamic>? ?? data ?? response;

      // Cache the result
      if (_cacheService != null) {
        await _cacheService.set(cacheKey, programJson);
        print('ProgramService: Cached program $id');
      }

      return Program.fromJson(programJson);
    } catch (e) {
      print('ProgramService: Error fetching program $id: $e');
      // Return mock program for demo
      final mockPrograms = _getMockPrograms();
      final mockProgram = mockPrograms.firstWhere(
        (p) => p.id == id,
        orElse: () => mockPrograms.first,
      );
      print('ProgramService: Returning mock program: ${mockProgram.id} - ${mockProgram.name}');
      return mockProgram;
    }
  }

  Future<List<Program>> getRecommendations({
    int limit = 5,
    bool forceRefresh = false,
  }) async {
    final cacheKey = '${CacheKeys.recommendations}_$limit';

    // Try cache first
    if (!forceRefresh && _cacheService != null) {
      final cached = _cacheService.get<List<dynamic>>(
        cacheKey,
        maxAge: _recommendationsCacheDuration,
      );
      if (cached != null) {
        try {
          print('ProgramService: Cache HIT for recommendations');
          return cached
              .map((json) => Program.fromJson(json as Map<String, dynamic>))
              .toList();
        } catch (e) {
          print('ProgramService: Cache corrupted for recommendations: $e');
        }
      } else {
        print('ProgramService: Cache MISS for recommendations');
      }
    }

    try {
      final response = await _apiClient.get<Map<String, dynamic>>(
        ApiEndpoints.programRecommendations,
        queryParameters: {'limit': limit},
      );

      // Backend returns: { success, data: { recommendations: [...] } }
      final data = response['data'] as Map<String, dynamic>?;
      final programsJson = data?['recommendations'] as List<dynamic>? ?? [];

      // Cache the result
      if (_cacheService != null) {
        await _cacheService.set(cacheKey, programsJson);
        print('ProgramService: Cached ${programsJson.length} recommendations');
      }

      return programsJson
          .map((json) => Program.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      print('ProgramService: Error fetching recommendations: $e');
      // Return mock recommendations for demo
      return _getMockPrograms().take(limit).toList();
    }
  }

  Future<List<Program>> searchPrograms(String query) async {
    // Search is always fresh, no caching
    try {
      final response = await _apiClient.get<Map<String, dynamic>>(
        ApiEndpoints.programs,
        queryParameters: {'search': query},
      );

      // Backend returns: { success, data: { programs: [...] } }
      final data = response['data'] as Map<String, dynamic>?;
      final programsJson = data?['programs'] as List<dynamic>? ?? [];
      return programsJson
          .map((json) => Program.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      // Return filtered mock data for demo
      final lowerQuery = query.toLowerCase();
      return _getMockPrograms().where((p) =>
        p.name.toLowerCase().contains(lowerQuery) ||
        p.provider.toLowerCase().contains(lowerQuery) ||
        p.description.toLowerCase().contains(lowerQuery)
      ).toList();
    }
  }

  Future<Map<String, int>> getProgramStats({bool forceRefresh = false}) async {
    // Try cache first
    if (!forceRefresh && _cacheService != null) {
      final cached = _cacheService.get<Map<String, dynamic>>(
        CacheKeys.programStats,
        maxAge: _statsCacheDuration,
      );
      if (cached != null) {
        return {
          'total': cached['total'] as int? ?? 0,
          'open': cached['open'] as int? ?? 0,
          'closing': cached['closing'] as int? ?? 0,
          'subsidies': cached['subsidies'] as int? ?? 0,
          'grants': cached['grants'] as int? ?? 0,
        };
      }
    }

    try {
      final response = await _apiClient.get<Map<String, dynamic>>(
        '${ApiEndpoints.programs}/stats',
      );

      // Backend returns: { success, data: { stats } } or direct stats
      final data = response['data'] as Map<String, dynamic>? ?? response;

      final stats = {
        'total': data['total'] as int? ?? 0,
        'open': data['open'] as int? ?? 0,
        'closing': data['closing'] as int? ?? 0,
        'subsidies': data['subsidies'] as int? ?? 0,
        'grants': data['grants'] as int? ?? 0,
      };

      // Cache the result
      if (_cacheService != null) {
        await _cacheService.set(CacheKeys.programStats, stats);
      }

      return stats;
    } catch (e) {
      // Return mock stats for demo
      final mockPrograms = _getMockPrograms();
      return {
        'total': mockPrograms.length,
        'open': mockPrograms.where((p) => p.status == ProgramStatus.open).length,
        'closing': mockPrograms.where((p) => p.status == ProgramStatus.closing).length,
        'subsidies': mockPrograms.where((p) => p.type == ProgramType.subsidy).length,
        'grants': mockPrograms.where((p) => p.type == ProgramType.grant).length,
      };
    }
  }

  /// Invalidate all program caches
  Future<void> invalidateCache() async {
    if (_cacheService != null) {
      await _cacheService.invalidateByPrefix(CacheKeys.programs);
      await _cacheService.invalidateByPrefix(CacheKeys.programDetail);
      await _cacheService.invalidateByPrefix(CacheKeys.recommendations);
      await _cacheService.invalidate(CacheKeys.programStats);
    }
  }

  List<Program> _getMockPrograms() {
    final now = DateTime.now();
    return [
      Program(
        id: 'prog-001',
        name: 'Дорожная карта бизнеса 2025',
        description: 'Государственная программа поддержки предпринимательства. Предоставляется субсидирование процентной ставки по кредитам и гарантирование кредитов для МСБ.',
        provider: 'АО "Фонд развития предпринимательства "Даму"',
        type: ProgramType.subsidy,
        status: ProgramStatus.open,
        minAmount: 5000000,
        maxAmount: 50000000,
        interestRate: 6,
        subsidyRate: 4,
        termMonths: 84,
        deadline: now.add(const Duration(days: 60)),
        regions: ['Алматы', 'Астана', 'Шымкент'],
        requirements: [
          'Регистрация в РК',
          'Действующий бизнес не менее 6 месяцев',
          'Отсутствие задолженности по налогам',
        ],
        documents: ['Устав', 'Свидетельство о регистрации', 'Бизнес-план'],
        matchScore: 95,
        createdAt: now.subtract(const Duration(days: 90)),
      ),
      Program(
        id: 'prog-002',
        name: 'Субсидирование процентной ставки',
        description: 'Программа снижения процентной ставки для предприятий малого и среднего бизнеса в приоритетных секторах экономики.',
        provider: 'Министерство национальной экономики РК',
        type: ProgramType.subsidy,
        status: ProgramStatus.open,
        minAmount: 1000000,
        maxAmount: 20000000,
        interestRate: 8,
        subsidyRate: 5,
        termMonths: 60,
        deadline: now.add(const Duration(days: 45)),
        regions: ['Все регионы'],
        requirements: [
          'МСБ субъект',
          'Приоритетная отрасль',
        ],
        documents: ['Финансовая отчетность', 'Налоговые декларации'],
        matchScore: 87,
        createdAt: now.subtract(const Duration(days: 60)),
      ),
      Program(
        id: 'prog-003',
        name: 'Гранты для начинающих предпринимателей',
        description: 'Безвозмездная финансовая поддержка для начинающих предпринимателей на реализацию бизнес-идей.',
        provider: 'НПП "Атамекен"',
        type: ProgramType.grant,
        status: ProgramStatus.open,
        minAmount: 500000,
        maxAmount: 3000000,
        deadline: now.add(const Duration(days: 30)),
        regions: ['Алматы', 'Астана'],
        requirements: [
          'Возраст от 18 до 35 лет',
          'Прохождение обучения основам предпринимательства',
          'Наличие бизнес-плана',
        ],
        documents: ['Удостоверение личности', 'Бизнес-план', 'Сертификат обучения'],
        matchScore: 78,
        createdAt: now.subtract(const Duration(days: 45)),
      ),
      Program(
        id: 'prog-004',
        name: 'Инновационные гранты',
        description: 'Грантовое финансирование инновационных проектов в сфере IT, биотехнологий и зеленой экономики.',
        provider: 'АО "QazInnovations"',
        type: ProgramType.grant,
        status: ProgramStatus.closing,
        minAmount: 2000000,
        maxAmount: 10000000,
        deadline: now.add(const Duration(days: 7)),
        regions: ['Все регионы'],
        requirements: [
          'Инновационный проект',
          'Команда разработчиков',
          'Прототип продукта',
        ],
        documents: ['Техническое описание', 'Презентация проекта', 'MVP'],
        matchScore: 65,
        createdAt: now.subtract(const Duration(days: 30)),
      ),
      Program(
        id: 'prog-005',
        name: 'Кредитование агробизнеса',
        description: 'Льготное кредитование сельскохозяйственных предприятий и фермерских хозяйств.',
        provider: 'АО "Аграрная кредитная корпорация"',
        type: ProgramType.loan,
        status: ProgramStatus.open,
        minAmount: 3000000,
        maxAmount: 100000000,
        interestRate: 4,
        termMonths: 120,
        deadline: now.add(const Duration(days: 90)),
        regions: ['Все регионы'],
        requirements: [
          'Сельскохозяйственная деятельность',
          'Земельный участок',
        ],
        documents: ['Документы на землю', 'Бизнес-план'],
        matchScore: 45,
        createdAt: now.subtract(const Duration(days: 120)),
      ),
      Program(
        id: 'prog-006',
        name: 'Гарантирование кредитов МСБ',
        description: 'Предоставление гарантий по кредитам для субъектов малого и среднего бизнеса.',
        provider: 'АО "Фонд развития предпринимательства "Даму"',
        type: ProgramType.guarantee,
        status: ProgramStatus.open,
        minAmount: 1000000,
        maxAmount: 180000000,
        termMonths: 84,
        deadline: now.add(const Duration(days: 120)),
        regions: ['Все регионы'],
        requirements: [
          'МСБ субъект',
          'Положительная кредитная история',
        ],
        documents: ['Кредитная заявка', 'Финансовая отчетность'],
        matchScore: 72,
        createdAt: now.subtract(const Duration(days: 180)),
      ),
    ];
  }
}
