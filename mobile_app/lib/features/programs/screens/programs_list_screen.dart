import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../../app/theme.dart';
import '../../../core/models/program.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../../../shared/widgets/error_widget.dart';
import '../../../shared/widgets/empty_state.dart';
import '../bloc/programs_bloc.dart';

class ProgramsListScreen extends StatefulWidget {
  const ProgramsListScreen({super.key});

  @override
  State<ProgramsListScreen> createState() => _ProgramsListScreenState();
}

class _ProgramsListScreenState extends State<ProgramsListScreen> {
  final _scrollController = ScrollController();
  final _searchController = TextEditingController();
  bool _isSearchFocused = false;

  @override
  void initState() {
    super.initState();
    context.read<ProgramsBloc>().add(const LoadPrograms());
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      context.read<ProgramsBloc>().add(const LoadMorePrograms());
    }
  }

  void _onSearch(String query) {
    if (query.isEmpty) {
      context.read<ProgramsBloc>().add(const LoadPrograms());
    } else {
      context.read<ProgramsBloc>().add(SearchPrograms(query: query));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.neutral50,
      body: CustomScrollView(
        controller: _scrollController,
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
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Top bar
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Программы',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.neutral900,
                              letterSpacing: -0.5,
                            ),
                          ),
                          BlocBuilder<ProgramsBloc, ProgramsState>(
                            builder: (context, state) {
                              // Check if filter is active
                              bool hasActiveFilter = false;
                              if (state is ProgramsLoaded && state.filter != null) {
                                hasActiveFilter = state.filter!.hasFilters;
                              } else if (state is ProgramsLoadingMore && state.filter != null) {
                                hasActiveFilter = state.filter!.hasFilters;
                              }

                              return Stack(
                                clipBehavior: Clip.none,
                                children: [
                                  Container(
                                    width: 42,
                                    height: 42,
                                    decoration: BoxDecoration(
                                      color: hasActiveFilter
                                          ? AppTheme.primary50
                                          : AppTheme.neutral50,
                                      borderRadius: BorderRadius.circular(12),
                                      border: hasActiveFilter
                                          ? Border.all(color: AppTheme.primary, width: 1.5)
                                          : null,
                                    ),
                                    child: IconButton(
                                      padding: EdgeInsets.zero,
                                      icon: PhosphorIcon(
                                        hasActiveFilter
                                            ? PhosphorIconsFill.funnelSimple
                                            : PhosphorIconsLight.funnelSimple,
                                        size: 22,
                                        color: hasActiveFilter
                                            ? AppTheme.primary
                                            : AppTheme.neutral600,
                                      ),
                                      onPressed: _showFilterDialog,
                                    ),
                                  ),
                                  // Active filter indicator dot
                                  if (hasActiveFilter)
                                    Positioned(
                                      right: -2,
                                      top: -2,
                                      child: Container(
                                        width: 12,
                                        height: 12,
                                        decoration: BoxDecoration(
                                          color: AppTheme.primary,
                                          shape: BoxShape.circle,
                                          border: Border.all(
                                            color: Colors.white,
                                            width: 2,
                                          ),
                                        ),
                                      ),
                                    ),
                                ],
                              );
                            },
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // Search bar
                      Focus(
                        onFocusChange: (focused) {
                          setState(() => _isSearchFocused = focused);
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          decoration: BoxDecoration(
                            color: AppTheme.neutral50,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: _isSearchFocused
                                  ? AppTheme.primary
                                  : Colors.transparent,
                              width: 2,
                            ),
                          ),
                          child: TextField(
                            controller: _searchController,
                            decoration: InputDecoration(
                              hintText: 'Поиск программ...',
                              hintStyle: TextStyle(
                                color: AppTheme.neutral400,
                                fontSize: 15,
                              ),
                              prefixIcon: Padding(
                                padding: const EdgeInsets.only(left: 14, right: 10),
                                child: PhosphorIcon(
                                  PhosphorIconsLight.magnifyingGlass,
                                  size: 20,
                                  color: _isSearchFocused
                                      ? AppTheme.primary
                                      : AppTheme.neutral400,
                                ),
                              ),
                              prefixIconConstraints:
                                  const BoxConstraints(minWidth: 0, minHeight: 0),
                              suffixIcon: _searchController.text.isNotEmpty
                                  ? GestureDetector(
                                      onTap: () {
                                        _searchController.clear();
                                        _onSearch('');
                                        setState(() {});
                                      },
                                      child: Padding(
                                        padding: const EdgeInsets.only(right: 12),
                                        child: Container(
                                          width: 20,
                                          height: 20,
                                          decoration: BoxDecoration(
                                            color: AppTheme.neutral300,
                                            shape: BoxShape.circle,
                                          ),
                                          child: Center(
                                            child: PhosphorIcon(
                                              PhosphorIconsBold.x,
                                              size: 12,
                                              color: Colors.white,
                                            ),
                                          ),
                                        ),
                                      ),
                                    )
                                  : null,
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 0,
                                vertical: 14,
                              ),
                            ),
                            style: TextStyle(
                              fontSize: 15,
                              color: AppTheme.neutral900,
                            ),
                            onChanged: (value) {
                              _onSearch(value);
                              setState(() {});
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Stats row
          SliverToBoxAdapter(
            child: BlocBuilder<ProgramsBloc, ProgramsState>(
              buildWhen: (previous, current) {
                return current is ProgramsLoading ||
                    current is ProgramsLoaded ||
                    current is ProgramsLoadingMore ||
                    current is ProgramsError;
              },
              builder: (context, state) {
                int count = 0;
                if (state is ProgramsLoaded) {
                  count = state.programs.length;
                } else if (state is ProgramsLoadingMore) {
                  count = state.programs.length;
                }

                return Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.primary50,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          children: [
                            PhosphorIcon(
                              PhosphorIconsLight.listMagnifyingGlass,
                              size: 16,
                              color: AppTheme.primary,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'Найдено: $count',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                color: AppTheme.primary700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),

          // Programs list
          BlocBuilder<ProgramsBloc, ProgramsState>(
            buildWhen: (previous, current) {
              return current is ProgramsLoading ||
                  current is ProgramsLoaded ||
                  current is ProgramsLoadingMore ||
                  current is ProgramsError;
            },
            builder: (context, state) {
              if (state is ProgramsLoading) {
                return const SliverFillRemaining(
                  child: Center(child: LoadingIndicator()),
                );
              }

              if (state is ProgramsError) {
                return SliverFillRemaining(
                  child: AppErrorWidget(
                    message: state.message,
                    onRetry: () {
                      context.read<ProgramsBloc>().add(const LoadPrograms());
                    },
                  ),
                );
              }

              if (state is ProgramsLoaded || state is ProgramsLoadingMore) {
                final programs = state is ProgramsLoaded
                    ? state.programs
                    : (state as ProgramsLoadingMore).programs;

                if (programs.isEmpty) {
                  return SliverFillRemaining(
                    child: EmptyState.noPrograms(
                      onExplore: () {
                        _searchController.clear();
                        context.read<ProgramsBloc>().add(const ClearFilter());
                      },
                    ),
                  );
                }

                return SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        if (index >= programs.length) {
                          return const Padding(
                            padding: EdgeInsets.all(16),
                            child: Center(child: LoadingIndicator()),
                          );
                        }
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 14),
                          child: _ProgramCard(program: programs[index]),
                        );
                      },
                      childCount:
                          programs.length + (state is ProgramsLoadingMore ? 1 : 0),
                    ),
                  ),
                );
              }

              // For any other state (RecommendationsLoaded, etc), trigger programs load
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (context.mounted) {
                  context.read<ProgramsBloc>().add(const LoadPrograms());
                }
              });

              return const SliverFillRemaining(
                child: Center(child: LoadingIndicator()),
              );
            },
          ),
        ],
      ),
    );
  }

  void _showFilterDialog() {
    // Get current filter from BLoC state
    ProgramFilter? currentFilter;
    final state = context.read<ProgramsBloc>().state;
    if (state is ProgramsLoaded) {
      currentFilter = state.filter;
    } else if (state is ProgramsLoadingMore) {
      currentFilter = state.filter;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _FilterBottomSheet(currentFilter: currentFilter),
    );
  }
}

