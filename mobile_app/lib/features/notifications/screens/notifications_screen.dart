import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../../app/theme.dart';
import '../../../core/models/notification.dart';
import '../../../core/utils/constants.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../../../shared/widgets/error_widget.dart';
import '../bloc/notifications_bloc.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    context.read<NotificationsBloc>().add(const LoadNotifications());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.neutral50,
      body: BlocBuilder<NotificationsBloc, NotificationsState>(
        builder: (context, state) {
          return CustomScrollView(
            slivers: [
              // Header
              SliverToBoxAdapter(
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: const BorderRadius.vertical(
                      bottom: Radius.circular(24),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.03),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: SafeArea(
                    bottom: false,
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(8, 8, 20, 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Header row
                          Row(
                            children: [
                              IconButton(
                                onPressed: () {
                                  if (context.canPop()) {
                                    context.pop();
                                  } else {
                                    context.go(AppRoutes.home);
                                  }
                                },
                                icon: PhosphorIcon(
                                  PhosphorIconsLight.arrowLeft,
                                  size: 24,
                                  color: AppTheme.neutral700,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Уведомления',
                                  style: TextStyle(
                                    fontSize: 24,
                                    fontWeight: FontWeight.w700,
                                    color: AppTheme.neutral900,
                                    letterSpacing: -0.5,
                                  ),
                                ),
                              ),
                              if (state is NotificationsLoaded &&
                                  state.unreadCount > 0)
                                TextButton(
                                  onPressed: () {
                                    context
                                        .read<NotificationsBloc>()
                                        .add(const MarkAllNotificationsAsRead());
                                  },
                                  child: Text(
                                    'Прочитать все',
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: AppTheme.primary,
                                    ),
                                  ),
                                ),
                            ],
                          ),

                          // Stats
                          if (state is NotificationsLoaded) ...[
                            const SizedBox(height: 16),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              child: Row(
                                children: [
                                  _StatBadge(
                                    label: 'Всего',
                                    count: state.notifications.length,
                                    color: AppTheme.neutral600,
                                    bgColor: AppTheme.neutral100,
                                  ),
                                  const SizedBox(width: 10),
                                  _StatBadge(
                                    label: 'Непрочитанных',
                                    count: state.unreadCount,
                                    color: AppTheme.primary,
                                    bgColor: AppTheme.primary50,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
              ),

              // Content
              if (state is NotificationsLoading)
                const SliverFillRemaining(
                  child: Center(child: LoadingIndicator()),
                )
              else if (state is NotificationsError)
                SliverFillRemaining(
                  child: AppErrorWidget(
                    message: state.message,
                    onRetry: () {
                      context
                          .read<NotificationsBloc>()
                          .add(const LoadNotifications());
                    },
                  ),
                )
              else if (state is NotificationsLoaded)
                state.notifications.isEmpty
                    ? SliverFillRemaining(
                        child: EmptyState(
                          icon: PhosphorIconsLight.bell,
                          title: 'Нет уведомлений',
                          subtitle: 'Здесь будут отображаться уведомления о статусе ваших заявок и новых программах',
                        ),
                      )
                    : SliverPadding(
                        padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
                        sliver: SliverList(
                          delegate: SliverChildBuilderDelegate(
                            (context, index) {
                              final notification = state.notifications[index];
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: _NotificationCard(
                                  notification: notification,
                                  onTap: () => _handleNotificationTap(notification),
                                  onDismiss: () {
                                    context.read<NotificationsBloc>().add(
                                      DeleteNotification(
                                          notificationId: notification.id),
                                    );
                                  },
                                ),
                              );
                            },
                            childCount: state.notifications.length,
                          ),
                        ),
                      ),
            ],
          );
        },
      ),
    );
  }

  void _handleNotificationTap(AppNotification notification) {
    // Mark as read
    if (!notification.isRead) {
      context.read<NotificationsBloc>().add(
        MarkNotificationAsRead(notificationId: notification.id),
      );
    }

    // Navigate based on type
    final refId = notification.referenceId;
    if (refId != null && refId.isNotEmpty) {
      // Check if referenceId is a valid numeric ID (not mock data like 'app-001')
      final isValidApplicationId = int.tryParse(refId) != null;
      final isValidProgramId = int.tryParse(refId) != null ||
          !refId.startsWith('app-') && !refId.startsWith('prog-');

      switch (notification.type) {
        case NotificationType.applicationStatus:
        case NotificationType.applicationApproved:
        case NotificationType.applicationRejected:
        case NotificationType.documentRequired:
          if (isValidApplicationId) {
            context.push('/applications/$refId');
          } else {
            // Show message for mock notifications
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: const Text('Заявка не найдена'),
                backgroundColor: AppTheme.warning,
                behavior: SnackBarBehavior.floating,
                margin: const EdgeInsets.all(16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            );
          }
          break;
        case NotificationType.newProgram:
        case NotificationType.deadline:
          if (isValidProgramId) {
            context.push('/programs/$refId');
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: const Text('Программа не найдена'),
                backgroundColor: AppTheme.warning,
                behavior: SnackBarBehavior.floating,
                margin: const EdgeInsets.all(16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            );
          }
          break;
        case NotificationType.general:
          // No navigation for general notifications
          break;
      }
    }
  }
}

class _StatBadge extends StatelessWidget {
  final String label;
  final int count;
  final Color color;
  final Color bgColor;

  const _StatBadge({
    required this.label,
    required this.count,
    required this.color,
    required this.bgColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: color,
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              '$count',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  final AppNotification notification;
  final VoidCallback onTap;
  final VoidCallback onDismiss;

  const _NotificationCard({
    required this.notification,
    required this.onTap,
    required this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    final typeColor = Color(notification.type.colorValue);

    return Dismissible(
      key: Key(notification.id),
      direction: DismissDirection.endToStart,
      onDismissed: (_) => onDismiss(),
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: AppTheme.error500,
          borderRadius: BorderRadius.circular(16),
        ),
        child: PhosphorIcon(
          PhosphorIconsLight.trash,
          color: Colors.white,
          size: 24,
        ),
      ),
      child: Container(
        decoration: BoxDecoration(
          color: notification.isRead ? Colors.white : AppTheme.primary50,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: notification.isRead
                ? AppTheme.neutral100
                : AppTheme.primary100,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Icon
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: typeColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Center(
                      child: PhosphorIcon(
                        _getNotificationIcon(notification.type),
                        size: 22,
                        color: typeColor,
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),

                  // Content
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                notification.title,
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: notification.isRead
                                      ? FontWeight.w500
                                      : FontWeight.w600,
                                  color: AppTheme.neutral900,
                                  height: 1.3,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (!notification.isRead) ...[
                              const SizedBox(width: 8),
                              Container(
                                width: 8,
                                height: 8,
                                decoration: BoxDecoration(
                                  color: AppTheme.primary,
                                  shape: BoxShape.circle,
                                ),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          notification.body,
                          style: TextStyle(
                            fontSize: 13,
                            color: AppTheme.neutral600,
                            height: 1.4,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            PhosphorIcon(
                              PhosphorIconsLight.clock,
                              size: 14,
                              color: AppTheme.neutral400,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              Formatters.relativeDate(notification.createdAt),
                              style: TextStyle(
                                fontSize: 12,
                                color: AppTheme.neutral400,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: typeColor.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                notification.type.label,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                  color: typeColor,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  PhosphorIconData _getNotificationIcon(NotificationType type) {
    switch (type) {
      case NotificationType.applicationStatus:
        return PhosphorIconsLight.fileText;
      case NotificationType.applicationApproved:
        return PhosphorIconsLight.checkCircle;
      case NotificationType.applicationRejected:
        return PhosphorIconsLight.xCircle;
      case NotificationType.documentRequired:
        return PhosphorIconsLight.warningCircle;
      case NotificationType.newProgram:
        return PhosphorIconsLight.sparkle;
      case NotificationType.deadline:
        return PhosphorIconsLight.calendarX;
      case NotificationType.general:
        return PhosphorIconsLight.bell;
    }
  }
}
