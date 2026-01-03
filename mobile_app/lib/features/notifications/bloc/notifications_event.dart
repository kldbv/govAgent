part of 'notifications_bloc.dart';

abstract class NotificationsEvent extends Equatable {
  const NotificationsEvent();

  @override
  List<Object?> get props => [];
}

class LoadNotifications extends NotificationsEvent {
  final bool? unreadOnly;

  const LoadNotifications({this.unreadOnly});

  @override
  List<Object?> get props => [unreadOnly];
}

class RefreshNotifications extends NotificationsEvent {
  const RefreshNotifications();
}

class MarkNotificationAsRead extends NotificationsEvent {
  final String notificationId;

  const MarkNotificationAsRead({required this.notificationId});

  @override
  List<Object?> get props => [notificationId];
}

class MarkAllNotificationsAsRead extends NotificationsEvent {
  const MarkAllNotificationsAsRead();
}

class DeleteNotification extends NotificationsEvent {
  final String notificationId;

  const DeleteNotification({required this.notificationId});

  @override
  List<Object?> get props => [notificationId];
}

class LoadUnreadCount extends NotificationsEvent {
  const LoadUnreadCount();
}
