import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/models/user.dart' show User;
import '../../../core/services/auth_service.dart';

// Events
abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class AuthLoginRequested extends AuthEvent {
  final String email;
  final String password;

  const AuthLoginRequested({
    required this.email,
    required this.password,
  });

  @override
  List<Object?> get props => [email, password];
}

class AuthRegisterRequested extends AuthEvent {
  final String email;
  final String password;
  final String fullName;

  const AuthRegisterRequested({
    required this.email,
    required this.password,
    required this.fullName,
  });

  @override
  List<Object?> get props => [email, password, fullName];
}

class AuthLogoutRequested extends AuthEvent {
  const AuthLogoutRequested();
}

class AuthCheckRequested extends AuthEvent {
  const AuthCheckRequested();
}

class AuthForgotPasswordRequested extends AuthEvent {
  final String email;

  const AuthForgotPasswordRequested({required this.email});

  @override
  List<Object?> get props => [email];
}

class AuthUpdateProfileRequested extends AuthEvent {
  // Required fields
  final String businessType;
  final String businessSize;
  final String industry;
  final String region;
  final int experienceYears;
  // Optional fields
  final double? annualRevenue;
  final int? employeeCount;
  final String? bin;
  final String? okedCode;
  final double? desiredLoanAmount;
  final List<String>? businessGoals;
  final String? businessGoalsComments;
  // User info fields (stored in users table)
  final String? companyName;
  final String? phone;

  const AuthUpdateProfileRequested({
    required this.businessType,
    required this.businessSize,
    required this.industry,
    required this.region,
    required this.experienceYears,
    this.annualRevenue,
    this.employeeCount,
    this.bin,
    this.okedCode,
    this.desiredLoanAmount,
    this.businessGoals,
    this.businessGoalsComments,
    this.companyName,
    this.phone,
  });

  @override
  List<Object?> get props => [
        businessType,
        businessSize,
        industry,
        region,
        experienceYears,
        annualRevenue,
        employeeCount,
        bin,
        okedCode,
        desiredLoanAmount,
        businessGoals,
        businessGoalsComments,
        companyName,
        phone,
      ];
}

// States
abstract class AuthState extends Equatable {
  const AuthState();

  @override
  List<Object?> get props => [];
}

class AuthInitial extends AuthState {
  const AuthInitial();
}

class AuthLoading extends AuthState {
  const AuthLoading();
}

class AuthAuthenticated extends AuthState {
  final User user;

  const AuthAuthenticated({required this.user});

  @override
  List<Object?> get props => [user];
}

class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated();
}

class AuthError extends AuthState {
  final String message;

  const AuthError({required this.message});

  @override
  List<Object?> get props => [message];
}

class AuthForgotPasswordSuccess extends AuthState {
  final String email;

  const AuthForgotPasswordSuccess({required this.email});

  @override
  List<Object?> get props => [email];
}

class AuthProfileUpdating extends AuthState {
  const AuthProfileUpdating();
}

class AuthProfileUpdateSuccess extends AuthState {
  final User user;

  const AuthProfileUpdateSuccess({required this.user});

  @override
  List<Object?> get props => [user];
}

// Bloc
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthService _authService;

  AuthBloc({required AuthService authService})
      : _authService = authService,
        super(const AuthInitial()) {
    on<AuthCheckRequested>(_onAuthCheck);
    on<AuthLoginRequested>(_onLogin);
    on<AuthRegisterRequested>(_onRegister);
    on<AuthLogoutRequested>(_onLogout);
    on<AuthForgotPasswordRequested>(_onForgotPassword);
    on<AuthUpdateProfileRequested>(_onUpdateProfile);
  }

  Future<void> _onAuthCheck(
    AuthCheckRequested event,
    Emitter<AuthState> emit,
  ) async {
    // First, try to get cached user for immediate display
    final cachedUser = _authService.getCachedUser();
    if (cachedUser != null) {
      emit(AuthAuthenticated(user: cachedUser));
    } else {
      emit(const AuthLoading());
    }

    try {
      final isLoggedIn = await _authService.isLoggedIn();
      if (isLoggedIn) {
        // Try to refresh user from server, but don't fail if offline
        try {
          final user = await _authService.getCurrentUser();
          emit(AuthAuthenticated(user: user));
        } catch (_) {
          // If server request fails but we have cached user, keep using it
          if (cachedUser != null) {
            emit(AuthAuthenticated(user: cachedUser));
          } else {
            emit(const AuthUnauthenticated());
          }
        }
      } else {
        emit(const AuthUnauthenticated());
      }
    } on ApiException catch (e) {
      // If we have cached user, keep them authenticated
      if (cachedUser != null && !e.isAuthError) {
        emit(AuthAuthenticated(user: cachedUser));
      } else {
        emit(const AuthUnauthenticated());
      }
    }
  }

  Future<void> _onLogin(
    AuthLoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());

    try {
      final user = await _authService.login(
        email: event.email,
        password: event.password,
      );
      emit(AuthAuthenticated(user: user));
    } on ApiException catch (e) {
      emit(AuthError(message: e.message));
      emit(const AuthUnauthenticated());
    }
  }

  Future<void> _onRegister(
    AuthRegisterRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());

    try {
      final user = await _authService.register(
        email: event.email,
        password: event.password,
        fullName: event.fullName,
      );
      emit(AuthAuthenticated(user: user));
    } on ApiException catch (e) {
      emit(AuthError(message: e.message));
      emit(const AuthUnauthenticated());
    }
  }

  Future<void> _onLogout(
    AuthLogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    await _authService.logout();
    emit(const AuthUnauthenticated());
  }

  Future<void> _onForgotPassword(
    AuthForgotPasswordRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());

    try {
      await _authService.forgotPassword(event.email);
      emit(AuthForgotPasswordSuccess(email: event.email));
    } on ApiException catch (e) {
      emit(AuthError(message: e.message));
    }
  }

  Future<void> _onUpdateProfile(
    AuthUpdateProfileRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthProfileUpdating());

    try {
      final user = await _authService.updateProfile(
        businessType: event.businessType,
        businessSize: event.businessSize,
        industry: event.industry,
        region: event.region,
        experienceYears: event.experienceYears,
        annualRevenue: event.annualRevenue,
        employeeCount: event.employeeCount,
        bin: event.bin,
        okedCode: event.okedCode,
        desiredLoanAmount: event.desiredLoanAmount,
        businessGoals: event.businessGoals,
        businessGoalsComments: event.businessGoalsComments,
        companyName: event.companyName,
        phone: event.phone,
      );
      emit(AuthProfileUpdateSuccess(user: user));
      emit(AuthAuthenticated(user: user));
    } on ApiException catch (e) {
      emit(AuthError(message: e.message));
      // Restore authenticated state if we had a user
      final cachedUser = _authService.getCachedUser();
      if (cachedUser != null) {
        emit(AuthAuthenticated(user: cachedUser));
      }
    }
  }
}
