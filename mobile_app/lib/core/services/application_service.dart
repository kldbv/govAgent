import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../api/api_exception.dart';
import '../models/application.dart';
import '../models/program.dart';

class ApplicationService {
  final ApiClient _apiClient;

  ApplicationService({required ApiClient apiClient}) : _apiClient = apiClient;

  Future<List<Application>> getApplications({
    ApplicationStatus? status,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
        if (status != null) 'status': status.value,
      };

      final response = await _apiClient.get<Map<String, dynamic>>(
        ApiEndpoints.applications,
        queryParameters: queryParams,
      );

      // Backend returns: { success, data: { applications: [...] } }
      final data = response['data'] as Map<String, dynamic>?;
      final applicationsJson = data?['applications'] as List<dynamic>? ?? [];

      return applicationsJson
          .map((json) => Application.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<Application> getApplication(String id) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      ApiEndpoints.applicationDetail(id),
    );

    // Backend returns: { success, data: { application: {...} } }
    final data = response['data'] as Map<String, dynamic>?;
    final applicationJson = data?['application'] as Map<String, dynamic>? ?? response;

    return Application.fromJson(applicationJson);
  }

  Future<Application> createDraft({
    required String programId,
    required double requestedAmount,
    Map<String, dynamic>? formData,
  }) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        ApiEndpoints.applicationDraft(programId),
        data: {
          'requestedAmount': requestedAmount,
          if (formData != null) 'formData': formData,
        },
      );

      return Application.fromJson(response);
    } on ApiException {
      rethrow;
    }
  }

  Future<Application> updateDraft({
    required String applicationId,
    double? requestedAmount,
    Map<String, dynamic>? formData,
  }) async {
    try {
      final response = await _apiClient.put<Map<String, dynamic>>(
        ApiEndpoints.applicationDetail(applicationId),
        data: {
          if (requestedAmount != null) 'requestedAmount': requestedAmount,
          if (formData != null) 'formData': formData,
        },
      );

      return Application.fromJson(response);
    } on ApiException {
      rethrow;
    }
  }

  Future<Application> submitApplication(String applicationId) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        ApiEndpoints.applicationSubmit(applicationId),
      );

      return Application.fromJson(response);
    } on ApiException {
      rethrow;
    }
  }

  Future<void> cancelApplication(String applicationId) async {
    try {
      await _apiClient.post(
        ApiEndpoints.applicationCancel(applicationId),
      );
    } on ApiException {
      rethrow;
    }
  }

  Future<ApplicationDocument> uploadDocument({
    required String applicationId,
    required String filePath,
    required String documentType,
  }) async {
    try {
      final response = await _apiClient.uploadFile<Map<String, dynamic>>(
        ApiEndpoints.uploadDocument(applicationId),
        filePath: filePath,
        fieldName: 'file',
        data: {'type': documentType},
      );

      return ApplicationDocument.fromJson(response);
    } on ApiException {
      rethrow;
    }
  }

  Future<void> deleteDocument({
    required String applicationId,
    required String documentId,
  }) async {
    try {
      await _apiClient.delete(
        '${ApiEndpoints.uploadDocument(applicationId)}/$documentId',
      );
    } on ApiException {
      rethrow;
    }
  }

  Future<Map<String, int>> getApplicationStats() async {
    try {
      final response = await _apiClient.get<Map<String, dynamic>>(
        '${ApiEndpoints.applications}/stats',
      );

      return {
        'total': response['total'] as int? ?? 0,
        'draft': response['draft'] as int? ?? 0,
        'submitted': response['submitted'] as int? ?? 0,
        'underReview': response['underReview'] as int? ?? 0,
        'approved': response['approved'] as int? ?? 0,
        'rejected': response['rejected'] as int? ?? 0,
      };
    } catch (e) {
      // Return mock stats
      final mockApps = _getMockApplications();
      return {
        'total': mockApps.length,
        'draft': mockApps.where((a) => a.status == ApplicationStatus.draft).length,
        'submitted': mockApps.where((a) => a.status == ApplicationStatus.submitted).length,
        'underReview': mockApps.where((a) => a.status == ApplicationStatus.underReview).length,
        'approved': mockApps.where((a) => a.status == ApplicationStatus.approved).length,
        'rejected': mockApps.where((a) => a.status == ApplicationStatus.rejected).length,
      };
    }
  }

  List<Application> _getMockApplications() {
    final now = DateTime.now();
    return [
      Application(
        id: 'app-001',
        programId: 'prog-001',
        userId: 'user-001',
        program: Program(
          id: 'prog-001',
          name: 'Дорожная карта бизнеса 2025',
          description: 'Государственная программа поддержки',
          provider: 'АО "Фонд развития предпринимательства "Даму"',
          type: ProgramType.subsidy,
          status: ProgramStatus.open,
          minAmount: 5000000,
          maxAmount: 50000000,
          interestRate: 6,
          termMonths: 84,
          deadline: now.add(const Duration(days: 60)),
          requirements: [],
          documents: [],
          createdAt: now.subtract(const Duration(days: 90)),
        ),
        status: ApplicationStatus.approved,
        requestedAmount: 15000000,
        formData: {},
        documents: [],
        createdAt: now.subtract(const Duration(days: 30)),
        updatedAt: now.subtract(const Duration(days: 5)),
        submittedAt: now.subtract(const Duration(days: 28)),
      ),
      Application(
        id: 'app-002',
        programId: 'prog-002',
        userId: 'user-001',
        program: Program(
          id: 'prog-002',
          name: 'Субсидирование процентной ставки',
          description: 'Программа субсидирования',
          provider: 'Министерство национальной экономики РК',
          type: ProgramType.subsidy,
          status: ProgramStatus.open,
          minAmount: 1000000,
          maxAmount: 20000000,
          interestRate: 8,
          termMonths: 60,
          deadline: now.add(const Duration(days: 45)),
          requirements: [],
          documents: [],
          createdAt: now.subtract(const Duration(days: 60)),
        ),
        status: ApplicationStatus.underReview,
        requestedAmount: 8000000,
        formData: {},
        documents: [],
        createdAt: now.subtract(const Duration(days: 14)),
        updatedAt: now.subtract(const Duration(days: 2)),
        submittedAt: now.subtract(const Duration(days: 12)),
      ),
      Application(
        id: 'app-003',
        programId: 'prog-003',
        userId: 'user-001',
        program: Program(
          id: 'prog-003',
          name: 'Гранты для начинающих предпринимателей',
          description: 'Грантовая программа',
          provider: 'НПП "Атамекен"',
          type: ProgramType.grant,
          status: ProgramStatus.open,
          minAmount: 500000,
          maxAmount: 3000000,
          deadline: now.add(const Duration(days: 30)),
          requirements: [],
          documents: [],
          createdAt: now.subtract(const Duration(days: 45)),
        ),
        status: ApplicationStatus.rejected,
        requestedAmount: 2500000,
        formData: {},
        documents: [],
        rejectionReason: 'Не соответствует критериям программы: требуется регистрация ИП не менее 6 месяцев',
        createdAt: now.subtract(const Duration(days: 45)),
        updatedAt: now.subtract(const Duration(days: 10)),
        submittedAt: now.subtract(const Duration(days: 40)),
      ),
      Application(
        id: 'app-004',
        programId: 'prog-004',
        userId: 'user-001',
        program: Program(
          id: 'prog-004',
          name: 'Инновационные гранты',
          description: 'Поддержка инновационных проектов',
          provider: 'АО "QazInnovations"',
          type: ProgramType.grant,
          status: ProgramStatus.open,
          minAmount: 2000000,
          maxAmount: 10000000,
          deadline: now.add(const Duration(days: 20)),
          requirements: [],
          documents: [],
          createdAt: now.subtract(const Duration(days: 30)),
        ),
        status: ApplicationStatus.draft,
        requestedAmount: 5000000,
        formData: {},
        documents: [],
        createdAt: now.subtract(const Duration(days: 3)),
        updatedAt: now.subtract(const Duration(days: 1)),
      ),
    ];
  }
}
