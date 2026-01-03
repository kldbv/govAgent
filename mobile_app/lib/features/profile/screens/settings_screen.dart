import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../../app/theme.dart';
import '../../../core/utils/constants.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _pushNotifications = true;
  bool _emailNotifications = true;
  bool _smsNotifications = false;
  String _language = 'Русский';
  String _theme = 'Системная';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.neutral50,
      body: CustomScrollView(
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
                  child: Row(
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
                      Text(
                        'Настройки',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.neutral900,
                          letterSpacing: -0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Notifications Section
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Уведомления',
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
                        _SettingSwitch(
                          icon: PhosphorIconsLight.bellRinging,
                          iconColor: AppTheme.primary,
                          iconBgColor: AppTheme.primary50,
                          label: 'Push-уведомления',
                          subtitle: 'Получать уведомления в приложении',
                          value: _pushNotifications,
                          onChanged: (value) {
                            setState(() => _pushNotifications = value);
                          },
                        ),
                        _divider(),
                        _SettingSwitch(
                          icon: PhosphorIconsLight.envelope,
                          iconColor: AppTheme.secondary600,
                          iconBgColor: AppTheme.secondary50,
                          label: 'Email-уведомления',
                          subtitle: 'Получать уведомления на почту',
                          value: _emailNotifications,
                          onChanged: (value) {
                            setState(() => _emailNotifications = value);
                          },
                        ),
                        _divider(),
                        _SettingSwitch(
                          icon: PhosphorIconsLight.chatCircle,
                          iconColor: AppTheme.success600,
                          iconBgColor: AppTheme.success50,
                          label: 'SMS-уведомления',
                          subtitle: 'Получать SMS на телефон',
                          value: _smsNotifications,
                          onChanged: (value) {
                            setState(() => _smsNotifications = value);
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Appearance Section
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Внешний вид',
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
                        _SettingSelect(
                          icon: PhosphorIconsLight.translate,
                          iconColor: AppTheme.primary,
                          iconBgColor: AppTheme.primary50,
                          label: 'Язык',
                          value: _language,
                          onTap: () => _showLanguageDialog(),
                        ),
                        _divider(),
                        _SettingSelect(
                          icon: PhosphorIconsLight.moon,
                          iconColor: AppTheme.neutral600,
                          iconBgColor: AppTheme.neutral100,
                          label: 'Тема',
                          value: _theme,
                          onTap: () => _showThemeDialog(),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Security Section
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Безопасность',
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
                        _SettingItem(
                          icon: PhosphorIconsLight.lock,
                          iconColor: AppTheme.error500,
                          iconBgColor: AppTheme.error50,
                          label: 'Изменить пароль',
                          onTap: () {
                            _showChangePasswordDialog();
                          },
                        ),
                        _divider(),
                        _SettingItem(
                          icon: PhosphorIconsLight.fingerprint,
                          iconColor: AppTheme.success600,
                          iconBgColor: AppTheme.success50,
                          label: 'Биометрическая авторизация',
                          onTap: () {
                            _showBiometricDialog();
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Data Section
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Данные',
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
                    child: _SettingItem(
                      icon: PhosphorIconsLight.trash,
                      iconColor: AppTheme.neutral600,
                      iconBgColor: AppTheme.neutral100,
                      label: 'Очистить кэш',
                      onTap: () {
                        _showClearCacheDialog();
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Delete Account
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 100),
              child: Material(
                color: AppTheme.error50,
                borderRadius: BorderRadius.circular(14),
                child: InkWell(
                  onTap: () => _showDeleteAccountDialog(),
                  borderRadius: BorderRadius.circular(14),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        PhosphorIcon(
                          PhosphorIconsLight.warning,
                          size: 20,
                          color: AppTheme.error,
                        ),
                        const SizedBox(width: 10),
                        Text(
                          'Удалить аккаунт',
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
      ),
    );
  }

  Widget _divider() {
    return Container(
      margin: const EdgeInsets.only(left: 68),
      height: 1,
      color: AppTheme.neutral100,
    );
  }

  void _showLanguageDialog() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Выберите язык',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: AppTheme.neutral900,
              ),
            ),
            const SizedBox(height: 20),
            _LanguageOption(
              label: 'Русский',
              isSelected: _language == 'Русский',
              onTap: () {
                setState(() => _language = 'Русский');
                Navigator.pop(context);
              },
            ),
            const SizedBox(height: 12),
            _LanguageOption(
              label: 'Қазақша',
              isSelected: _language == 'Қазақша',
              onTap: () {
                setState(() => _language = 'Қазақша');
                Navigator.pop(context);
              },
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  void _showThemeDialog() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Выберите тему',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: AppTheme.neutral900,
              ),
            ),
            const SizedBox(height: 20),
            _ThemeOption(
              label: 'Системная',
              icon: PhosphorIconsLight.deviceMobile,
              isSelected: _theme == 'Системная',
              onTap: () {
                setState(() => _theme = 'Системная');
                Navigator.pop(context);
              },
            ),
            const SizedBox(height: 12),
            _ThemeOption(
              label: 'Светлая',
              icon: PhosphorIconsLight.sun,
              isSelected: _theme == 'Светлая',
              onTap: () {
                setState(() => _theme = 'Светлая');
                Navigator.pop(context);
              },
            ),
            const SizedBox(height: 12),
            _ThemeOption(
              label: 'Тёмная',
              icon: PhosphorIconsLight.moon,
              isSelected: _theme == 'Тёмная',
              onTap: () {
                setState(() => _theme = 'Тёмная');
                Navigator.pop(context);
              },
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  void _showChangePasswordDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: Text(
          'Изменить пароль',
          style: TextStyle(color: AppTheme.neutral900),
        ),
        content: Text(
          'Для изменения пароля мы отправим вам письмо с инструкциями на указанную при регистрации почту.',
          style: TextStyle(color: AppTheme.neutral600),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Отмена',
              style: TextStyle(color: AppTheme.neutral600),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Письмо отправлено на вашу почту'),
                ),
              );
            },
            child: const Text('Отправить'),
          ),
        ],
      ),
    );
  }

  void _showBiometricDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: Text(
          'Биометрическая авторизация',
          style: TextStyle(color: AppTheme.neutral900),
        ),
        content: Text(
          'Включить вход по отпечатку пальца или Face ID для быстрого и безопасного доступа к приложению?',
          style: TextStyle(color: AppTheme.neutral600),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Отмена',
              style: TextStyle(color: AppTheme.neutral600),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Биометрическая авторизация включена'),
                ),
              );
            },
            child: const Text('Включить'),
          ),
        ],
      ),
    );
  }

  void _showClearCacheDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: Text(
          'Очистить кэш',
          style: TextStyle(color: AppTheme.neutral900),
        ),
        content: Text(
          'Это удалит временные файлы и освободит место на устройстве. Вам нужно будет повторно загрузить некоторые данные.',
          style: TextStyle(color: AppTheme.neutral600),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Отмена',
              style: TextStyle(color: AppTheme.neutral600),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Кэш очищен'),
                ),
              );
            },
            child: const Text('Очистить'),
          ),
        ],
      ),
    );
  }

  void _showDeleteAccountDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppTheme.error50,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: PhosphorIcon(
                  PhosphorIconsLight.warning,
                  size: 22,
                  color: AppTheme.error500,
                ),
              ),
            ),
            const SizedBox(width: 14),
            const Text('Удалить аккаунт?'),
          ],
        ),
        content: Text(
          'Это действие нельзя отменить. Все ваши данные, включая заявки и документы, будут удалены безвозвратно.',
          style: TextStyle(
            color: AppTheme.neutral600,
            height: 1.5,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Отмена',
              style: TextStyle(color: AppTheme.neutral600),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // TODO: Implement account deletion
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Запрос на удаление аккаунта отправлен'),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.error500,
            ),
            child: const Text('Удалить'),
          ),
        ],
      ),
    );
  }
}

