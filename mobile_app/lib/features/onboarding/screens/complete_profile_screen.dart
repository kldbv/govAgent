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

class CompleteProfileScreen extends StatefulWidget {
  const CompleteProfileScreen({super.key});

  @override
  State<CompleteProfileScreen> createState() => _CompleteProfileScreenState();
}

class _CompleteProfileScreenState extends State<CompleteProfileScreen> {
  final _formKey = GlobalKey<FormState>();

  // Required fields controllers
  final _companyNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _binController = TextEditingController();
  final _okedController = TextEditingController();
  final _experienceYearsController = TextEditingController();
  final _employeeCountController = TextEditingController();
  final _annualRevenueController = TextEditingController();
  final _desiredLoanAmountController = TextEditingController();
  final _businessGoalsCommentsController = TextEditingController();

  // Phone formatter for Kazakhstan format: +7 (7XX) XXX-XX-XX
  final _phoneFormatter = KazakhstanPhoneInputFormatter();

  // Selected values
  BusinessType _businessType = BusinessType.individual;
  BusinessSize _businessSize = BusinessSize.small;
  String _selectedRegion = '';
  String _selectedIndustry = '';
  final Set<String> _selectedBusinessGoals = {};

  int _currentStep = 0;

  @override
  void initState() {
    super.initState();
    // Pre-fill with existing data if available
    final state = context.read<AuthBloc>().state;
    if (state is AuthAuthenticated) {
      final user = state.user;
      _businessType = user.businessType;
      _businessSize = user.businessSize;
      _selectedRegion = user.region ?? '';
      _selectedIndustry = user.industry ?? '';
      _companyNameController.text = user.companyName ?? '';
      // Format existing phone number
      if (user.phone != null && user.phone!.isNotEmpty) {
        _phoneController.text = Formatters.phone(user.phone!);
      }
      _binController.text = user.bin ?? '';
      _okedController.text = user.okedCode ?? '';
      if (user.experienceYears != null) {
        _experienceYearsController.text = user.experienceYears.toString();
      }
      if (user.employeeCount != null) {
        _employeeCountController.text = user.employeeCount.toString();
      }
      if (user.annualRevenue != null) {
        _annualRevenueController.text = user.annualRevenue!.toStringAsFixed(0);
      }
      if (user.desiredLoanAmount != null) {
        _desiredLoanAmountController.text = user.desiredLoanAmount!.toStringAsFixed(0);
      }
      if (user.businessGoals != null) {
        _selectedBusinessGoals.addAll(user.businessGoals!);
      }
      _businessGoalsCommentsController.text = user.businessGoalsComments ?? '';
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

  int get _totalSteps {
    // Step 0: Business type selection
    // Step 1: Basic info (region, industry, experience)
    // Step 2: Company info (only for sme/startup)
    // Step 3: Optional info
    if (_businessType == BusinessType.sme || _businessType == BusinessType.startup) {
      return 4;
    }
    return 3;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.neutral50,
      body: BlocListener<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is AuthProfileUpdateSuccess) {
            context.go(AppRoutes.home);
          } else if (state is AuthError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppTheme.error500,
              ),
            );
          }
        },
        child: SafeArea(
          child: Column(
            children: [
              _buildHeader(),
              _buildProgressIndicator(),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Form(
                    key: _formKey,
                    child: _buildCurrentStep(),
                  ),
                ),
              ),
              _buildBottomButtons(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [AppTheme.primary, AppTheme.primary700],
                  ),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Center(
                  child: PhosphorIcon(
                    PhosphorIconsBold.userCirclePlus,
                    size: 24,
                    color: Colors.white,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Заполните профиль',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.neutral900,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Шаг ${_currentStep + 1} из $_totalSteps',
                      style: TextStyle(
                        fontSize: 14,
                        color: AppTheme.neutral500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildProgressIndicator() {
    final progress = (_currentStep + 1) / _totalSteps;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: AppTheme.neutral200,
              valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primary),
              minHeight: 6,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _getStepTitle(),
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: AppTheme.primary,
                ),
              ),
              Text(
                '${(progress * 100).toInt()}%',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.neutral600,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _getStepTitle() {
    switch (_currentStep) {
      case 0:
        return 'Тип бизнеса';
      case 1:
        return 'Основная информация';
      case 2:
        if (_businessType == BusinessType.sme || _businessType == BusinessType.startup) {
          return 'Данные компании';
        }
        return 'Дополнительно';
      case 3:
        return 'Дополнительно';
      default:
        return '';
    }
  }

  Widget _buildCurrentStep() {
    switch (_currentStep) {
      case 0:
        return _buildBusinessTypeStep();
      case 1:
        return _buildBasicInfoStep();
      case 2:
        if (_businessType == BusinessType.sme || _businessType == BusinessType.startup) {
          return _buildCompanyInfoStep();
        }
        return _buildOptionalInfoStep();
      case 3:
        return _buildOptionalInfoStep();
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildBusinessTypeStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 20),
        Text(
          'Выберите тип бизнеса',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w600,
            color: AppTheme.neutral900,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Это поможет нам подобрать подходящие программы поддержки',
          style: TextStyle(
            fontSize: 14,
            color: AppTheme.neutral500,
            height: 1.4,
          ),
        ),
        const SizedBox(height: 24),
        ...BusinessType.values.map((type) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: _buildBusinessTypeOption(type),
        )),
        const SizedBox(height: 24),
        Text(
          'Размер бизнеса',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w600,
            color: AppTheme.neutral900,
          ),
        ),
        const SizedBox(height: 16),
        ...BusinessSize.values.map((size) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: _buildBusinessSizeOption(size),
        )),
      ],
    );
  }

  Widget _buildBusinessTypeOption(BusinessType type) {
    final isSelected = _businessType == type;
    final icon = _getBusinessTypeIcon(type);

    return GestureDetector(
      onTap: () => setState(() => _businessType = type),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primary50 : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? AppTheme.primary : AppTheme.neutral200,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: isSelected ? AppTheme.primary100 : AppTheme.neutral50,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: PhosphorIcon(
                  icon,
                  size: 22,
                  color: isSelected ? AppTheme.primary : AppTheme.neutral500,
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                type.displayName,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: isSelected ? AppTheme.primary700 : AppTheme.neutral900,
                ),
              ),
            ),
            if (isSelected)
              Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  color: AppTheme.primary,
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: PhosphorIcon(
                    PhosphorIconsBold.check,
                    size: 12,
                    color: Colors.white,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  PhosphorIconData _getBusinessTypeIcon(BusinessType type) {
    switch (type) {
      case BusinessType.startup:
        return PhosphorIconsLight.rocketLaunch;
      case BusinessType.sme:
        return PhosphorIconsLight.buildings;
      case BusinessType.individual:
        return PhosphorIconsLight.user;
      case BusinessType.ngo:
        return PhosphorIconsLight.handHeart;
    }
  }

  Widget _buildBusinessSizeOption(BusinessSize size) {
    final isSelected = _businessSize == size;

    return GestureDetector(
      onTap: () => setState(() => _businessSize = size),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primary50 : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppTheme.primary : AppTheme.neutral200,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                size.displayName,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                  color: isSelected ? AppTheme.primary700 : AppTheme.neutral900,
                ),
              ),
            ),
            if (isSelected)
              PhosphorIcon(
                PhosphorIconsFill.checkCircle,
                size: 20,
                color: AppTheme.primary,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildBasicInfoStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 20),
        Text(
          'Основная информация',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w600,
            color: AppTheme.neutral900,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Эти данные необходимы для подбора программ',
          style: TextStyle(
            fontSize: 14,
            color: AppTheme.neutral500,
            height: 1.4,
          ),
        ),
        const SizedBox(height: 24),
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
          hint: '+7 (777) 123-45-67',
          icon: PhosphorIconsLight.phone,
          keyboardType: TextInputType.phone,
          inputFormatters: [_phoneFormatter],
          validator: Validators.phoneOptional,
        ),
        const SizedBox(height: 16),
        _buildTextField(
          controller: _experienceYearsController,
          label: 'Опыт в бизнесе (лет) *',
          hint: 'Например: 5',
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
    );
  }

  Widget _buildCompanyInfoStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 20),
        Text(
          'Данные компании',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w600,
            color: AppTheme.neutral900,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Информация о вашей организации',
          style: TextStyle(
            fontSize: 14,
            color: AppTheme.neutral500,
            height: 1.4,
          ),
        ),
        const SizedBox(height: 24),
        _buildTextField(
          controller: _companyNameController,
          label: 'Название компании *',
          hint: 'ТОО "Компания"',
          icon: PhosphorIconsLight.buildings,
          validator: (v) => Validators.required(v, 'Название компании'),
        ),
        const SizedBox(height: 16),
        _buildTextField(
          controller: _binController,
          label: 'БИН *',
          hint: '123456789012',
          icon: PhosphorIconsLight.hash,
          keyboardType: TextInputType.number,
          maxLength: 12,
          validator: Validators.bin,
        ),
        const SizedBox(height: 16),
        _buildTextField(
          controller: _okedController,
          label: 'ОКЭД',
          hint: '62.01',
          icon: PhosphorIconsLight.tag,
          validator: Validators.oked,
        ),
      ],
    );
  }

  Widget _buildOptionalInfoStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 20),
        Text(
          'Дополнительная информация',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w600,
            color: AppTheme.neutral900,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Необязательно, но поможет лучше подобрать программы',
          style: TextStyle(
            fontSize: 14,
            color: AppTheme.neutral500,
            height: 1.4,
          ),
        ),
        const SizedBox(height: 24),
        _buildTextField(
          controller: _employeeCountController,
          label: 'Количество сотрудников',
          hint: 'Например: 10',
          icon: PhosphorIconsLight.users,
          keyboardType: TextInputType.number,
        ),
        const SizedBox(height: 16),
        _buildTextField(
          controller: _annualRevenueController,
          label: 'Годовой доход (тенге)',
          hint: 'Например: 50000000',
          icon: PhosphorIconsLight.chartLine,
          keyboardType: TextInputType.number,
        ),
        const SizedBox(height: 16),
        _buildTextField(
          controller: _desiredLoanAmountController,
          label: 'Желаемая сумма кредита (тенге)',
          hint: 'Например: 10000000',
          icon: PhosphorIconsLight.money,
          keyboardType: TextInputType.number,
        ),
        const SizedBox(height: 24),
        Text(
          'Цели бизнеса',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
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
              backgroundColor: Colors.white,
              side: BorderSide(
                color: isSelected ? AppTheme.primary : AppTheme.neutral200,
              ),
              labelStyle: TextStyle(
                color: isSelected ? AppTheme.primary700 : AppTheme.neutral700,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 16),
        _buildTextField(
          controller: _businessGoalsCommentsController,
          label: 'Комментарии к целям',
          hint: 'Опишите подробнее ваши цели...',
          icon: PhosphorIconsLight.notepad,
          maxLines: 3,
        ),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
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
          style: TextStyle(
            fontSize: 15,
            color: AppTheme.neutral900,
          ),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: AppTheme.neutral400),
            counterText: '',
            filled: true,
            fillColor: Colors.white,
            contentPadding: EdgeInsets.symmetric(
              horizontal: 16,
              vertical: maxLines > 1 ? 14 : 14,
            ),
            prefixIcon: maxLines == 1 ? Padding(
              padding: const EdgeInsets.only(left: 14, right: 10),
              child: PhosphorIcon(icon, size: 20, color: AppTheme.neutral400),
            ) : null,
            prefixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppTheme.neutral200),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppTheme.neutral200),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppTheme.primary, width: 2),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppTheme.error, width: 1),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppTheme.error, width: 2),
            ),
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
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.neutral200),
            ),
            child: Row(
              children: [
                Padding(
                  padding: const EdgeInsets.only(right: 10),
                  child: PhosphorIcon(icon, size: 20, color: AppTheme.neutral400),
                ),
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
                          PhosphorIconsLight.checkCircle,
                          size: 18,
                          color: isSelected ? AppTheme.primary : AppTheme.neutral400,
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

  Widget _buildBottomButtons() {
    final isLastStep = _currentStep == _totalSteps - 1;

    return Container(
      padding: EdgeInsets.fromLTRB(
        20,
        16,
        20,
        MediaQuery.of(context).padding.bottom + 16,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Row(
        children: [
          if (_currentStep > 0)
            Expanded(
              child: OutlinedButton(
                onPressed: _previousStep,
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.neutral700,
                  side: BorderSide(color: AppTheme.neutral300),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  'Назад',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                ),
              ),
            ),
          if (_currentStep > 0) const SizedBox(width: 12),
          Expanded(
            flex: _currentStep > 0 ? 2 : 1,
            child: BlocBuilder<AuthBloc, AuthState>(
              builder: (context, state) {
                final isLoading = state is AuthProfileUpdating;
                return ElevatedButton(
                  onPressed: isLoading ? null : (isLastStep ? _saveProfile : _nextStep),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: AppTheme.primary300,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: isLoading
                      ? const SizedBox(
                          height: 22,
                          width: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            color: Colors.white,
                          ),
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              isLastStep ? 'Сохранить' : 'Далее',
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(width: 8),
                            PhosphorIcon(
                              isLastStep
                                  ? PhosphorIconsLight.check
                                  : PhosphorIconsLight.arrowRight,
                              size: 20,
                              color: Colors.white,
                            ),
                          ],
                        ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _nextStep() {
    // Validate current step
    if (_currentStep == 1) {
      // Basic info validation
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
    }

    if (_currentStep == 2 && (_businessType == BusinessType.sme || _businessType == BusinessType.startup)) {
      // Company info validation
      if (!(_formKey.currentState?.validate() ?? false)) {
        return;
      }
    }

    setState(() {
      _currentStep++;
    });
  }

  void _previousStep() {
    setState(() {
      _currentStep--;
    });
  }

  void _showValidationError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppTheme.error500,
      ),
    );
  }

  void _saveProfile() {
    // Final validation
    if (_selectedRegion.isEmpty) {
      _showValidationError('Выберите регион');
      return;
    }
    if (_selectedIndustry.isEmpty) {
      _showValidationError('Выберите отрасль');
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
            ? _phoneController.text.replaceAll(RegExp(r'[^\d+]'), '')
            : null,
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
