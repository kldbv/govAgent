import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:share_plus/share_plus.dart';
import '../../../app/theme.dart';
import '../../../core/models/program.dart';
import '../../../core/services/program_service.dart';
import '../../../core/utils/constants.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../../../shared/widgets/error_widget.dart';
import '../../../shared/widgets/subsidy_calculator_widget.dart';

class ProgramDetailScreen extends StatefulWidget {
  final String programId;

  const ProgramDetailScreen({super.key, required this.programId});

  @override
  State<ProgramDetailScreen> createState() => _ProgramDetailScreenState();
}

class _ProgramDetailScreenState extends State<ProgramDetailScreen> {
  Program? _program;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadProgram();
  }

  Future<void> _loadProgram() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final programService = context.read<ProgramService>();
      final program = await programService.getProgram(widget.programId);
      if (mounted) {
        setState(() {
          _program = program;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: AppTheme.neutral50,
        body: const Center(child: LoadingIndicator()),
      );
    }

    if (_error != null) {
      return Scaffold(
        backgroundColor: AppTheme.neutral50,
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
        ),
        body: AppErrorWidget(
          message: _error!,
          onRetry: _loadProgram,
        ),
      );
    }

    if (_program != null) {
      return Scaffold(
        backgroundColor: AppTheme.neutral50,
        body: _ProgramDetailContent(program: _program!),
      );
    }

    return const SizedBox.shrink();
  }
}

class _ProgramDetailContent extends StatelessWidget {
  final Program program;

  const _ProgramDetailContent({required this.program});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        CustomScrollView(
          slivers: [
            // Header with gradient
            SliverToBoxAdapter(
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppTheme.primary,
                      AppTheme.primary700,
                    ],
                  ),
                  borderRadius: const BorderRadius.vertical(
                    bottom: Radius.circular(28),
                  ),
                ),
                child: SafeArea(
                  bottom: false,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Top bar
                      Padding(
                        padding: const EdgeInsets.fromLTRB(8, 8, 8, 0),
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
                                color: Colors.white,
                              ),
                            ),
                            const Spacer(),
                            IconButton(
                              onPressed: () {
                                Share.share(
                                  'Программа поддержки: ${program.name}\n${program.applicationUrl ?? ""}',
                                );
                              },
                              icon: PhosphorIcon(
                                PhosphorIconsLight.shareFat,
                                size: 22,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Content
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Type badge
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 6,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.2),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        program.type.emoji,
                                        style: const TextStyle(fontSize: 14),
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        program.type.label,
                                        style: const TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w500,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 6,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Color(program.status.colorValue),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    program.status.label,
                                    style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),

