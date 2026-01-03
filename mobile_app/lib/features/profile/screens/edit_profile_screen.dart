import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../../app/theme.dart';
import '../../../core/models/user.dart';
import '../../../core/utils/constants.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/utils/validators.dart';
import '../../auth/bloc/auth_bloc.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();

  // Controllers
  final _companyNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _binController = TextEditingController();
  final _okedController = TextEditingController();
  final _experienceYearsController = TextEditingController();
  final _employeeCountController = TextEditingController();
  final _annualRevenueController = TextEditingController();
  final _desiredLoanAmountController = TextEditingController();
  final _businessGoalsCommentsController = TextEditingController();

  // Selected values
  BusinessType _businessType = BusinessType.individual;
  BusinessSize _businessSize = BusinessSize.small;
  String _selectedRegion = '';
  String _selectedIndustry = '';
  final Set<String> _selectedBusinessGoals = {};

  @override
  void initState() {
    super.initState();
    final state = context.read<AuthBloc>().state;
    if (state is AuthAuthenticated) {
      _businessType = state.user.businessType;
      _businessSize = state.user.businessSize;
      _selectedRegion = state.user.region ?? '';
      _selectedIndustry = state.user.industry ?? '';
      _companyNameController.text = state.user.companyName ?? '';
      // Format phone number on load
      if (state.user.phone != null && state.user.phone!.isNotEmpty) {
        _phoneController.text = Formatters.phone(state.user.phone!);
      }
      _binController.text = state.user.bin ?? '';
      _okedController.text = state.user.okedCode ?? '';
      if (state.user.experienceYears != null) {
        _experienceYearsController.text = state.user.experienceYears.toString();
      }
      if (state.user.employeeCount != null) {
        _employeeCountController.text = state.user.employeeCount.toString();
      }
      if (state.user.annualRevenue != null) {
        _annualRevenueController.text = state.user.annualRevenue!.toStringAsFixed(0);
      }
      if (state.user.desiredLoanAmount != null) {
        _desiredLoanAmountController.text = state.user.desiredLoanAmount!.toStringAsFixed(0);
      }
      if (state.user.businessGoals != null) {
        _selectedBusinessGoals.addAll(state.user.businessGoals!);
      }
      _businessGoalsCommentsController.text = state.user.businessGoalsComments ?? '';
    }
  }

  @override
  void dispose() {
    _companyNameController.dispose();
    _phoneController.dispose();
    _binController.dispose();
    _okedController.dispose();
    _experienceYearsController.dispose();
    _employeeCountController.dispose();
    _annualRevenueController.dispose();
    _desiredLoanAmountController.dispose();
    _businessGoalsCommentsController.dispose();
    super.dispose();
  }

  bool get _isCompanyType =>
      _businessType == BusinessType.sme || _businessType == BusinessType.startup;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.neutral50,
      body: BlocListener<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is AuthProfileUpdateSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: const Text('Профиль успешно обновлён'),
                backgroundColor: AppTheme.success600,
              ),
            );
            if (context.canPop()) {
              context.pop();
            } else {
              context.go(AppRoutes.home);
            }
          } else if (state is AuthError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppTheme.error500,
              ),
            );
          }
        },
        child: CustomScrollView(
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
                          'Редактировать профиль',
                          style: TextStyle(
                            fontSize: 22,
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

            // Form
            SliverPadding(
              padding: const EdgeInsets.all(20),
              sliver: SliverToBoxAdapter(
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Business type section
                      _buildSectionTitle('Тип бизнеса'),
                      const SizedBox(height: 12),
                      _buildBusinessTypeSection(),

                      // Basic info section
                      const SizedBox(height: 24),
                      _buildSectionTitle('Основная информация'),
                      const SizedBox(height: 12),
                      _buildBasicInfoSection(),

                      // Company info (if applicable)
                      if (_isCompanyType) ...[
                        const SizedBox(height: 24),
                        _buildSectionTitle('Данные компании'),
                        const SizedBox(height: 12),
                        _buildCompanyInfoSection(),
                      ],

                      // Additional info section
                      const SizedBox(height: 24),
                      _buildSectionTitle('Дополнительно'),
                      const SizedBox(height: 12),
                      _buildAdditionalInfoSection(),

                      const SizedBox(height: 32),

                      // Save button
                      BlocBuilder<AuthBloc, AuthState>(
                        builder: (context, state) {
                          final isLoading = state is AuthProfileUpdating;
                          return SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: isLoading ? null : _onSave,
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              child: isLoading
                                  ? const SizedBox(
                                      width: 24,
                                      height: 24,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
                                    )
                                  : const Text(
                                      'Сохранить изменения',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                            ),
                          );
                        },
                      ),

                      const SizedBox(height: 60),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w600,
        color: AppTheme.neutral500,
      ),
    );
  }

  Widget _buildBusinessTypeSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.neutral100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Тип',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: AppTheme.neutral700,
            ),
          ),
          const SizedBox(height: 8),
          _buildDropdownSelector(
            value: _businessType.displayName,
            items: BusinessType.values.map((t) => t.displayName).toList(),
            onTap: _showBusinessTypePicker,
          ),
          const SizedBox(height: 16),
          Text(
            'Размер',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: AppTheme.neutral700,
            ),
          ),
          const SizedBox(height: 8),
          _buildDropdownSelector(
            value: _businessSize.displayName,
            items: BusinessSize.values.map((s) => s.displayName).toList(),
            onTap: _showBusinessSizePicker,
          ),
        ],
      ),
    );
  }

  Widget _buildBasicInfoSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.neutral100),
      ),
      child: Column(
        children: [
          _buildPickerField(
            label: 'Регион *',
            value: _selectedRegion,
            placeholder: 'Выберите регион',
            icon: PhosphorIconsLight.mapPin,
            onTap: _showRegionPicker,
          ),
          const SizedBox(height: 16),
          _buildPickerField(
            label: 'Отрасль *',
            value: _selectedIndustry,
            placeholder: 'Выберите отрасль',
            icon: PhosphorIconsLight.factory,
            onTap: _showIndustryPicker,
          ),
          const SizedBox(height: 16),
          _buildTextField(
            controller: _phoneController,
            label: 'Телефон',
            icon: PhosphorIconsLight.phone,
            keyboardType: TextInputType.phone,
            inputFormatters: [KazakhstanPhoneInputFormatter()],
          ),
          const SizedBox(height: 16),
          _buildTextField(
            controller: _experienceYearsController,
            label: 'Опыт в бизнесе (лет) *',
            icon: PhosphorIconsLight.calendarCheck,
            keyboardType: TextInputType.number,
            validator: (v) {
              if (v == null || v.isEmpty) return 'Укажите опыт';
              final years = int.tryParse(v);
              if (years == null || years < 0) return 'Введите корректное число';
              return null;
            },
          ),
        ],
      ),
    );
  }

  Widget _buildCompanyInfoSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.neutral100),
      ),
      child: Column(
        children: [
          _buildTextField(
            controller: _companyNameController,
            label: 'Название компании',
            icon: PhosphorIconsLight.buildings,
          ),
          const SizedBox(height: 16),
          _buildTextField(
            controller: _binController,
            label: 'БИН',
            icon: PhosphorIconsLight.hash,
            keyboardType: TextInputType.number,
            maxLength: 12,
            validator: Validators.binOptional,
          ),
          const SizedBox(height: 16),
          _buildTextField(
            controller: _okedController,
            label: 'ОКЭД',
            icon: PhosphorIconsLight.tag,
            validator: Validators.oked,
          ),
        ],
      ),
    );
  }

  Widget _buildAdditionalInfoSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.neutral100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildTextField(
            controller: _employeeCountController,
            label: 'Количество сотрудников',
            icon: PhosphorIconsLight.users,
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 16),
          _buildTextField(
            controller: _annualRevenueController,
            label: 'Годовой доход (тенге)',
            icon: PhosphorIconsLight.chartLine,
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 16),
          _buildTextField(
            controller: _desiredLoanAmountController,
            label: 'Желаемая сумма кредита (тенге)',
            icon: PhosphorIconsLight.money,
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 20),
          Text(
            'Цели бизнеса',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: AppTheme.neutral700,
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _businessGoalsOptions.map((goal) {
              final isSelected = _selectedBusinessGoals.contains(goal);
              return FilterChip(
                label: Text(goal),
                selected: isSelected,
                onSelected: (selected) {
                  setState(() {
                    if (selected) {
                      _selectedBusinessGoals.add(goal);
                    } else {
                      _selectedBusinessGoals.remove(goal);
                    }
                  });
                },
                selectedColor: AppTheme.primary100,
                checkmarkColor: AppTheme.primary,
                backgroundColor: AppTheme.neutral50,
                side: BorderSide(
                  color: isSelected ? AppTheme.primary : AppTheme.neutral200,
                ),
                labelStyle: TextStyle(
                  color: isSelected ? AppTheme.primary700 : AppTheme.neutral700,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                  fontSize: 13,
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),
          _buildTextField(
            controller: _businessGoalsCommentsController,
            label: 'Комментарии к целям',
            icon: PhosphorIconsLight.notepad,
            maxLines: 3,
          ),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required PhosphorIconData icon,
    TextInputType keyboardType = TextInputType.text,
    int? maxLength,
    int maxLines = 1,
    String? Function(String?)? validator,
    List<TextInputFormatter>? inputFormatters,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: AppTheme.neutral700,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          maxLength: maxLength,
          maxLines: maxLines,
          validator: validator,
          inputFormatters: inputFormatters,
          decoration: InputDecoration(
            counterText: '',
            prefixIcon: maxLines == 1
                ? Padding(
                    padding: const EdgeInsets.only(left: 16, right: 12),
                    child: PhosphorIcon(icon, size: 20, color: AppTheme.neutral400),
                  )
                : null,
            prefixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
          ),
        ),
      ],
    );
  }

  Widget _buildPickerField({
    required String label,
    required String value,
    required String placeholder,
    required PhosphorIconData icon,
    required VoidCallback onTap,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: AppTheme.neutral700,
          ),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: AppTheme.neutral50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.neutral200),
            ),
            child: Row(
              children: [
                PhosphorIcon(icon, size: 20, color: AppTheme.neutral400),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    value.isEmpty ? placeholder : value,
                    style: TextStyle(
                      fontSize: 15,
                      color: value.isEmpty ? AppTheme.neutral400 : AppTheme.neutral900,
                    ),
                  ),
                ),
                PhosphorIcon(
                  PhosphorIconsLight.caretDown,
                  size: 20,
                  color: AppTheme.neutral400,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDropdownSelector({
    required String value,
    required List<String> items,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: AppTheme.neutral50,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.neutral200),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                value,
                style: TextStyle(
                  fontSize: 15,
                  color: AppTheme.neutral900,
                ),
              ),
            ),
            PhosphorIcon(
              PhosphorIconsLight.caretDown,
              size: 20,
              color: AppTheme.neutral400,
            ),
          ],
        ),
      ),
    );
  }

  void _showBusinessTypePicker() {
    _showListPicker(
      title: 'Выберите тип бизнеса',
      items: BusinessType.values.map((t) => t.displayName).toList(),
      selectedItem: _businessType.displayName,
      onSelect: (value) {
        final type = BusinessType.values.firstWhere(
          (t) => t.displayName == value,
          orElse: () => BusinessType.individual,
        );
        setState(() => _businessType = type);
      },
    );
  }

  void _showBusinessSizePicker() {
    _showListPicker(
      title: 'Выберите размер бизнеса',
      items: BusinessSize.values.map((s) => s.displayName).toList(),
      selectedItem: _businessSize.displayName,
      onSelect: (value) {
        final size = BusinessSize.values.firstWhere(
          (s) => s.displayName == value,
          orElse: () => BusinessSize.small,
        );
        setState(() => _businessSize = size);
      },
    );
  }

  void _showRegionPicker() {
    _showListPicker(
      title: 'Выберите регион',
      items: _regions,
      selectedItem: _selectedRegion,
      onSelect: (value) => setState(() => _selectedRegion = value),
    );
  }

  void _showIndustryPicker() {
    _showListPicker(
      title: 'Выберите отрасль',
      items: _industries,
      selectedItem: _selectedIndustry,
      onSelect: (value) => setState(() => _selectedIndustry = value),
    );
  }

  void _showListPicker({
    required String title,
    required List<String> items,
    required String selectedItem,
    required Function(String) onSelect,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        maxChildSize: 0.9,
        minChildSize: 0.4,
        expand: false,
        builder: (context, scrollController) => Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.neutral900,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: PhosphorIcon(
                      PhosphorIconsLight.x,
                      size: 24,
                      color: AppTheme.neutral600,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView.builder(
                controller: scrollController,
                itemCount: items.length,
                itemBuilder: (context, index) {
                  final item = items[index];
                  final isSelected = selectedItem == item;
                  return ListTile(
                    onTap: () {
                      onSelect(item);
                      Navigator.pop(context);
                    },
                    leading: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: isSelected ? AppTheme.primary50 : AppTheme.neutral50,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Center(
                        child: PhosphorIcon(
                          PhosphorIconsLight.mapPin,
                          size: 18,
                          color: isSelected ? AppTheme.primary : AppTheme.neutral600,
                        ),
                      ),
                    ),
                    title: Text(
                      item,
                      style: TextStyle(
                        fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                        color: isSelected ? AppTheme.primary : AppTheme.neutral900,
                      ),
                    ),
                    trailing: isSelected
                        ? PhosphorIcon(
                            PhosphorIconsFill.checkCircle,
                            size: 22,
                            color: AppTheme.primary,
                          )
                        : null,
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _onSave() {
    // Validation
    if (_selectedRegion.isEmpty) {
      _showValidationError('Выберите регион');
      return;
    }
    if (_selectedIndustry.isEmpty) {
      _showValidationError('Выберите отрасль');
      return;
    }
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    final experienceYears = int.tryParse(_experienceYearsController.text) ?? 0;

    context.read<AuthBloc>().add(
      AuthUpdateProfileRequested(
        businessType: _businessType.value,
        businessSize: _businessSize.value,
        industry: _selectedIndustry,
        region: _selectedRegion,
        experienceYears: experienceYears,
        annualRevenue: double.tryParse(_annualRevenueController.text),
        employeeCount: int.tryParse(_employeeCountController.text),
        bin: _binController.text.isNotEmpty ? _binController.text : null,
        okedCode: _okedController.text.isNotEmpty ? _okedController.text : null,
        desiredLoanAmount: double.tryParse(_desiredLoanAmountController.text),
        businessGoals: _selectedBusinessGoals.isNotEmpty
            ? _selectedBusinessGoals.toList()
            : null,
        businessGoalsComments: _businessGoalsCommentsController.text.isNotEmpty
            ? _businessGoalsCommentsController.text
            : null,
        companyName: _companyNameController.text.isNotEmpty
            ? _companyNameController.text
            : null,
        phone: _phoneController.text.isNotEmpty
            ? _phoneController.text
            : null,
      ),
    );
  }

  void _showValidationError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppTheme.error500,
      ),
    );
  }

  static const List<String> _regions = [
    'Алматы',
    'Астана',
    'Шымкент',
    'Акмолинская область',
    'Актюбинская область',
    'Алматинская область',
    'Атырауская область',
    'Западно-Казахстанская область',
    'Жамбылская область',
    'Карагандинская область',
    'Костанайская область',
    'Кызылординская область',
    'Мангистауская область',
    'Павлодарская область',
    'Северо-Казахстанская область',
    'Туркестанская область',
    'Восточно-Казахстанская область',
    'Улытауская область',
    'Абайская область',
    'Жетысуская область',
  ];

  static const List<String> _industries = [
    'IT и технологии',
    'Сельское хозяйство',
    'Производство',
    'Торговля',
    'Услуги',
    'Строительство',
    'Транспорт и логистика',
    'Финансы и страхование',
    'Образование',
    'Здравоохранение',
    'Туризм и гостиничный бизнес',
    'Общественное питание',
    'Недвижимость',
    'Энергетика',
    'Добыча полезных ископаемых',
    'Телекоммуникации',
    'Медиа и развлечения',
    'Наука и исследования',
    'Другое',
  ];

  static const List<String> _businessGoalsOptions = [
    'Расширение бизнеса',
    'Модернизация оборудования',
    'Увеличение штата',
    'Выход на новые рынки',
    'Цифровизация',
    'Экспорт продукции',
    'Получение сертификации',
    'Обучение персонала',
  ];
}
