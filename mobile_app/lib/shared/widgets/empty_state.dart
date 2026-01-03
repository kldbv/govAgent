import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../app/theme.dart';

class EmptyState extends StatelessWidget {
  final String title;
  final String? subtitle;
  final PhosphorIconData icon;
  final Widget? action;

  const EmptyState({
    super.key,
    required this.title,
    this.subtitle,
    this.icon = PhosphorIconsLight.tray,
    this.action,
  });

  factory EmptyState.noPrograms({VoidCallback? onExplore}) {
    return EmptyState(
      title: 'Нет программ',
      subtitle: 'Попробуйте изменить фильтры',
      icon: PhosphorIconsLight.magnifyingGlass,
      action: onExplore != null
          ? TextButton(
              onPressed: onExplore,
              child: const Text('Сбросить фильтры'),
            )
          : null,
    );
  }

  factory EmptyState.noApplications({VoidCallback? onCreate}) {
    return EmptyState(
      title: 'Нет заявок',
      subtitle: 'Создайте первую заявку на программу поддержки',
      icon: PhosphorIconsLight.fileText,
      action: onCreate != null
          ? ElevatedButton.icon(
              onPressed: onCreate,
              icon: PhosphorIcon(PhosphorIconsLight.plus, size: 18),
              label: const Text('Создать заявку'),
            )
          : null,
    );
  }

  factory EmptyState.noNotifications() {
    return const EmptyState(
      title: 'Нет уведомлений',
      subtitle: 'Здесь будут отображаться важные обновления',
      icon: PhosphorIconsLight.bell,
    );
  }

  factory EmptyState.noResults() {
    return const EmptyState(
      title: 'Ничего не найдено',
      subtitle: 'Попробуйте изменить запрос',
      icon: PhosphorIconsLight.magnifyingGlass,
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
            PhosphorIcon(
              icon,
              size: 80,
              color: AppTheme.neutral300,
            ),
            const SizedBox(height: AppTheme.spacingMd),
            Text(
              title,
              style: Theme.of(context).textTheme.headlineSmall,
              textAlign: TextAlign.center,
            ),
            if (subtitle != null) ...[
              const SizedBox(height: AppTheme.spacingSm),
              Text(
                subtitle!,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.neutral400,
                    ),
                textAlign: TextAlign.center,
              ),
            ],
            if (action != null) ...[
              const SizedBox(height: AppTheme.spacingLg),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}
