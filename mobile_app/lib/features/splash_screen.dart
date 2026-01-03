import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../app/theme.dart';
import '../core/utils/constants.dart';
import 'auth/bloc/auth_bloc.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;
  StreamSubscription<AuthState>? _authSubscription;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.5, curve: Curves.easeIn),
      ),
    );

    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.5, curve: Curves.easeOut),
      ),
    );

    _controller.forward();
    _listenToAuthState();
  }

  void _listenToAuthState() {
    final authBloc = context.read<AuthBloc>();

    // Listen for auth state changes
    _authSubscription = authBloc.stream.listen((state) {
      if (!mounted) return;

      if (state is AuthAuthenticated) {
        // User is logged in, check profile
        if (state.user.isProfileComplete) {
          context.go(AppRoutes.home);
        } else {
          context.go(AppRoutes.completeProfile);
        }
      } else if (state is AuthUnauthenticated) {
        // User is not logged in
        context.go(AppRoutes.login);
      }
      // If AuthLoading or AuthInitial, wait...
    });

    // Also check current state (in case it's already loaded)
    final currentState = authBloc.state;
    if (currentState is AuthAuthenticated) {
      Future.delayed(const Duration(milliseconds: 1500), () {
        if (!mounted) return;
        if (currentState.user.isProfileComplete) {
          context.go(AppRoutes.home);
        } else {
          context.go(AppRoutes.completeProfile);
        }
      });
    } else if (currentState is AuthUnauthenticated) {
      Future.delayed(const Duration(milliseconds: 1500), () {
        if (!mounted) return;
        context.go(AppRoutes.login);
      });
    }
  }

  @override
  void dispose() {
    _authSubscription?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.primaryColor,
      body: Center(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: ScaleTransition(
            scale: _scaleAnimation,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.business_center,
                      size: 56,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'GovAgent',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Поддержка бизнеса',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 48),
                const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white70),
                    strokeWidth: 2,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
