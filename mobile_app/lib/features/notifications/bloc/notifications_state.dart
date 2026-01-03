part of 'notifications_bloc.dart';

abstract class NotificationsState extends Equatable {
  const NotificationsState();

  @override
  List<Object?> get props => [];
}

class NotificationsInitial extends NotificationsState {
  const NotificationsInitial();
}

class NotificationsLoading extends NotificationsState {
  const NotificationsLoading();
}

class NotificationsLoaded extends NotificationsState {
  final List<AppNotification> notifications;
  final int unreadCount;

  const NotificationsLoaded({
    required this.notifications,
    this.unreadCount = 0,
  });

  List<AppNotification> get unreadNotifications =>
      notifications.where((n) => !n.isRead).toList();

  List<AppNotification> get readNotifications =>
      notifications.where((n) => n.isRead).toList();

  @override
  List<Object?> get props => [notifications, unreadCount];
}

class UnreadCountLoaded extends NotificationsState {
  final int count;

  const UnreadCountLoaded({required this.count});

  @override
  List<Object?> get props => [count];
}

class NotificationsError extends NotificationsState {
  final String message;

  const NotificationsError({required this.message});

  @override
  List<Object?> get props => [message];
}
