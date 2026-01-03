import 'dart:async';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../../app/theme.dart';
import '../../../core/models/application.dart';
import '../../../core/models/program.dart';
import '../../../core/utils/constants.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/utils/validators.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../programs/bloc/programs_bloc.dart';
import '../bloc/applications_bloc.dart';

/// Модель для хранения информации о загруженном документе
class UploadedDocument {
  final String name;
  final String? path;
  final int size;
  final bool isUploading;
  final bool isUploaded;
  final String? error;

  const UploadedDocument({
    required this.name,
    this.path,
    this.size = 0,
    this.isUploading = false,
    this.isUploaded = false,
    this.error,
  });

  UploadedDocument copyWith({
    String? name,
    String? path,
    int? size,
    bool? isUploading,
    bool? isUploaded,
    String? error,
  }) {
    return UploadedDocument(
      name: name ?? this.name,
      path: path ?? this.path,
      size: size ?? this.size,
      isUploading: isUploading ?? this.isUploading,
      isUploaded: isUploaded ?? this.isUploaded,
      error: error,
    );
  }
}

class ApplicationFormScreen extends StatefulWidget {
  final String? programId;
  final String? draftId;

  const ApplicationFormScreen({
    super.key,
    this.programId,
    this.draftId,
  }) : assert(programId != null || draftId != null,
            'Either programId or draftId must be provided');

  /// Создание новой заявки
  const ApplicationFormScreen.newApplication({
    super.key,
    required String programId,
  })  : programId = programId,
        draftId = null;

  /// Редактирование черновика
  const ApplicationFormScreen.fromDraft({
    super.key,
    required String draftId,
  })  : draftId = draftId,
        programId = null;

  bool get isEditingDraft => draftId != null;

  @override
  State<ApplicationFormScreen> createState() => _ApplicationFormScreenState();
}

