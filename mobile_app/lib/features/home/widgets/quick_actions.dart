import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../../app/theme.dart';
import '../../../core/utils/constants.dart';

class QuickActions extends StatelessWidget {
  const QuickActions({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingMd),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Быстрые действия',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: AppTheme.spacingMd),
          Row(
            children: [
              Expanded(
                child: _ActionCard(
                  icon: PhosphorIconsLight.fileText,
                  label: 'Мои заявки',
                  color: AppTheme.primary,
                  onTap: () => context.push(AppRoutes.applications),
                ),
              ),
              const SizedBox(width: AppTheme.spacingMd),
              Expanded(
                child: _ActionCard(
                  icon: PhosphorIconsLight.calculator,
                  label: 'Калькулятор',
                  color: AppTheme.accent,
                  onTap: () => context.go(AppRoutes.calculator),
                ),
              ),
              const SizedBox(width: AppTheme.spacingMd),
              Expanded(
                child: _ActionCard(
                  icon: PhosphorIconsLight.star,
                  label: 'Рекомендации',
                  color: AppTheme.success,
                  onTap: () => context.go(AppRoutes.programs),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  final PhosphorIconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionCard({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppTheme.radiusMd),
      child: Container(
        padding: const EdgeInsets.all(AppTheme.spacingMd),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(AppTheme.radiusMd),
          border: Border.all(
            color: color.withValues(alpha: 0.15),
          ),
        ),
        child: Column(
          children: [
            PhosphorIcon(
              icon,
              size: 28,
              color: color,
            ),
            const SizedBox(height: AppTheme.spacingSm),
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: color,
                    fontWeight: FontWeight.w600,
                  ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
