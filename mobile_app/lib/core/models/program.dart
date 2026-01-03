import 'package:equatable/equatable.dart';

class Program extends Equatable {
  final String id;
  final String name;
  final String description;
  final String provider;
  final ProgramType type;
  final ProgramStatus status;
  final double minAmount;
  final double maxAmount;
  final double? interestRate;
  final double? subsidyRate;
  final int? termMonths;
  final DateTime? deadline;
  final List<String> regions;
  final List<String> okedCodes;
  final List<String> requirements;
  final List<String> documents;
  final String? applicationUrl;
  final double? matchScore;
  final DateTime createdAt;
  final DateTime? updatedAt;

  const Program({
    required this.id,
    required this.name,
    required this.description,
    required this.provider,
    required this.type,
    required this.status,
    required this.minAmount,
    required this.maxAmount,
    this.interestRate,
    this.subsidyRate,
    this.termMonths,
    this.deadline,
    this.regions = const [],
    this.okedCodes = const [],
    this.requirements = const [],
    this.documents = const [],
    this.applicationUrl,
    this.matchScore,
    required this.createdAt,
    this.updatedAt,
  });

  bool get isExpiringSoon {
    if (deadline == null) return false;
    final daysRemaining = deadline!.difference(DateTime.now()).inDays;
    return daysRemaining <= 7 && daysRemaining > 0;
  }

  bool get isExpired {
    if (deadline == null) return false;
    return deadline!.isBefore(DateTime.now());
  }

  bool get hasSubsidy => subsidyRate != null && subsidyRate! > 0;

  /// Show calculator for programs with funding (loans, subsidies, grants)
  bool get showCalculator =>
      (type == ProgramType.subsidy ||
          type == ProgramType.loan ||
          type == ProgramType.grant ||
          type == ProgramType.guarantee) &&
      (maxAmount > 0 || minAmount > 0);

  double get effectiveRate {
    if (interestRate == null) return 0;
    if (subsidyRate == null) return interestRate!;
    return interestRate! - subsidyRate!;
  }