class _ProgramCard extends StatelessWidget {
  final Program program;

  const _ProgramCard({required this.program});

  Color _getTypeColor() {
    switch (program.type) {
      case ProgramType.grant:
        return AppTheme.success600;
      case ProgramType.subsidy:
        return AppTheme.primary;
      case ProgramType.loan:
        return AppTheme.secondary600;
      case ProgramType.guarantee:
        return AppTheme.error500;
      case ProgramType.consulting:
        return AppTheme.neutral600;
      case ProgramType.training:
        return AppTheme.primary700;
    }
  }

  Color _getTypeBgColor() {
    switch (program.type) {
      case ProgramType.grant:
        return AppTheme.success50;
      case ProgramType.subsidy:
        return AppTheme.primary50;
      case ProgramType.loan:
        return AppTheme.secondary50;
      case ProgramType.guarantee:
        return AppTheme.error50;
      case ProgramType.consulting:
        return AppTheme.neutral100;
      case ProgramType.training:
        return AppTheme.primary100;
    }
  }

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
          onTap: () => context.push('/programs/${program.id}'),
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header row with emoji and title
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: _getTypeBgColor(),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Center(
                        child: Text(
                          program.type.emoji,
                          style: const TextStyle(fontSize: 22),
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            program.name,
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
                            program.provider,
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
                    _InfoPill(
                      icon: PhosphorIconsLight.currencyCircleDollar,
                      iconColor: AppTheme.success600,
                      label: Formatters.currencyRange(
                        program.minAmount,
                        program.maxAmount,
                      ),
                    ),
                    const SizedBox(width: 10),
                    if (program.deadline != null)
                      _InfoPill(
                        icon: PhosphorIconsLight.calendar,
                        iconColor: AppTheme.secondary600,
                        label: Formatters.daysRemaining(program.deadline!),
                      ),
                  ],
                ),
                const SizedBox(height: 12),

