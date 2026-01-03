import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../../app/theme.dart';
import '../../../core/utils/validators.dart';
import '../../../shared/widgets/custom_button.dart';
import '../bloc/auth_bloc.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _emailSent = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  void _onSubmit() {
    if (_formKey.currentState?.validate() ?? false) {
      context.read<AuthBloc>().add(
            AuthForgotPasswordRequested(
              email: _emailController.text.trim(),
            ),
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthForgotPasswordSuccess) {
          setState(() {
            _emailSent = true;
          });
        } else if (state is AuthError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
              backgroundColor: AppTheme.errorColor,
            ),
          );
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Восстановление пароля'),
        ),
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppTheme.spacingLg),
            child: _emailSent ? _buildSuccessContent() : _buildFormContent(),
          ),
        ),
      ),
    );
  }

  Widget _buildFormContent() {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: AppTheme.spacingLg),
          PhosphorIcon(
            PhosphorIconsLight.lockKeyOpen,
            size: 80,
            color: AppTheme.primary.withValues(alpha: 0.7),
          ),
          const SizedBox(height: AppTheme.spacingLg),
          Text(
            'Забыли пароль?',
            style: Theme.of(context).textTheme.headlineSmall,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppTheme.spacingSm),
          Text(
            'Введите email, указанный при регистрации. Мы отправим вам инструкции по восстановлению пароля.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppTheme.textSecondaryLight,
                ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppTheme.spacingXl),

          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.done,
            validator: Validators.email,
            onFieldSubmitted: (_) => _onSubmit(),
            decoration: InputDecoration(
              labelText: 'Email',
              hintText: 'example@mail.com',
              prefixIcon: Padding(
                padding: const EdgeInsets.only(left: 16, right: 12),
                child: PhosphorIcon(
                  PhosphorIconsLight.envelope,
                  size: 20,
                  color: AppTheme.neutral400,
                ),
              ),
              prefixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
            ),
          ),
          const SizedBox(height: AppTheme.spacingLg),

          BlocBuilder<AuthBloc, AuthState>(
            builder: (context, state) {
              return CustomButton(
                text: 'Отправить',
                onPressed: state is AuthLoading ? null : _onSubmit,
                isLoading: state is AuthLoading,
                isFullWidth: true,
              );
            },
          ),
          const SizedBox(height: AppTheme.spacingMd),

          TextButton(
            onPressed: () => context.pop(),
            child: const Text('Вернуться к входу'),
          ),
        ],
      ),
    );
  }

  Widget _buildSuccessContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: AppTheme.spacingXl),
        PhosphorIcon(
          PhosphorIconsLight.envelopeOpen,
          size: 80,
          color: AppTheme.success.withValues(alpha: 0.7),
        ),
        const SizedBox(height: AppTheme.spacingLg),
        Text(
          'Письмо отправлено!',
          style: Theme.of(context).textTheme.headlineSmall,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppTheme.spacingSm),
        Text(
          'Мы отправили инструкции по восстановлению пароля на адрес:',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppTheme.textSecondaryLight,
              ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppTheme.spacingSm),
        Text(
          _emailController.text,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: AppTheme.primaryColor,
              ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppTheme.spacingXl),
        CustomButton(
          text: 'Вернуться к входу',
          onPressed: () => context.pop(),
          isFullWidth: true,
        ),
        const SizedBox(height: AppTheme.spacingMd),
        TextButton(
          onPressed: () {
            setState(() {
              _emailSent = false;
            });
          },
          child: const Text('Отправить повторно'),
        ),
      ],
    );
  }
}
