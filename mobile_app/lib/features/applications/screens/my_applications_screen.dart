import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../../app/theme.dart';
import '../../../core/models/application.dart';
import '../../../core/utils/constants.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../../../shared/widgets/error_widget.dart';
import '../bloc/applications_bloc.dart';

class MyApplicationsScreen extends StatefulWidget {
  const MyApplicationsScreen({super.key});

  @override
  State<MyApplicationsScreen> createState() => _MyApplicationsScreenState();
}

class _MyApplicationsScreenState extends State<MyApplicationsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    context.read<ApplicationsBloc>().add(const LoadApplications());
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  /// Вспомогательные методы для получения данных из разных состояний
  List<Application> _getApplications(ApplicationsState state) {
    if (state is ApplicationsLoaded) {
      return state.applications;
    } else if (state is ApplicationDetailLoaded) {
      return state.applications;
    }
    return [];
  }

  List<Application> _getActiveApplications(ApplicationsState state) {
    return _getApplications(state).where((app) => !app.isCompleted).toList();
  }

  List<Application> _getCompletedApplications(ApplicationsState state) {
    return _getApplications(state).where((app) => app.isCompleted).toList();
  }

  Map<String, int> _getStats(ApplicationsState state) {
    if (state is ApplicationsLoaded) {
      return state.stats;
    } else if (state is ApplicationDetailLoaded) {
      return state.stats;
    }
    return {};
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.neutral50,
      body: BlocBuilder<ApplicationsBloc, ApplicationsState>(
        builder: (context, state) {
          return NestedScrollView(
            headerSliverBuilder: (context, innerBoxIsScrolled) {
              return [
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
                          // Header
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
                                Text(
                                  'Мои заявки',
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
                          const SizedBox(height: 20),

                          // Stats row
                          if (_getStats(state).isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                              child: _buildStatsRow(_getStats(state)),
                            ),

                          // Tab bar
                          Container(
                            margin: const EdgeInsets.symmetric(horizontal: 20),
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: AppTheme.neutral100,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: TabBar(
                              controller: _tabController,
                              indicator: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(10),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.05),
                                    blurRadius: 4,
                                    offset: const Offset(0, 1),
                                  ),
                                ],
                              ),
                              indicatorSize: TabBarIndicatorSize.tab,
                              dividerColor: Colors.transparent,
                              labelColor: AppTheme.neutral900,
                              unselectedLabelColor: AppTheme.neutral500,
                              labelStyle: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                              unselectedLabelStyle: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                              ),
                              tabs: [
                                Tab(
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      const Text('Активные'),
                                      if (_getActiveApplications(state).isNotEmpty) ...[
                                        const SizedBox(width: 6),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 7,
                                            vertical: 2,
                                          ),
                                          decoration: BoxDecoration(
                                            color: AppTheme.primary,
                                            borderRadius: BorderRadius.circular(10),
                                          ),
                                          child: Text(
                                            '${_getActiveApplications(state).length}',
                                            style: const TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.w600,
                                              color: Colors.white,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                                Tab(
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      const Text('Завершённые'),
                                      if (_getCompletedApplications(state).isNotEmpty) ...[
                                        const SizedBox(width: 6),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 7,
                                            vertical: 2,
                                          ),
                                          decoration: BoxDecoration(
                                            color: AppTheme.neutral400,
                                            borderRadius: BorderRadius.circular(10),
                                          ),
                                          child: Text(
                                            '${_getCompletedApplications(state).length}',
                                            style: const TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.w600,
                                              color: Colors.white,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),
                        ],
                      ),
                    ),
                  ),
                ),
              ];
            },
            body: _buildBody(state),
          );
        },
      ),
    );
  }

  Widget _buildStatsRow(Map<String, int> stats) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          _StatChip(
            label: 'Всего',
            count: stats['total'] ?? 0,
            color: AppTheme.neutral600,
            bgColor: AppTheme.neutral100,
          ),
          const SizedBox(width: 8),
          _StatChip(
            label: 'На рассмотрении',
            count: stats['underReview'] ?? 0,
            color: AppTheme.secondary600,
            bgColor: AppTheme.secondary50,
          ),
          const SizedBox(width: 8),
          _StatChip(
            label: 'Одобрено',
            count: stats['approved'] ?? 0,
            color: AppTheme.success600,
            bgColor: AppTheme.success50,
          ),
          const SizedBox(width: 8),
          _StatChip(
            label: 'Отклонено',
            count: stats['rejected'] ?? 0,
            color: AppTheme.error500,
            bgColor: AppTheme.error50,
          ),
        ],
      ),
    );
  }

  Widget _buildBody(ApplicationsState state) {
    if (state is ApplicationsLoading) {
      return const Center(child: LoadingIndicator());
    }

    if (state is ApplicationsError) {
      return AppErrorWidget(
        message: state.message,
        onRetry: () {
          context.read<ApplicationsBloc>().add(const LoadApplications());
        },
      );
    }

    final applications = _getApplications(state);

    if (applications.isNotEmpty || state is ApplicationsLoaded || state is ApplicationDetailLoaded) {
      return TabBarView(
        controller: _tabController,
        children: [
          _buildApplicationsList(_getActiveApplications(state), isActive: true),
          _buildApplicationsList(_getCompletedApplications(state), isActive: false),
        ],
      );
    }

    return const SizedBox.shrink();
  }

  Widget _buildApplicationsList(
    List<Application> applications, {
    required bool isActive,
  }) {
    if (applications.isEmpty) {
      return EmptyState.noApplications(
        onCreate: isActive ? () => context.go('/programs') : null,
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        context.read<ApplicationsBloc>().add(const RefreshApplications());
      },
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
        itemCount: applications.length,
        itemBuilder: (context, index) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: _ApplicationCard(application: applications[index]),
          );
        },
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final String label;
  final int count;
  final Color color;
  final Color bgColor;

  const _StatChip({
    required this.label,
    required this.count,
    required this.color,
    required this.bgColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              color: color,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(width: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              '$count',
              style: const TextStyle(
                fontSize: 11,
                color: Colors.white,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ApplicationCard extends StatelessWidget {
  final Application application;

  const _ApplicationCard({required this.application});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.neutral100),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => context.push('/applications/${application.id}'),
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header row
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Icon
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: AppTheme.primary50,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Center(
                        child: PhosphorIcon(
                          PhosphorIconsLight.fileText,
                          size: 22,
                          color: AppTheme.primary,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            application.program?.name ?? 'Программа',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.neutral900,
                              height: 1.3,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            application.program?.provider ?? '',
                            style: TextStyle(
                              fontSize: 13,
                              color: AppTheme.neutral500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                // Divider
                Container(
                  margin: const EdgeInsets.symmetric(vertical: 14),
                  height: 1,
                  color: AppTheme.neutral100,
                ),

                // Info row
                Row(
                  children: [
                    // Amount
                    Flexible(
                      child: _InfoPill(
                        icon: PhosphorIconsLight.currencyCircleDollar,
                        iconColor: AppTheme.success600,
                        label: Formatters.currencyShort(application.requestedAmount),
                      ),
                    ),
                    const SizedBox(width: 8),
                    // Date
                    Flexible(
                      child: _InfoPill(
                        icon: PhosphorIconsLight.calendar,
                        iconColor: AppTheme.secondary600,
                        label: application.submittedAt != null
                            ? Formatters.relativeDate(application.submittedAt!)
                            : Formatters.relativeDate(application.updatedAt),
                      ),
                    ),
                    const SizedBox(width: 8),
                    // Status
                    Flexible(
                      child: _StatusBadge(status: application.status),
                    ),
                  ],
                ),

                // Rejection reason if exists
                if (application.rejectionReason != null) ...[
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.error50,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      children: [
                        PhosphorIcon(
                          PhosphorIconsLight.warning,
                          size: 18,
                          color: AppTheme.error500,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            application.rejectionReason!,
                            style: TextStyle(
                              fontSize: 13,
                              color: AppTheme.error600,
                              height: 1.4,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                // Continue button for drafts
                if (application.isDraft) ...[
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        context.push('/applications/draft/${application.id}');
                      },
                      icon: PhosphorIcon(
                        PhosphorIconsLight.pencilSimple,
                        size: 18,
                        color: Colors.white,
                      ),
                      label: const Text(
                        'Продолжить заполнение',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _InfoPill extends StatelessWidget {
  final PhosphorIconData icon;
  final Color iconColor;
  final String label;

  const _InfoPill({
    required this.icon,
    required this.iconColor,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppTheme.neutral50,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          PhosphorIcon(icon, size: 14, color: iconColor),
          const SizedBox(width: 5),
          Flexible(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: AppTheme.neutral600,
                fontWeight: FontWeight.w500,
              ),
              overflow: TextOverflow.ellipsis,
              maxLines: 1,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final ApplicationStatus status;

  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 10,
        vertical: 5,
      ),
      decoration: BoxDecoration(
        color: Color(status.colorValue).withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        status.label,
        overflow: TextOverflow.ellipsis,
        maxLines: 1,
        style: TextStyle(
          fontSize: 12,
          color: Color(status.colorValue),
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