class _SettingSwitch extends StatelessWidget {
  final PhosphorIconData icon;
  final Color iconColor;
  final Color iconBgColor;
  final String label;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _SettingSwitch({
    required this.icon,
    required this.iconColor,
    required this.iconBgColor,
    required this.label,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: iconBgColor,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(
              child: PhosphorIcon(icon, size: 20, color: iconColor),
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
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.neutral900,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 12,
                    color: AppTheme.neutral500,
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: AppTheme.primary,
          ),
        ],
      ),
    );
  }
}

class _SettingSelect extends StatelessWidget {
  final PhosphorIconData icon;
  final Color iconColor;
  final Color iconBgColor;
  final String label;
  final String value;
  final VoidCallback onTap;

  const _SettingSelect({
    required this.icon,
    required this.iconColor,
    required this.iconBgColor,
    required this.label,
    required this.value,
    required this.onTap,
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
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: iconBgColor,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                  child: PhosphorIcon(icon, size: 20, color: iconColor),
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
              Text(
                value,
                style: TextStyle(
                  fontSize: 14,
                  color: AppTheme.neutral500,
                ),
              ),
              const SizedBox(width: 8),
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

class _SettingItem extends StatelessWidget {
  final PhosphorIconData icon;
  final Color iconColor;
  final Color iconBgColor;
  final String label;
  final VoidCallback onTap;

  const _SettingItem({
    required this.icon,
    required this.iconColor,
    required this.iconBgColor,
    required this.label,
    required this.onTap,
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
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: iconBgColor,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                  child: PhosphorIcon(icon, size: 20, color: iconColor),
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

class _LanguageOption extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _LanguageOption({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: isSelected ? AppTheme.primary50 : AppTheme.neutral50,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                    color: isSelected ? AppTheme.primary : AppTheme.neutral900,
                  ),
                ),
              ),
              if (isSelected)
                PhosphorIcon(
                  PhosphorIconsFill.checkCircle,
                  size: 22,
                  color: AppTheme.primary,
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ThemeOption extends StatelessWidget {
  final String label;
  final PhosphorIconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _ThemeOption({
    required this.label,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: isSelected ? AppTheme.primary50 : AppTheme.neutral50,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: isSelected ? AppTheme.primary100 : Colors.white,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                  child: PhosphorIcon(
                    icon,
                    size: 18,
                    color: isSelected ? AppTheme.primary : AppTheme.neutral600,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                    color: isSelected ? AppTheme.primary : AppTheme.neutral900,
                  ),
                ),
              ),
              if (isSelected)
                PhosphorIcon(
                  PhosphorIconsFill.checkCircle,
                  size: 22,
                  color: AppTheme.primary,
                ),
            ],
          ),
        ),
      ),
    );
  }
}