                // Tags row
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: Color(program.status.colorValue).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        program.status.label,
                        style: TextStyle(
                          fontSize: 12,
                          color: Color(program.status.colorValue),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: _getTypeBgColor(),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        program.type.label,
                        style: TextStyle(
                          fontSize: 12,
                          color: _getTypeColor(),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                    const Spacer(),
                    PhosphorIcon(
                      PhosphorIconsLight.arrowRight,
                      size: 18,
                      color: AppTheme.neutral400,
                    ),
                  ],
                ),
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
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: AppTheme.neutral600,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterBottomSheet extends StatefulWidget {
  final ProgramFilter? currentFilter;

  const _FilterBottomSheet({this.currentFilter});

  @override
  State<_FilterBottomSheet> createState() => _FilterBottomSheetState();
}

class _FilterBottomSheetState extends State<_FilterBottomSheet> {
  late Set<ProgramType> _selectedTypes;
  late Set<ProgramStatus> _selectedStatuses;

  @override
  void initState() {
    super.initState();
    // Initialize from current filter
    _selectedTypes = Set<ProgramType>.from(widget.currentFilter?.types ?? []);
    _selectedStatuses = Set<ProgramStatus>.from(widget.currentFilter?.statuses ?? []);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(24),
        ),
      ),
      child: DraggableScrollableSheet(
        initialChildSize: 0.6,
        minChildSize: 0.3,
        maxChildSize: 0.9,
        expand: false,
        builder: (context, scrollController) {
          return Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Handle
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppTheme.neutral200,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Фильтры',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.neutral900,
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        setState(() {
                          _selectedTypes.clear();
                          _selectedStatuses.clear();
                        });
                      },
                      style: TextButton.styleFrom(
                        foregroundColor: AppTheme.error,
                      ),
                      child: const Text(
                        'Сбросить',
                        style: TextStyle(fontWeight: FontWeight.w500),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                Expanded(
                  child: ListView(
                    controller: scrollController,
                    children: [
                      // Program type section
                      Text(
                        'Тип программы',
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
                        children: ProgramType.values.map((type) {
                          final isSelected = _selectedTypes.contains(type);
                          return GestureDetector(
                            onTap: () {
                              setState(() {
                                if (isSelected) {
                                  _selectedTypes.remove(type);
                                } else {
                                  _selectedTypes.add(type);
                                }
                              });
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 10,
                              ),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? AppTheme.primary50
                                    : AppTheme.neutral50,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: isSelected
                                      ? AppTheme.primary
                                      : Colors.transparent,
                                  width: 1.5,
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    type.emoji,
                                    style: const TextStyle(fontSize: 16),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    type.label,
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500,
                                      color: isSelected
                                          ? AppTheme.primary700
                                          : AppTheme.neutral700,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        }).toList(),
                      ),

                      const SizedBox(height: 28),

                      // Status section
                      Text(
                        'Статус',
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
                        children: ProgramStatus.values.map((status) {
                          final isSelected = _selectedStatuses.contains(status);
                          return GestureDetector(
                            onTap: () {
                              setState(() {
                                if (isSelected) {
                                  _selectedStatuses.remove(status);
                                } else {
                                  _selectedStatuses.add(status);
                                }
                              });
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 10,
                              ),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? Color(status.colorValue).withValues(alpha: 0.1)
                                    : AppTheme.neutral50,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: isSelected
                                      ? Color(status.colorValue)
                                      : Colors.transparent,
                                  width: 1.5,
                                ),
                              ),
                              child: Text(
                                status.label,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                  color: isSelected
                                      ? Color(status.colorValue)
                                      : AppTheme.neutral700,
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Apply button
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: () {
                      final filter = ProgramFilter(
                        types: _selectedTypes.isNotEmpty
                            ? _selectedTypes.toList()
                            : null,
                        statuses: _selectedStatuses.isNotEmpty
                            ? _selectedStatuses.toList()
                            : null,
                      );
                      context.read<ProgramsBloc>().add(UpdateFilter(filter: filter));
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: const Text(
                      'Применить фильтр',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