class _ApplicationFormScreenState extends State<ApplicationFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _purposeController = TextEditingController();
  final _companyNameController = TextEditingController();
  final _binController = TextEditingController();
  final _phoneController = TextEditingController();

  bool _isSubmitting = false;
  bool _isSavingDraft = false;
  Application? _draft;

  /// Map of document requirement name -> uploaded document info
  final Map<String, UploadedDocument> _uploadedDocuments = {};

  /// Auto-save timer
  Timer? _autoSaveTimer;
  static const Duration _autoSaveInterval = Duration(seconds: 30);

  /// Track if form has unsaved changes
  bool _hasUnsavedChanges = false;

  /// Track last saved form data for comparison
  Map<String, dynamic>? _lastSavedFormData;
  double? _lastSavedAmount;

  /// Track if current save is manual (vs auto-save)
  bool _isManualSave = false;

  @override
  void initState() {
    super.initState();

    // Add listeners for form changes
    _amountController.addListener(_onFormChanged);
    _purposeController.addListener(_onFormChanged);
    _companyNameController.addListener(_onFormChanged);
    _binController.addListener(_onFormChanged);
    _phoneController.addListener(_onFormChanged);

    // Start auto-save timer
    _startAutoSaveTimer();

    if (widget.isEditingDraft) {
      // Загружаем черновик для редактирования
      context.read<ApplicationsBloc>().add(
            LoadDraftForEditing(applicationId: widget.draftId!),
          );
    } else {
      // Загружаем программу для новой заявки
      context.read<ProgramsBloc>().add(
            LoadProgramDetail(programId: widget.programId!),
          );
      _prefillFromUserProfile();
    }
  }

  /// Start the auto-save timer
  void _startAutoSaveTimer() {
    _autoSaveTimer?.cancel();
    _autoSaveTimer = Timer.periodic(_autoSaveInterval, (_) {
      _autoSaveDraft();
    });
  }

  /// Called when any form field changes
  void _onFormChanged() {
    if (!_hasUnsavedChanges) {
      setState(() => _hasUnsavedChanges = true);
    }
  }

  /// Check if form data has actually changed since last save
  bool _hasFormDataChanged() {
    final currentFormData = _getFormData();
    final currentAmount = _getRequestedAmount();

    if (_lastSavedFormData == null && _lastSavedAmount == null) {
      // Never saved before - check if anything was entered
      return currentAmount > 0 ||
          currentFormData.values.any((v) => v.toString().isNotEmpty);
    }

    // Compare with last saved state
    if (currentAmount != _lastSavedAmount) return true;

    for (final key in currentFormData.keys) {
      if (currentFormData[key] != _lastSavedFormData?[key]) {
        return true;
      }
    }

    return false;
  }

  /// Auto-save draft if there are unsaved changes
  void _autoSaveDraft() {
    if (!_hasUnsavedChanges || _isSavingDraft || _isSubmitting) return;
    if (!_hasFormDataChanged()) {
      _hasUnsavedChanges = false;
      return;
    }

    // Only auto-save if we have at least some meaningful data
    final amount = _getRequestedAmount();
    final formData = _getFormData();
    final hasContent = amount > 0 ||
        formData['companyName'].toString().isNotEmpty ||
        formData['purpose'].toString().isNotEmpty;

    if (!hasContent) return;

    _performAutoSave();
  }

  /// Perform the auto-save operation
  void _performAutoSave() {
    setState(() => _isSavingDraft = true);

    final programId = _draft?.programId ?? widget.programId!;
    final formData = _getFormData();
    final amount = _getRequestedAmount();

    // Save last state
    _lastSavedFormData = Map.from(formData);
    _lastSavedAmount = amount;

    if (_draft != null) {
      // Обновляем существующий черновик
      context.read<ApplicationsBloc>().add(
            UpdateDraft(
              applicationId: _draft!.id,
              requestedAmount: amount,
              formData: formData,
            ),
          );
    } else {
      // Создаём новый черновик
      context.read<ApplicationsBloc>().add(
            SaveDraft(
              programId: programId,
              requestedAmount: amount,
              formData: formData,
            ),
          );
    }
  }

  void _prefillFromDraft(Application draft) {
    _draft = draft;

    // Заполняем поля из черновика
    if (draft.requestedAmount > 0) {
      _amountController.text = draft.requestedAmount.toStringAsFixed(0);
    }

    final formData = draft.formData;
    if (formData.containsKey('purpose')) {
      _purposeController.text = formData['purpose'] as String? ?? '';
    }
    if (formData.containsKey('companyName')) {
      _companyNameController.text = formData['companyName'] as String? ?? '';
    }
    if (formData.containsKey('bin')) {
      _binController.text = formData['bin'] as String? ?? '';
    }
    if (formData.containsKey('phone')) {
      final phone = formData['phone'] as String? ?? '';
      _phoneController.text = phone.isNotEmpty ? Formatters.phone(phone) : '';
    }

    // Если данные черновика пусты, заполняем из профиля
    if (_companyNameController.text.isEmpty ||
        _binController.text.isEmpty ||
        _phoneController.text.isEmpty) {
      _prefillFromUserProfile();
    }

    // Set initial saved state to prevent immediate auto-save
    _lastSavedFormData = _getFormData();
    _lastSavedAmount = draft.requestedAmount;
    _hasUnsavedChanges = false;

    // Загружаем программу черновика
    context.read<ProgramsBloc>().add(
          LoadProgramDetail(programId: draft.programId),
        );
  }

  void _prefillFromUserProfile() {
    final authState = context.read<AuthBloc>().state;
    if (authState is AuthAuthenticated) {
      final user = authState.user;

      // Pre-fill company info (only if not already filled)
      if (_companyNameController.text.isEmpty &&
          user.companyName != null &&
          user.companyName!.isNotEmpty) {
        _companyNameController.text = user.companyName!;
      }

      if (_binController.text.isEmpty &&
          user.bin != null &&
          user.bin!.isNotEmpty) {
        _binController.text = user.bin!;
      }

      // Pre-fill phone with formatting
      if (_phoneController.text.isEmpty &&
          user.phone != null &&
          user.phone!.isNotEmpty) {
        _phoneController.text = Formatters.phone(user.phone!);
      }
    }
  }

  @override
  void dispose() {
    // Cancel auto-save timer
    _autoSaveTimer?.cancel();

    // Remove listeners
    _amountController.removeListener(_onFormChanged);
    _purposeController.removeListener(_onFormChanged);
    _companyNameController.removeListener(_onFormChanged);
    _binController.removeListener(_onFormChanged);
    _phoneController.removeListener(_onFormChanged);

    // Save draft if there are unsaved changes before leaving
    if (_hasUnsavedChanges && _hasFormDataChanged() && !_isSubmitting) {
      _performAutoSave();
    }

    _amountController.dispose();
    _purposeController.dispose();
    _companyNameController.dispose();
    _binController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  /// Получить данные формы
  Map<String, dynamic> _getFormData() {
    return {
      'purpose': _purposeController.text,
      'companyName': _companyNameController.text,
      'bin': _binController.text,
      'phone': _phoneController.text.replaceAll(RegExp(r'[^\d+]'), ''),
    };
  }

  /// Получить сумму из поля
  double _getRequestedAmount() {
    final cleanedAmount =
        _amountController.text.replaceAll(RegExp(r'[^\d]'), '');
    return double.tryParse(cleanedAmount) ?? 0;
  }

  /// Сохранить черновик (ручное сохранение)
  void _saveDraft() {
    _isManualSave = true;
    setState(() => _isSavingDraft = true);

    final programId = _draft?.programId ?? widget.programId!;
    final formData = _getFormData();
    final amount = _getRequestedAmount();

    // Save last state
    _lastSavedFormData = Map.from(formData);
    _lastSavedAmount = amount;

    if (_draft != null) {
      // Обновляем существующий черновик
      context.read<ApplicationsBloc>().add(
            UpdateDraft(
              applicationId: _draft!.id,
              requestedAmount: amount,
              formData: formData,
            ),
          );
    } else {
      // Создаём новый черновик
      context.read<ApplicationsBloc>().add(
            SaveDraft(
              programId: programId,
              requestedAmount: amount,
              formData: formData,
            ),
          );
    }
  }

  void _submitApplication() {
    if (_formKey.currentState?.validate() ?? false) {
      setState(() => _isSubmitting = true);

      final programId = _draft?.programId ?? widget.programId!;
      final formData = _getFormData();
      final amount = _getRequestedAmount();

      // Создаём заявку и сразу отправляем
      context.read<ApplicationsBloc>().add(
            CreateApplication(
              programId: programId,
              requestedAmount: amount,
              formData: formData,
              autoSubmit: true,
            ),
          );
    }
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: AppTheme.success50,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: PhosphorIcon(
                  PhosphorIconsFill.checkCircle,
                  size: 40,
                  color: AppTheme.success600,
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Заявка отправлена!',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppTheme.neutral900,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Мы рассмотрим вашу заявку и свяжемся с вами в ближайшее время.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: AppTheme.neutral500,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  context.go('/applications');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  'Мои заявки',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocListener(
      listeners: [
        // Слушаем состояние загрузки черновика
        BlocListener<ApplicationsBloc, ApplicationsState>(
          listener: (context, state) {
            if (state is DraftLoaded) {
              _prefillFromDraft(state.draft);
            } else if (state is DraftSaved) {
              setState(() {
                _isSavingDraft = false;
                _hasUnsavedChanges = false;
              });
              _draft = state.draft;

              // Only show snackbar for manual save
              if (_isManualSave) {
                _isManualSave = false;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: const Text('Черновик сохранён'),
                    backgroundColor: AppTheme.success600,
                    behavior: SnackBarBehavior.floating,
                    margin: const EdgeInsets.all(16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                );
              }
            } else if (state is ApplicationSubmitted) {
              setState(() => _isSubmitting = false);
              _showSuccessDialog();
            } else if (state is ApplicationsError) {
              setState(() {
                _isSubmitting = false;
                _isSavingDraft = false;
              });
              _isManualSave = false;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.message),
                  backgroundColor: AppTheme.error,
                  behavior: SnackBarBehavior.floating,
                  margin: const EdgeInsets.all(16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              );
            }
          },
        ),
      ],
      child: Scaffold(
        backgroundColor: AppTheme.neutral50,
        body: BlocBuilder<ProgramsBloc, ProgramsState>(
          builder: (context, state) {
            Program? program;
            if (state is ProgramDetailLoaded) {
              program = state.program;
            }

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
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Top bar
                        Padding(
                          padding: const EdgeInsets.fromLTRB(8, 8, 20, 0),
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
                              Expanded(
                                child: Text(
                                  widget.isEditingDraft ? 'Редактирование' : 'Новая заявка',
                                  style: TextStyle(
                                    fontSize: 24,
                                    fontWeight: FontWeight.w700,
                                    color: AppTheme.neutral900,
                                    letterSpacing: -0.5,
                                  ),
                                ),
                              ),
                              // Кнопка сохранения черновика
                              TextButton.icon(
                                onPressed: _isSavingDraft ? null : _saveDraft,
                                icon: _isSavingDraft
                                    ? SizedBox(
                                        width: 16,
                                        height: 16,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          color: AppTheme.primary,
                                        ),
                                      )
                                    : Stack(
                                        clipBehavior: Clip.none,
                                        children: [
                                          PhosphorIcon(
                                            PhosphorIconsLight.floppyDisk,
                                            size: 18,
                                            color: AppTheme.primary,
                                          ),
                                          // Indicator for unsaved changes
                                          if (_hasUnsavedChanges)
                                            Positioned(
                                              right: -2,
                                              top: -2,
                                              child: Container(
                                                width: 8,
                                                height: 8,
                                                decoration: BoxDecoration(
                                                  color: AppTheme.warning,
                                                  shape: BoxShape.circle,
                                                  border: Border.all(
                                                    color: Colors.white,
                                                    width: 1,
                                                  ),
                                                ),
                                              ),
                                            ),
                                        ],
                                      ),
                                label: Text(
                                  _isSavingDraft
                                      ? 'Сохранение...'
                                      : _hasUnsavedChanges
                                          ? 'Сохранить'
                                          : 'Сохранено',
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: _hasUnsavedChanges
                                        ? AppTheme.primary
                                        : AppTheme.neutral500,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Program info card
                        if (program != null)
                          Padding(
                            padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: AppTheme.primary50,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: AppTheme.primary100),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 44,
                                    height: 44,
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Center(
                                      child: Text(
                                        program.type.emoji,
                                        style: const TextStyle(fontSize: 20),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          program.name,
                                          style: TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w600,
                                            color: AppTheme.neutral900,
                                          ),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          Formatters.currencyRange(
                                            program.minAmount,
                                            program.maxAmount,
                                          ),
                                          style: TextStyle(
                                            fontSize: 13,
                                            color: AppTheme.primary700,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ],
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

              // Form
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Company info section
                        _buildSectionTitle('Информация о компании'),
                        const SizedBox(height: 14),

                        _buildInputField(
                          label: 'Название компании',
                          controller: _companyNameController,
                          hint: 'ТОО "Компания"',
                          icon: PhosphorIconsLight.buildings,
                          validator: (v) => Validators.required(v, 'Название'),
                        ),
                        const SizedBox(height: 16),

                        _buildInputField(
                          label: 'БИН',
                          controller: _binController,
                          hint: '123456789012',
                          icon: PhosphorIconsLight.hash,
                          keyboardType: TextInputType.number,
                          validator: Validators.bin,
                        ),
                        const SizedBox(height: 16),

                        _buildInputField(
                          label: 'Контактный телефон',
                          controller: _phoneController,
                          hint: '+7 (777) 123-45-67',
                          icon: PhosphorIconsLight.phone,
                          keyboardType: TextInputType.phone,
                          validator: Validators.phone,
                          inputFormatters: [KazakhstanPhoneInputFormatter()],
                        ),
                        const SizedBox(height: 28),

                        // Application details section
                        _buildSectionTitle('Детали заявки'),
                        const SizedBox(height: 14),

                        _buildAmountField(program),
                        const SizedBox(height: 16),

                        _buildInputField(
                          label: 'Цель финансирования',
                          controller: _purposeController,
                          hint: 'Опишите цель использования средств',
                          icon: PhosphorIconsLight.target,
                          maxLines: 4,
                          validator: (v) => Validators.required(v, 'Цель'),
                        ),
                        const SizedBox(height: 28),

                        // Required documents section
                        _buildDocumentsSection(program),
                        const SizedBox(height: 100),
                      ],
                    ),
                  ),
                ),
              ),
              ],
            );
          },
        ),
        // Submit button
        bottomNavigationBar: Container(
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
          child: SizedBox(
            height: 52,
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : _submitApplication,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
                disabledBackgroundColor: AppTheme.primary300,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: _isSubmitting
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
                        const Text(
                          'Отправить заявку',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(width: 8),
                        PhosphorIcon(
                          PhosphorIconsLight.paperPlaneTilt,
                          size: 20,
                          color: Colors.white,
                        ),
                      ],
                    ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: AppTheme.neutral900,
      ),
    );
  }

  Widget _buildAmountField(Program? program) {
    final minAmount = program?.minAmount ?? 0;
    final maxAmount = program?.maxAmount ?? 500000000;

    // Generate hint based on program limits
    final hintText = program != null
        ? Formatters.currencyRange(minAmount, maxAmount)
        : '50 000 000';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              'Запрашиваемая сумма (₸)',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: AppTheme.neutral700,
              ),
            ),
            const Spacer(),
            if (program != null)
              Text(
                'макс: ${Formatters.currencyShort(maxAmount)}',
                style: TextStyle(
                  fontSize: 12,
                  color: AppTheme.neutral500,
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: _amountController,
          keyboardType: TextInputType.number,
          inputFormatters: [
            _AmountInputFormatter(),
          ],
          validator: (value) {
            if (value == null || value.isEmpty) {
              return 'Сумма обязательна для заполнения';
            }
            final cleanedValue = value.replaceAll(RegExp(r'[^\d]'), '');
            final amount = double.tryParse(cleanedValue);
            if (amount == null) {
              return 'Введите корректную сумму';
            }
            if (minAmount > 0 && amount < minAmount) {
              return 'Минимальная сумма: ${Formatters.currencyShort(minAmount)}';
            }
            if (amount > maxAmount) {
              return 'Максимальная сумма: ${Formatters.currencyShort(maxAmount)}';
            }
            return null;
          },
          style: TextStyle(
            fontSize: 15,
            color: AppTheme.neutral900,
          ),
          decoration: InputDecoration(
            hintText: hintText,
            hintStyle: TextStyle(color: AppTheme.neutral400),
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
            prefixIcon: Padding(
              padding: const EdgeInsets.only(left: 14, right: 10),
              child: PhosphorIcon(
                PhosphorIconsLight.currencyCircleDollar,
                size: 20,
                color: AppTheme.neutral400,
              ),
            ),
            prefixIconConstraints:
                const BoxConstraints(minWidth: 0, minHeight: 0),
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
              borderSide: BorderSide(
                color: AppTheme.primary,
                width: 2,
              ),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: AppTheme.error,
                width: 1,
              ),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: AppTheme.error,
                width: 2,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInputField({
    required String label,
    required TextEditingController controller,
    required String hint,
    required PhosphorIconData icon,
    TextInputType? keyboardType,
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
            filled: true,
            fillColor: Colors.white,
            contentPadding: EdgeInsets.symmetric(
              horizontal: 16,
              vertical: maxLines > 1 ? 16 : 14,
            ),
            prefixIcon: maxLines == 1
                ? Padding(
                    padding: const EdgeInsets.only(left: 14, right: 10),
                    child: PhosphorIcon(
                      icon,
                      size: 20,
                      color: AppTheme.neutral400,
                    ),
                  )
                : null,
            prefixIconConstraints:
                const BoxConstraints(minWidth: 0, minHeight: 0),
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
              borderSide: BorderSide(
                color: AppTheme.primary,
                width: 2,
              ),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: AppTheme.error,
                width: 1,
              ),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: AppTheme.error,
                width: 2,
              ),
            ),
          ),
        ),
      ],
    );
  }

  /// Получить список документов для программы
  List<String> _getRequiredDocuments(Program? program) {
    if (program != null && program.documents.isNotEmpty) {
      return program.documents;
    }
    // Документы по умолчанию, если программа не указала свои
    return [
      'Учредительные документы',
      'Финансовая отчётность',
      'Бизнес-план',
    ];
  }

  /// Получить иконку для типа документа
  PhosphorIconData _getDocumentIcon(String documentName) {
    final lowerName = documentName.toLowerCase();
    if (lowerName.contains('учредител') || lowerName.contains('устав') || lowerName.contains('свидетельств')) {
      return PhosphorIconsLight.fileText;
    }
    if (lowerName.contains('финанс') || lowerName.contains('баланс') || lowerName.contains('отчёт') || lowerName.contains('отчет')) {
      return PhosphorIconsLight.chartBar;
    }
    if (lowerName.contains('бизнес') || lowerName.contains('план')) {
      return PhosphorIconsLight.presentation;
    }
    if (lowerName.contains('паспорт') || lowerName.contains('удостоверен') || lowerName.contains('иин')) {
      return PhosphorIconsLight.identificationCard;
    }
    if (lowerName.contains('договор') || lowerName.contains('контракт')) {
      return PhosphorIconsLight.handshake;
    }
    if (lowerName.contains('лицензи') || lowerName.contains('разреш') || lowerName.contains('сертификат')) {
      return PhosphorIconsLight.certificate;
    }
    if (lowerName.contains('справк')) {
      return PhosphorIconsLight.note;
    }
    if (lowerName.contains('налог')) {
      return PhosphorIconsLight.receipt;
    }
    return PhosphorIconsLight.file;
  }

  /// Построить секцию документов
  Widget _buildDocumentsSection(Program? program) {
    final requiredDocuments = _getRequiredDocuments(program);
    final uploadedCount = _uploadedDocuments.values.where((d) => d.isUploaded).length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              'Необходимые документы',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppTheme.neutral900,
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: uploadedCount == requiredDocuments.length
                    ? AppTheme.success50
                    : AppTheme.neutral100,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '$uploadedCount/${requiredDocuments.length}',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: uploadedCount == requiredDocuments.length
                      ? AppTheme.success600
                      : AppTheme.neutral600,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        ...requiredDocuments.map((docName) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: _buildDocumentUploadCard(docName),
        )),
      ],
    );
  }

  /// Построить карточку загрузки документа
  Widget _buildDocumentUploadCard(String documentName) {
    final uploadedDoc = _uploadedDocuments[documentName];
    final isUploaded = uploadedDoc?.isUploaded ?? false;
    final isUploading = uploadedDoc?.isUploading ?? false;
    final hasError = uploadedDoc?.error != null;
    final icon = _getDocumentIcon(documentName);

    return GestureDetector(
      onTap: isUploading ? null : () => _pickDocument(documentName),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: hasError
                ? AppTheme.error
                : isUploaded
                    ? AppTheme.success500
                    : AppTheme.neutral200,
            width: isUploaded || hasError ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            // Icon
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: isUploaded
                    ? AppTheme.success50
                    : hasError
                        ? AppTheme.error.withValues(alpha: 0.1)
                        : AppTheme.neutral50,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Center(
                child: isUploading
                    ? SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppTheme.primary,
                        ),
                      )
                    : PhosphorIcon(
                        isUploaded ? PhosphorIconsFill.checkCircle : icon,
                        size: 22,
                        color: isUploaded
                            ? AppTheme.success600
                            : hasError
                                ? AppTheme.error
                                : AppTheme.neutral500,
                      ),
              ),
            ),
            const SizedBox(width: 14),
            // Title and status
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    documentName,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: AppTheme.neutral900,
                    ),
                  ),
                  const SizedBox(height: 2),
                  if (isUploaded && uploadedDoc != null)
                    Text(
                      '${uploadedDoc.name} • ${Formatters.fileSize(uploadedDoc.size)}',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppTheme.success600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    )
                  else if (hasError)
                    Text(
                      uploadedDoc!.error!,
                      style: TextStyle(
                        fontSize: 12,
                        color: AppTheme.error,
                      ),
                    )
                  else
                    Text(
                      'PDF, DOC, до 10 МБ',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppTheme.neutral500,
                      ),
                    ),
                ],
              ),
            ),
            // Action button
            if (isUploaded)
              GestureDetector(
                onTap: () => _removeDocument(documentName),
                child: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: AppTheme.error.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Center(
                    child: PhosphorIcon(
                      PhosphorIconsLight.trash,
                      size: 18,
                      color: AppTheme.error,
                    ),
                  ),
                ),
              )
            else if (!isUploading)
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppTheme.primary50,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                  child: PhosphorIcon(
                    PhosphorIconsLight.uploadSimple,
                    size: 18,
                    color: AppTheme.primary,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  /// Выбрать и загрузить документ
  Future<void> _pickDocument(String documentName) async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
        allowMultiple: false,
      );

      if (result == null || result.files.isEmpty) return;

      final file = result.files.first;

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setState(() {
          _uploadedDocuments[documentName] = UploadedDocument(
            name: file.name,
            error: 'Файл превышает 10 МБ',
          );
        });
        return;
      }

      // Start "uploading"
      setState(() {
        _uploadedDocuments[documentName] = UploadedDocument(
          name: file.name,
          path: file.path,
          size: file.size,
          isUploading: true,
        );
      });

      // Simulate upload delay (in real app, upload to server here)
      await Future.delayed(const Duration(milliseconds: 800));

      // Mark as uploaded
      if (mounted) {
        setState(() {
          _uploadedDocuments[documentName] = UploadedDocument(
            name: file.name,
            path: file.path,
            size: file.size,
            isUploaded: true,
          );
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _uploadedDocuments[documentName] = UploadedDocument(
            name: documentName,
            error: 'Ошибка при выборе файла',
          );
        });
      }
    }
  }

  /// Удалить загруженный документ
  void _removeDocument(String documentName) {
    setState(() {
      _uploadedDocuments.remove(documentName);
    });
  }
}

/// Форматтер для ввода суммы с разделителями тысяч
class _AmountInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    if (newValue.text.isEmpty) {
      return newValue;
    }

    // Убираем все нецифровые символы
    final digitsOnly = newValue.text.replaceAll(RegExp(r'[^\d]'), '');

    if (digitsOnly.isEmpty) {
      return const TextEditingValue(text: '');
    }

    // Форматируем с разделителями тысяч
    final number = int.parse(digitsOnly);
    final formatted = _formatWithThousandsSeparator(number);

    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }

  String _formatWithThousandsSeparator(int number) {
    final str = number.toString();
    final buffer = StringBuffer();

    for (int i = 0; i < str.length; i++) {
      if (i > 0 && (str.length - i) % 3 == 0) {
        buffer.write(' ');
      }
      buffer.write(str[i]);
    }

    return buffer.toString();
  }
}
