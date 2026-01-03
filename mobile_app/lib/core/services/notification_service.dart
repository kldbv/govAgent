import '../api/api_client.dart';
import '../models/notification.dart';

class NotificationService {
  final ApiClient _apiClient;

  // Local cache for read notification IDs (since backend doesn't support notifications yet)
  final Set<String> _readNotificationIds = {};

  NotificationService({required ApiClient apiClient}) : _apiClient = apiClient;

  Future<List<AppNotification>> getNotifications({
    int page = 1,
    int limit = 20,
    bool? unreadOnly,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      if (unreadOnly == true) {
        queryParams['unreadOnly'] = true;
      }

      final response = await _apiClient.get(
        '/notifications',
        queryParameters: queryParams,
      );

      final data = response.data;
      if (data is Map<String, dynamic> && data['notifications'] != null) {
        return (data['notifications'] as List)
            .map((json) => AppNotification.fromJson(json as Map<String, dynamic>))
            .toList();
      }

      if (data is List) {
        return data
            .map((json) => AppNotification.fromJson(json as Map<String, dynamic>))
            .toList();
      }

      return [];
    } catch (e) {
      // Return mock data for demo if API fails
      return _getMockNotifications().map((n) {
        // Apply local read state
        if (_readNotificationIds.contains(n.id)) {
          return n.copyWith(isRead: true);
        }
        return n;
      }).toList();
    }
  }

  Future<int> getUnreadCount() async {
    try {
      final response = await _apiClient.get('/notifications/unread-count');
      final data = response.data;
      if (data is Map<String, dynamic>) {
        return data['count'] as int? ?? 0;
      }
      return 0;
    } catch (e) {
      // Calculate from mock data with local read state
      final mockNotifications = _getMockNotifications();
      return mockNotifications.where((n) => !n.isRead && !_readNotificationIds.contains(n.id)).length;
    }
  }

  Future<void> markAsRead(String notificationId) async {
    // Always save locally first
    _readNotificationIds.add(notificationId);
    try {
      await _apiClient.put('/notifications/$notificationId/read');
    } catch (e) {
      // API failed, but local state is updated
    }
  }

  Future<void> markAllAsRead() async {
    // Mark all mock notifications as read locally
    final mockNotifications = _getMockNotifications();
    for (final n in mockNotifications) {
      _readNotificationIds.add(n.id);
    }
    try {
      await _apiClient.put('/notifications/read-all');
    } catch (e) {
      // API failed, but local state is updated
    }
  }

  Future<void> deleteNotification(String notificationId) async {
    try {
      await _apiClient.delete('/notifications/$notificationId');
    } catch (e) {
      // Silently fail for demo
    }
  }

  List<AppNotification> _getMockNotifications() {
    final now = DateTime.now();
    return [
      AppNotification(
        id: '1',
        title: 'Заявка одобрена',
        body: 'Ваша заявка на программу "Дорожная карта бизнеса" была одобрена. Свяжитесь с менеджером для получения дальнейших инструкций.',
        type: NotificationType.applicationApproved,
        referenceId: 'app-001',
        isRead: false,
        createdAt: now.subtract(const Duration(hours: 2)),
      ),
      AppNotification(
        id: '2',
        title: 'Требуется дополнительный документ',
        body: 'Для продолжения рассмотрения заявки необходимо предоставить свидетельство о государственной регистрации.',
        type: NotificationType.documentRequired,
        referenceId: 'app-002',
        isRead: false,
        createdAt: now.subtract(const Duration(hours: 6)),
      ),
      AppNotification(
        id: '3',
        title: 'Новая программа поддержки',
        body: 'Доступна новая программа "Гранты для начинающих предпринимателей" с суммой финансирования до 3 000 000 тг.',
        type: NotificationType.newProgram,
        referenceId: 'prog-005',
        isRead: false,
        createdAt: now.subtract(const Duration(days: 1)),
      ),
      AppNotification(
        id: '4',
        title: 'Заявка на рассмотрении',
        body: 'Ваша заявка на программу "Субсидирование процентной ставки" находится на рассмотрении. Ожидайте решения в течение 5 рабочих дней.',
        type: NotificationType.applicationStatus,
        referenceId: 'app-003',
        isRead: true,
        createdAt: now.subtract(const Duration(days: 2)),
      ),
      AppNotification(
        id: '5',
        title: 'Срок подачи заявок истекает',
        body: 'До окончания приема заявок на программу "Инновационные гранты" осталось 3 дня. Не упустите возможность получить финансирование.',
        type: NotificationType.deadline,
        referenceId: 'prog-003',
        isRead: true,
        createdAt: now.subtract(const Duration(days: 3)),
      ),
      AppNotification(
        id: '6',
        title: 'Заявка отклонена',
        body: 'К сожалению, ваша заявка не соответствует требованиям программы. Вы можете подать новую заявку после устранения замечаний.',
        type: NotificationType.applicationRejected,
        referenceId: 'app-004',
        isRead: true,
        createdAt: now.subtract(const Duration(days: 5)),
      ),
    ];
  }
}
