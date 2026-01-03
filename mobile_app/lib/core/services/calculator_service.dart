import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../api/api_exception.dart';
import '../models/calculator_result.dart';

class CalculatorService {
  final ApiClient _apiClient;

  CalculatorService({required ApiClient apiClient}) : _apiClient = apiClient;

  Future<CalculatorResult> calculate(CalculatorInput input) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        ApiEndpoints.calculate,
        data: input.toJson(),
      );

      return CalculatorResult.fromJson(response);
    } on ApiException catch (e) {
      // If network error, calculate locally
      if (e.isNetworkError) {
        return CalculatorResult.calculate(input);
      }
      rethrow;
    }
  }

  /// Calculate subsidy savings locally (for offline mode)
  CalculatorResult calculateLocally(CalculatorInput input) {
    return CalculatorResult.calculate(input);
  }

  Future<CalculatorDefaults?> getProgramCalculatorData(String programId) async {
    try {
      final response = await _apiClient.get<Map<String, dynamic>>(
        ApiEndpoints.calculatorProgramData(programId),
      );

      return CalculatorDefaults.fromJson(response);
    } on ApiException {
      return null;
    }
  }
}

class CalculatorDefaults {
  final double minAmount;
  final double maxAmount;
  final double defaultAmount;
  final int minTerm;
  final int maxTerm;
  final int defaultTerm;
  final double defaultBankRate;
  final double subsidyRate;

  const CalculatorDefaults({
    required this.minAmount,
    required this.maxAmount,
    required this.defaultAmount,
    required this.minTerm,
    required this.maxTerm,
    required this.defaultTerm,
    required this.defaultBankRate,
    required this.subsidyRate,
  });

  factory CalculatorDefaults.fromJson(Map<String, dynamic> json) {
    return CalculatorDefaults(
      minAmount: (json['minAmount'] as num).toDouble(),
      maxAmount: (json['maxAmount'] as num).toDouble(),
      defaultAmount: (json['defaultAmount'] as num?)?.toDouble() ?? 50000000,
      minTerm: json['minTerm'] as int? ?? 12,
      maxTerm: json['maxTerm'] as int? ?? 84,
      defaultTerm: json['defaultTerm'] as int? ?? 36,
      defaultBankRate: (json['defaultBankRate'] as num?)?.toDouble() ?? 20.0,
      subsidyRate: (json['subsidyRate'] as num).toDouble(),
    );
  }

  CalculatorInput toInput() {
    return CalculatorInput(
      loanAmount: defaultAmount,
      termMonths: defaultTerm,
      bankRate: defaultBankRate,
      subsidyRate: subsidyRate,
    );
  }
}
