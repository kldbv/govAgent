import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../core/api/api_client.dart';
import '../core/services/services.dart';
import '../features/auth/bloc/auth_bloc.dart';
import '../features/programs/bloc/programs_bloc.dart';
import '../features/applications/bloc/applications_bloc.dart';
import '../features/notifications/bloc/notifications_bloc.dart';
import 'routes.dart';
import 'theme.dart';

class GovAgentApp extends StatefulWidget {
  final StorageService storageService;
  final CacheService? cacheService;

  const GovAgentApp({
    super.key,
    required this.storageService,
    this.cacheService,
  });

  @override
  State<GovAgentApp> createState() => _GovAgentAppState();
}

class _GovAgentAppState extends State<GovAgentApp> {
  late final ApiClient _apiClient;
  late final AuthService _authService;
  late final ProgramService _programService;
  late final ApplicationService _applicationService;
  late final NotificationService _notificationService;
  late final AppRouter _appRouter;

  @override
  void initState() {
    super.initState();

    _apiClient = ApiClient(
      storageService: widget.storageService,
      onUnauthorized: _onUnauthorized,
    );

    _authService = AuthService(
      apiClient: _apiClient,
      storageService: widget.storageService,
    );

    _programService = ProgramService(
      apiClient: _apiClient,
      cacheService: widget.cacheService,
    );

    _applicationService = ApplicationService(
      apiClient: _apiClient,
    );

    _notificationService = NotificationService(
      apiClient: _apiClient,
    );

    _appRouter = AppRouter();
  }

  void _onUnauthorized() {
    // Navigate to login on unauthorized
    _appRouter.router.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    return MultiRepositoryProvider(
      providers: [
        RepositoryProvider<ProgramService>.value(value: _programService),
      ],
      child: MultiBlocProvider(
        providers: [
          BlocProvider<AuthBloc>(
            create: (_) => AuthBloc(authService: _authService)
              ..add(const AuthCheckRequested()),
          ),
          BlocProvider<ProgramsBloc>(
            create: (_) => ProgramsBloc(programService: _programService),
          ),
          BlocProvider<ApplicationsBloc>(
            create: (_) => ApplicationsBloc(applicationService: _applicationService),
          ),
          BlocProvider<NotificationsBloc>(
            create: (_) => NotificationsBloc(notificationService: _notificationService),
          ),
        ],
        child: MaterialApp.router(
          title: 'GovAgent',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: ThemeMode.light,
          routerConfig: _appRouter.router,
        ),
      ),
    );
  }
}