                            // Title
                            Text(
                              program.name,
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                                height: 1.3,
                              ),
                            ),
                            const SizedBox(height: 10),

                            // Provider
                            Row(
                              children: [
                                PhosphorIcon(
                                  PhosphorIconsLight.buildings,
                                  size: 16,
                                  color: Colors.white.withValues(alpha: 0.7),
                                ),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    program.provider,
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: Colors.white.withValues(alpha: 0.85),
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // Quick stats cards - separate section below header
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: _buildQuickStats(context),
              ),
            ),

            // Inline Calculator widget - show for subsidies and loans
            if (program.showCalculator || program.hasSubsidy)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: SubsidyCalculatorWidget(
                    // Program name for header
                    programName: program.name,
                    // Use program's funding limits
                    minAmount: program.minAmount > 0 ? program.minAmount : null,
                    maxAmount: program.maxAmount > 0 ? program.maxAmount : null,
                    initialAmount: program.minAmount > 0
                        ? program.minAmount
                        : (program.maxAmount > 0 ? program.maxAmount / 2 : null),
                    // Use program's term if available
                    maxTermMonths: program.termMonths,
                    // Use program's rates
                    bankRate: program.interestRate,
                    subsidyRate: program.subsidyRate,
                    isCompact: true,
                    // No expand button - calculator is already fully functional here
                  ),
                ),
              ),

            // Description section
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 4, 20, 0),
                child: _buildSection(
                  context,
                  icon: PhosphorIconsLight.textAlignLeft,
                  iconColor: AppTheme.primary,
                  iconBgColor: AppTheme.primary50,
                  title: 'Описание',
                  child: Text(
                    program.description,
                    style: TextStyle(
                      fontSize: 14,
                      color: AppTheme.neutral700,
                      height: 1.6,
                    ),
                  ),
                ),
              ),
            ),

            // Requirements section
            if (program.requirements.isNotEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: _buildSection(
                    context,
                    icon: PhosphorIconsLight.checkCircle,
                    iconColor: AppTheme.success600,
                    iconBgColor: AppTheme.success50,
                    title: 'Требования',
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: program.requirements
                          .map((req) => _buildBulletPoint(context, req))
                          .toList(),
                    ),
                  ),
                ),
              ),

            // Documents section
            if (program.documents.isNotEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: _buildSection(
                    context,
                    icon: PhosphorIconsLight.files,
                    iconColor: AppTheme.secondary600,
                    iconBgColor: AppTheme.secondary50,
                    title: 'Необходимые документы',
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: program.documents
                          .map((doc) => _buildDocumentItem(context, doc))
                          .toList(),
                    ),
                  ),
                ),
              ),

            // Regions section
            if (program.regions.isNotEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: _buildSection(
                    context,
                    icon: PhosphorIconsLight.mapPin,
                    iconColor: AppTheme.error500,
                    iconBgColor: AppTheme.error50,
                    title: 'Регионы',
                    child: Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: program.regions.map((region) {
                        return Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: AppTheme.neutral50,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppTheme.neutral200),
                          ),
                          child: Text(
                            region,
                            style: TextStyle(
                              fontSize: 13,
                              color: AppTheme.neutral700,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),
              ),

            // Bottom spacing for button
            const SliverToBoxAdapter(
              child: SizedBox(height: 120),
            ),
          ],
        ),

        // Apply button
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          child: Container(
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
                onPressed: () {
                  context.push('/applications/new/${program.id}');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      'Подать заявку',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(width: 8),
                    PhosphorIcon(
                      PhosphorIconsLight.arrowRight,
                      size: 20,
                      color: Colors.white,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildQuickStats(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Amount row
          _HorizontalStatItem(
            icon: PhosphorIconsLight.currencyCircleDollar,
            iconColor: AppTheme.success600,
            iconBgColor: AppTheme.success50,
            label: 'Сумма финансирования',
            value: Formatters.currencyRange(
              program.minAmount,
              program.maxAmount,
            ),
            valueColor: AppTheme.success600,
          ),
          const SizedBox(height: 12),

          // Deadline row
          _HorizontalStatItem(
            icon: PhosphorIconsLight.calendar,
            iconColor: AppTheme.secondary600,
            iconBgColor: AppTheme.secondary50,
            label: 'Срок подачи',
            value: program.deadline != null
                ? Formatters.date(program.deadline!)
                : 'Бессрочно',
          ),

          // Subsidy stats
          if (program.hasSubsidy) ...[
            const SizedBox(height: 12),
            Container(
              height: 1,
              color: AppTheme.neutral100,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _CompactStatItem(
                    icon: PhosphorIconsLight.percent,
                    iconColor: AppTheme.error500,
                    label: 'Ставка',
                    value: Formatters.percent(program.interestRate ?? 0),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _CompactStatItem(
                    icon: PhosphorIconsLight.piggyBank,
                    iconColor: AppTheme.success600,
                    label: 'Субсидия',
                    value: '-${Formatters.percent(program.subsidyRate ?? 0)}',
                    valueColor: AppTheme.success600,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _CompactStatItem(
                    icon: PhosphorIconsLight.equals,
                    iconColor: AppTheme.primary,
                    label: 'Итого',
                    value: Formatters.percent(program.effectiveRate),
                    valueColor: AppTheme.primary,
                    highlighted: true,
                  ),
                ),
              ],
            ),
          ],

          // Term if available
          if (program.termMonths != null) ...[
            const SizedBox(height: 12),
            _HorizontalStatItem(
              icon: PhosphorIconsLight.clock,
              iconColor: AppTheme.neutral600,
              iconBgColor: AppTheme.neutral100,
              label: 'Срок программы',
              value: '${program.termMonths} мес.',
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSection(
    BuildContext context, {
    required PhosphorIconData icon,
    required Color iconColor,
    required Color iconBgColor,
    required String title,
    required Widget child,
  }) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.neutral100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: iconBgColor,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                  child: PhosphorIcon(icon, size: 18, color: iconColor),
                ),
              ),
              const SizedBox(width: 12),
              Text(
                title,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.neutral900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }

  Widget _buildBulletPoint(BuildContext context, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            margin: const EdgeInsets.only(top: 7),
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: AppTheme.success600,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 14,
                color: AppTheme.neutral700,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDocumentItem(BuildContext context, String document) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: AppTheme.neutral50,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: PhosphorIcon(
                PhosphorIconsLight.fileText,
                size: 16,
                color: AppTheme.neutral500,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              document,
              style: TextStyle(
                fontSize: 14,
                color: AppTheme.neutral700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Horizontal stat item with icon on left
class _HorizontalStatItem extends StatelessWidget {
  final PhosphorIconData icon;
  final Color iconColor;
  final Color iconBgColor;
  final String label;
  final String value;
  final Color? valueColor;

  const _HorizontalStatItem({
    required this.icon,
    required this.iconColor,
    required this.iconBgColor,
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: iconBgColor,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Center(
            child: PhosphorIcon(icon, color: iconColor, size: 20),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 14,
              color: AppTheme.neutral600,
            ),
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: valueColor ?? AppTheme.neutral900,
          ),
        ),
      ],
    );
  }
}

/// Compact stat item for rate display
class _CompactStatItem extends StatelessWidget {
  final PhosphorIconData icon;
  final Color iconColor;
  final String label;
  final String value;
  final Color? valueColor;
  final bool highlighted;

  const _CompactStatItem({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.value,
    this.valueColor,
    this.highlighted = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
      decoration: BoxDecoration(
        color: highlighted ? AppTheme.primary50 : AppTheme.neutral50,
        borderRadius: BorderRadius.circular(10),
        border: highlighted
            ? Border.all(color: AppTheme.primary.withValues(alpha: 0.3))
            : null,
      ),
      child: Column(
        children: [
          PhosphorIcon(icon, color: iconColor, size: 18),
          const SizedBox(height: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: AppTheme.neutral500,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: valueColor ?? AppTheme.neutral900,
            ),
          ),
        ],
      ),
    );
  }
}
