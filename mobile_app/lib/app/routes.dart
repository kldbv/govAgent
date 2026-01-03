import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../core/utils/constants.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/auth/screens/register_screen.dart';
import '../features/auth/screens/forgot_password_screen.dart';
import '../features/home/screens/home_screen.dart';
import '../features/programs/screens/programs_list_screen.dart';
import '../features/programs/screens/program_detail_screen.dart';
import '../features/calculator/screens/calculator_screen.dart';
import '../features/applications/screens/my_applications_screen.dart';
import '../features/applications/screens/application_detail_screen.dart';
import '../features/applications/screens/application_form_screen.dart';
import '../features/notifications/screens/notifications_screen.dart';
import '../features/profile/screens/profile_screen.dart';
import '../features/profile/screens/edit_profile_screen.dart';
import '../features/profile/screens/settings_screen.dart';
import '../features/onboarding/screens/complete_profile_screen.dart';
import '../features/splash_screen.dart';
import '../shared/widgets/main_scaffold.dart';

class AppRouter {
  AppRouter();

  // Navigator keys for different branches
  final GlobalKey<NavigatorState> _rootNavigatorKey =
      GlobalKey<NavigatorState>(debugLabel: 'root');
  final GlobalKey<NavigatorState> _homeNavigatorKey =
      GlobalKey<NavigatorState>(debugLabel: 'home');
  final GlobalKey<NavigatorState> _programsNavigatorKey =
      GlobalKey<NavigatorState>(debugLabel: 'programs');
  final GlobalKey<NavigatorState> _calculatorNavigatorKey =
      GlobalKey<NavigatorState>(debugLabel: 'calculator');
  final GlobalKey<NavigatorState> _profileNavigatorKey =
      GlobalKey<NavigatorState>(debugLabel: 'profile');

  late final GoRouter router = GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: AppRoutes.splash,
    debugLogDiagnostics: true,
    routes: [
      // Splash
      GoRoute(
        path: AppRoutes.splash,
        builder: (context, state) => const SplashScreen(),
      ),

      // Auth routes
      GoRoute(
        path: AppRoutes.login,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: AppRoutes.register,
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: AppRoutes.forgotPassword,
        builder: (context, state) => const ForgotPasswordScreen(),
      ),

      // Profile completion (onboarding for new users)
      GoRoute(
        path: AppRoutes.completeProfile,
        builder: (context, state) => const CompleteProfileScreen(),
      ),

      // Main app with bottom navigation using StatefulShellRoute
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) => MainScaffoldStateful(
          navigationShell: navigationShell,
        ),
        branches: [
          // Home branch
          StatefulShellBranch(
            navigatorKey: _homeNavigatorKey,
            routes: [
              GoRoute(
                path: AppRoutes.home,
                builder: (context, state) => const HomeScreen(),
              ),
            ],
          ),
          // Programs branch
          StatefulShellBranch(
            navigatorKey: _programsNavigatorKey,
            routes: [
              GoRoute(
                path: AppRoutes.programs,
                builder: (context, state) => const ProgramsListScreen(),
              ),
            ],
          ),
          // Calculator branch
          StatefulShellBranch(
            navigatorKey: _calculatorNavigatorKey,
            routes: [
              GoRoute(
                path: AppRoutes.calculator,
                builder: (context, state) => const CalculatorScreen(),
              ),
            ],
          ),
          // Profile branch
          StatefulShellBranch(
            navigatorKey: _profileNavigatorKey,
            routes: [
              GoRoute(
                path: AppRoutes.profile,
                builder: (context, state) => const ProfileScreen(),
              ),
            ],
          ),
        ],
      ),

      // Program detail - outside shell, shows on top of everything
      GoRoute(
        path: AppRoutes.programDetail,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return ProgramDetailScreen(programId: id);
        },
      ),

      // Applications
      GoRoute(
        path: AppRoutes.applications,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const MyApplicationsScreen(),
      ),
      GoRoute(
        path: AppRoutes.applicationDetail,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return ApplicationDetailScreen(applicationId: id);
        },
      ),
      GoRoute(
        path: AppRoutes.applicationForm,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final programId = state.pathParameters['programId']!;
          return ApplicationFormScreen.newApplication(programId: programId);
        },
      ),
      GoRoute(
        path: AppRoutes.applicationDraft,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final draftId = state.pathParameters['draftId']!;
          return ApplicationFormScreen.fromDraft(draftId: draftId);
        },
      ),

      // Profile
      GoRoute(
        path: AppRoutes.editProfile,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const EditProfileScreen(),
      ),

      // Notifications
      GoRoute(
        path: AppRoutes.notifications,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const NotificationsScreen(),
      ),

      // Settings
      GoRoute(
        path: AppRoutes.settings,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const SettingsScreen(),
      ),
    ],
    // No redirect - navigation is handled by BlocListeners in screens
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red,
            ),
            const SizedBox(height: 16),
            Text(
              'Страница не найдена',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              state.uri.path,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go(AppRoutes.home),
              child: const Text('На главную'),
            ),
          ],
        ),
      ),
    ),
  );
}
