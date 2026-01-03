import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../../app/theme.dart';
import '../../../core/models/user.dart';
import '../../../core/utils/constants.dart';
import '../../auth/bloc/auth_bloc.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.neutral50,
      body: BlocBuilder<AuthBloc, AuthState>(
        builder: (context, state) {
          if (state is AuthAuthenticated) {
            return _ProfileContent(user: state.user);
          }
          return const Center(child: CircularProgressIndicator());
        },
      ),
    );
  }
}

class _ProfileContent extends StatelessWidget {
  final User user;

  const _ProfileContent({required this.user});

  @override
  Widget build(BuildContext context) {
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
            ),
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
                child: Column(
                  children: [
                    // Top bar
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Профиль',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.neutral900,
                            letterSpacing: -0.5,
                          ),
                        ),
                        Container(
                          width: 42,
                          height: 42,
                          decoration: BoxDecoration(
                            color: AppTheme.neutral50,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: IconButton(
                            padding: EdgeInsets.zero,
                            icon: PhosphorIcon(
                              PhosphorIconsLight.gear,
                              size: 22,
                              color: AppTheme.neutral600,
                            ),
                            onPressed: () => context.push(AppRoutes.settings),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 28),

                    // Avatar
                    Container(
                      width: 88,
                      height: 88,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            AppTheme.primary100,
                            AppTheme.primary200,
                          ],
                        ),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          user.initials,
                          style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.primary,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Name & Email
                    Text(
                      user.displayName,
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.neutral900,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      user.email,
                      style: TextStyle(
                        fontSize: 14,
                        color: AppTheme.neutral500,
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Edit button
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: () => context.push(AppRoutes.editProfile),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppTheme.neutral700,
                          side: BorderSide(color: AppTheme.neutral200),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            PhosphorIcon(
                              PhosphorIconsLight.pencilSimple,
                              size: 18,
                              color: AppTheme.neutral600,
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              'Редактировать профиль',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),

        // Info section
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Информация',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.neutral500,
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.neutral100),
                  ),
                  child: Column(
                    children: [
                      _InfoRow(
                        icon: PhosphorIconsLight.phone,
                        iconColor: AppTheme.success600,
                        iconBgColor: AppTheme.success50,
                        label: 'Телефон',
                        value: user.phone ?? 'Не указан',
                      ),
                      _divider(),
                      if (user.userType == UserType.company) ...[
                        _InfoRow(
                          icon: PhosphorIconsLight.buildings,
                          iconColor: AppTheme.primary,
                          iconBgColor: AppTheme.primary50,
                          label: 'Компания',
                          value: user.companyName ?? 'Не указана',
                        ),
                        _divider(),
                        _InfoRow(
                          icon: PhosphorIconsLight.hash,
                          iconColor: AppTheme.secondary600,
                          iconBgColor: AppTheme.secondary50,
                          label: 'БИН',
                          value: user.bin ?? 'Не указан',
                        ),
                        _divider(),
                      ],
                      _InfoRow(
                        icon: PhosphorIconsLight.mapPin,
                        iconColor: AppTheme.error500,
                        iconBgColor: AppTheme.error50,
                        label: 'Регион',
                        value: user.region ?? 'Не указан',
                      ),
                      _divider(),
                      _InfoRow(
                        icon: PhosphorIconsLight.tag,
                        iconColor: AppTheme.neutral600,
                        iconBgColor: AppTheme.neutral100,
                        label: 'ОКЭД',
                        value: user.okedCode ?? 'Не указан',
                        showBorder: false,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),

        // Menu section
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Меню',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.neutral500,
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.neutral100),
                  ),
                  child: Column(
                    children: [
                      _MenuItem(
                        icon: PhosphorIconsLight.fileText,
                        iconColor: AppTheme.primary,
                        iconBgColor: AppTheme.primary50,
                        label: 'Мои заявки',
                        onTap: () => context.push(AppRoutes.applications),
                      ),
                      _divider(),
                      _MenuItem(
                        icon: PhosphorIconsLight.bell,
                        iconColor: AppTheme.secondary600,
                        iconBgColor: AppTheme.secondary50,
                        label: 'Уведомления',
                        onTap: () => context.push(AppRoutes.notifications),
                      ),
                      _divider(),
                      _MenuItem(
                        icon: PhosphorIconsLight.question,
                        iconColor: AppTheme.success600,
                        iconBgColor: AppTheme.success50,
                        label: 'Помощь',
                        onTap: () {},
                      ),
                      _divider(),
                      _MenuItem(
                        icon: PhosphorIconsLight.info,
                        iconColor: AppTheme.neutral600,
                        iconBgColor: AppTheme.neutral100,
                        label: 'О приложении',
                        onTap: () {},
                        showBorder: false,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),

        // Logout
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 40),
            child: Material(
              color: AppTheme.error50,
              borderRadius: BorderRadius.circular(14),
              child: InkWell(
                onTap: () => _showLogoutDialog(context),
                borderRadius: BorderRadius.circular(14),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      PhosphorIcon(
                        PhosphorIconsLight.signOut,
                        size: 20,
                        color: AppTheme.error,
                      ),
                      const SizedBox(width: 10),
                      Text(
                        'Выйти из аккаунта',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w500,
                          color: AppTheme.error,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _divider() {
    return Container(
      margin: const EdgeInsets.only(left: 60),
      height: 1,
      color: AppTheme.neutral100,
    );
  }

  void _showLogoutDialog(BuildContext parentContext) {
    showDialog(
      context: parentContext,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: Text(
          'Выход',
          style: TextStyle(color: AppTheme.neutral900),
        ),
        content: Text(
          'Вы уверены, что хотите выйти из аккаунта?',
          style: TextStyle(color: AppTheme.neutral600),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text(
              'Отмена',
              style: TextStyle(color: AppTheme.neutral600),
            ),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              parentContext.read<AuthBloc>().add(const AuthLogoutRequested());
              parentContext.go(AppRoutes.login);
            },
            child: Text(
              'Выйти',
              style: TextStyle(
                color: AppTheme.error,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final PhosphorIconData icon;
  final Color iconColor;
  final Color iconBgColor;
  final String label;
  final String value;
  final bool showBorder;

  const _InfoRow({
    required this.icon,
    required this.iconColor,
    required this.iconBgColor,
    required this.label,
    required this.value,
    this.showBorder = true,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: iconBgColor,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(
              child: PhosphorIcon(icon, size: 18, color: iconColor),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: AppTheme.neutral500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.neutral900,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MenuItem extends StatelessWidget {
  final PhosphorIconData icon;
  final Color iconColor;
  final Color iconBgColor;
  final String label;
  final VoidCallback onTap;
  final bool showBorder;

  const _MenuItem({
    required this.icon,
    required this.iconColor,
    required this.iconBgColor,
    required this.label,
    required this.onTap,
    this.showBorder = true,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: iconBgColor,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                  child: PhosphorIcon(icon, size: 18, color: iconColor),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.neutral900,
                  ),
                ),
              ),
              PhosphorIcon(
                PhosphorIconsLight.caretRight,
                size: 18,
                color: AppTheme.neutral400,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