  factory Program.fromJson(Map<String, dynamic> json) {
    // Parse funding_amount which can be string like "50000000.00"
    double parseAmount(dynamic value) {
      if (value == null) return 0;
      if (value is num) return value.toDouble();
      if (value is String) return double.tryParse(value) ?? 0;
      return 0;
    }

    // Parse requirements - can be string or list
    List<String> parseRequirements(dynamic value) {
      if (value == null) return [];
      if (value is List) return value.map((e) => e.toString()).toList();
      if (value is String) return value.isNotEmpty ? [value] : [];
      return [];
    }

    return Program(
      id: json['id'].toString(),
      name: json['title'] as String? ?? json['name'] as String? ?? '',
      description: json['description'] as String? ?? '',
      provider: json['organization'] as String? ?? json['provider'] as String? ?? '',
      type: ProgramType.fromString(json['program_type'] as String? ?? json['type'] as String?),
      status: ProgramStatus.fromString(json['status'] as String?),
      minAmount: parseAmount(json['funding_amount'] ?? json['minAmount']),
      maxAmount: parseAmount(json['funding_amount'] ?? json['maxAmount']),
      interestRate: (json['interestRate'] as num?)?.toDouble(),
      subsidyRate: (json['subsidyRate'] as num?)?.toDouble(),
      termMonths: json['termMonths'] as int?,
      deadline: json['application_deadline'] != null
          ? DateTime.tryParse(json['application_deadline'] as String)
          : (json['deadline'] != null
              ? DateTime.tryParse(json['deadline'] as String)
              : null),
      regions: (json['regions'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      okedCodes: (json['okedCodes'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      requirements: parseRequirements(json['requirements']),
      documents: (json['documents'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      applicationUrl: json['application_process'] as String? ?? json['applicationUrl'] as String?,
      matchScore: (json['matchScore'] as num?)?.toDouble() ?? (json['match_score'] as num?)?.toDouble(),
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'] as String) ?? DateTime.now()
          : (json['createdAt'] != null
              ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
              : DateTime.now()),
      updatedAt: json['updated_at'] != null
          ? DateTime.tryParse(json['updated_at'] as String)
          : (json['updatedAt'] != null
              ? DateTime.tryParse(json['updatedAt'] as String)
              : null),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'provider': provider,
      'type': type.value,
      'status': status.value,
      'minAmount': minAmount,
      'maxAmount': maxAmount,
      'interestRate': interestRate,
      'subsidyRate': subsidyRate,
      'termMonths': termMonths,
      'deadline': deadline?.toIso8601String(),
      'regions': regions,
      'okedCodes': okedCodes,
      'requirements': requirements,
      'documents': documents,
      'applicationUrl': applicationUrl,
      'matchScore': matchScore,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  @override
  List<Object?> get props => [
        id,
        name,
        description,
        provider,
        type,
        status,
        minAmount,
        maxAmount,
        interestRate,
        subsidyRate,
        termMonths,
        deadline,
        regions,
        okedCodes,
        requirements,
        documents,
        applicationUrl,
        matchScore,
        createdAt,
        updatedAt,
      ];
}

enum ProgramType {
  subsidy('subsidy', 'Субсидия', '💰', 'субсидии'),
  grant('grant', 'Грант', '🎁', 'грант'),
  loan('loan', 'Кредит', '💳', 'кредит'),
  guarantee('guarantee', 'Гарантия', '🛡️', 'гарантия'),
  consulting('consulting', 'Консалтинг', '📋', 'консалтинг'),
  training('training', 'Обучение', '📚', 'обучение');

  final String value;
  final String label;
  final String emoji;
  final String backendValue; // Russian value for backend filter

  const ProgramType(this.value, this.label, this.emoji, this.backendValue);

  static ProgramType fromString(String? value) {
    if (value == null) return ProgramType.subsidy;
    final lowerValue = value.toLowerCase();
    // Support both English and Russian values from database
    if (lowerValue == 'кредит' || lowerValue == 'loan' || lowerValue == 'credit' || lowerValue == 'микрокредит') {
      return ProgramType.loan;
    }
    if (lowerValue == 'грант' || lowerValue == 'grant') {
      return ProgramType.grant;
    }
    if (lowerValue == 'субсидия' || lowerValue == 'субсидии' || lowerValue == 'subsidy') {
      return ProgramType.subsidy;
    }
    if (lowerValue == 'гарантия' || lowerValue == 'guarantee') {
      return ProgramType.guarantee;
    }
    if (lowerValue == 'консалтинг' || lowerValue == 'consulting') {
      return ProgramType.consulting;
    }
    if (lowerValue == 'обучение' || lowerValue == 'training') {
      return ProgramType.training;
    }
    return ProgramType.values.firstWhere(
      (type) => type.value == lowerValue || type.backendValue == lowerValue,
      orElse: () => ProgramType.subsidy,
    );
  }
}

enum ProgramStatus {
  open('open', 'Открыт', 0xFF22C55E),
  closing('closing', 'Скоро закрытие', 0xFFF59E0B),
  closed('closed', 'Закрыт', 0xFFEF4444),
  upcoming('upcoming', 'Скоро открытие', 0xFF3B82F6);

  final String value;
  final String label;
  final int colorValue;

  const ProgramStatus(this.value, this.label, this.colorValue);

  static ProgramStatus fromString(String? value) {
    return ProgramStatus.values.firstWhere(
      (status) => status.value == value,
      orElse: () => ProgramStatus.open,
    );
  }
}

class ProgramFilter extends Equatable {
  final List<String>? regions;
  final List<ProgramType>? types;
  final List<String>? okedCodes;
  final double? minAmount;
  final double? maxAmount;
  final List<ProgramStatus>? statuses;
  final String? searchQuery;
  final ProgramSortBy sortBy;
  final bool sortDescending;

  const ProgramFilter({
    this.regions,
    this.types,
    this.okedCodes,
    this.minAmount,
    this.maxAmount,
    this.statuses,
    this.searchQuery,
    this.sortBy = ProgramSortBy.relevance,
    this.sortDescending = true,
  });

  bool get hasFilters =>
      (regions?.isNotEmpty ?? false) ||
      (types?.isNotEmpty ?? false) ||
      (okedCodes?.isNotEmpty ?? false) ||
      minAmount != null ||
      maxAmount != null ||
      (statuses?.isNotEmpty ?? false) ||
      (searchQuery?.isNotEmpty ?? false);

  ProgramFilter copyWith({
    List<String>? regions,
    List<ProgramType>? types,
    List<String>? okedCodes,
    double? minAmount,
    double? maxAmount,
    List<ProgramStatus>? statuses,
    String? searchQuery,
    ProgramSortBy? sortBy,
    bool? sortDescending,
  }) {
    return ProgramFilter(
      regions: regions ?? this.regions,
      types: types ?? this.types,
      okedCodes: okedCodes ?? this.okedCodes,
      minAmount: minAmount ?? this.minAmount,
      maxAmount: maxAmount ?? this.maxAmount,
      statuses: statuses ?? this.statuses,
      searchQuery: searchQuery ?? this.searchQuery,
      sortBy: sortBy ?? this.sortBy,
      sortDescending: sortDescending ?? this.sortDescending,
    );
  }

  Map<String, dynamic> toQueryParams() {
    final params = <String, dynamic>{};

    // Backend expects 'region' (singular) with comma-separated values
    if (regions?.isNotEmpty ?? false) {
      params['region'] = regions!.join(',');
    }

    // Backend expects 'program_type' (singular) with Russian values
    if (types?.isNotEmpty ?? false) {
      params['program_type'] = types!.map((t) => t.backendValue).join(',');
    }

    // Backend expects 'oked_code'
    if (okedCodes?.isNotEmpty ?? false) {
      params['oked_code'] = okedCodes!.join(',');
    }

    // Backend expects 'min_amount' and 'max_amount'
    if (minAmount != null) params['min_amount'] = minAmount;
    if (maxAmount != null) params['max_amount'] = maxAmount;

    // Status filter - backend expects 'open_only' boolean
    if (statuses?.isNotEmpty ?? false) {
      // If only 'open' status is selected, set open_only=true
      if (statuses!.length == 1 && statuses!.first == ProgramStatus.open) {
        params['open_only'] = true;
      }
    }

    if (searchQuery?.isNotEmpty ?? false) params['search'] = searchQuery;

    // Backend expects 'sort_by' and 'sort_order'
    params['sort_by'] = _mapSortByToBackend(sortBy);
    params['sort_order'] = sortDescending ? 'DESC' : 'ASC';

    return params;
  }

  /// Map frontend sort options to backend column names
  String _mapSortByToBackend(ProgramSortBy sort) {
    switch (sort) {
      case ProgramSortBy.amount:
        return 'funding_amount';
      case ProgramSortBy.deadline:
        return 'application_deadline';
      case ProgramSortBy.createdAt:
      case ProgramSortBy.relevance:
        return 'created_at';
    }
  }

  /// Generate a stable cache key from filter parameters
  String toCacheKey() {
    final parts = <String>[];
    if (regions?.isNotEmpty ?? false) {
      final sortedRegions = List<String>.from(regions!)..sort();
      parts.add('r:${sortedRegions.join('_')}');
    }
    if (types?.isNotEmpty ?? false) {
      final sortedTypes = types!.map((t) => t.value).toList()..sort();
      parts.add('t:${sortedTypes.join('_')}');
    }
    if (okedCodes?.isNotEmpty ?? false) {
      final sortedOked = List<String>.from(okedCodes!)..sort();
      parts.add('o:${sortedOked.join('_')}');
    }
    if (minAmount != null) parts.add('min:${minAmount!.toInt()}');
    if (maxAmount != null) parts.add('max:${maxAmount!.toInt()}');
    if (statuses?.isNotEmpty ?? false) {
      final sortedStatuses = statuses!.map((s) => s.value).toList()..sort();
      parts.add('s:${sortedStatuses.join('_')}');
    }
    if (searchQuery?.isNotEmpty ?? false) parts.add('q:$searchQuery');
    parts.add('sb:${sortBy.value}');
    parts.add(sortDescending ? 'desc' : 'asc');
    return parts.isEmpty ? 'default' : parts.join('|');
  }

  @override
  List<Object?> get props => [
        regions,
        types,
        okedCodes,
        minAmount,
        maxAmount,
        statuses,
        searchQuery,
        sortBy,
        sortDescending,
      ];
}

enum ProgramSortBy {
  relevance('relevance', 'По релевантности'),
  amount('amount', 'По сумме'),
  deadline('deadline', 'По сроку'),
  createdAt('createdAt', 'По дате добавления');

  final String value;
  final String label;

  const ProgramSortBy(this.value, this.label);
}
