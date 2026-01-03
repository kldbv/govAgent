import 'package:flutter/material.dart';
import '../../app/theme.dart';

class AppErrorWidget extends StatelessWidget {
  final String message;
  final String? details;
  final VoidCallback? onRetry;
  final IconData icon;

  const AppErrorWidget({
    super.key,
    required this.message,
    this.details,
    this.onRetry,
    this.icon = Icons.error_outline,
  });

  factory AppErrorWidget.network({VoidCallback? onRetry}) {
    return AppErrorWidget(
      message: 'Ошибка сети',
      details: 'Проверьте подключение к интернету',
      icon: Icons.wifi_off,
      onRetry: onRetry,
    );
  }

  factory AppErrorWidget.server({VoidCallback? onRetry}) {
    return AppErrorWidget(
      message: 'Ошибка сервера',
      details: 'Попробуйте позже',
      icon: Icons.cloud_off,
      onRetry: onRetry,
    );
  }

  factory AppErrorWidget.notFound({String? message}) {
    return AppErrorWidget(
      message: message ?? 'Не найдено',
      icon: Icons.search_off,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.spacingLg),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 64,
              color: AppTheme.errorColor.withValues(alpha: 0.7),
            ),
            const SizedBox(height: AppTheme.spacingMd),
            Text(
              message,
              style: Theme.of(context).textTheme.headlineSmall,
              textAlign: TextAlign.center,
            ),
            if (details != null) ...[
              const SizedBox(height: AppTheme.spacingSm),
              Text(
                details!,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.textSecondaryLight,
                    ),
                textAlign: TextAlign.center,
              ),
            ],
            if (onRetry != null) ...[
              const SizedBox(height: AppTheme.spacingLg),
              ElevatedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: const Text('Повторить'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
