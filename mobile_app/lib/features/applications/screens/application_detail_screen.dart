import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../../app/theme.dart';
import '../../../core/models/application.dart';
import '../../../core/utils/constants.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../../../shared/widgets/error_widget.dart';
import '../bloc/applications_bloc.dart';

class ApplicationDetailScreen extends StatefulWidget {
  final String applicationId;

  const ApplicationDetailScreen({super.key, required this.applicationId});

  @override
  State<ApplicationDetailScreen> createState() => _ApplicationDetailScreenState();
}

class _ApplicationDetailScreenState extends State<ApplicationDetailScreen> {
  @override
  void initState() {
    super.initState();
    context.read<ApplicationsBloc>().add(
      LoadApplicationDetail(applicationId: widget.applicationId),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.neutral50,
      body: BlocConsumer<ApplicationsBloc, ApplicationsState>(
        listener: (context, state) {
          if (state is ApplicationCancelled) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: const Text('Заявка отменена'),
                backgroundColor: AppTheme.success600,
              ),
            );
            if (context.canPop()) {
              context.pop();
            } else {
              context.go(AppRoutes.home);
            }
          }
        },
        builder: (context, state) {
          if (state is ApplicationsLoading) {
            return const Center(child: LoadingIndicator());
          }

          if (state is ApplicationsError) {
            return AppErrorWidget(
              message: state.message,
              onRetry: () {
                context.read<ApplicationsBloc>().add(
                  LoadApplicationDetail(applicationId: widget.applicationId),
                );
              },
            );
          }

          if (state is ApplicationDetailLoaded) {
            return _buildContent(context, state.application);
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildContent(BuildContext context, Application application) {
    final statusColor = Color(application.status.colorValue);

    return CustomScrollView(
      slivers: [
        // Header with gradient
        SliverToBoxAdapter(
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  statusColor,
                  statusColor.withValues(alpha: 0.8),
                ],
              ),
              borderRadius: const BorderRadius.vertical(
                bottom: Radius.circular(28),
              ),
            ),
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(8, 8, 20, 28),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Back button and title
                    Row(
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
                        const SizedBox(width: 8),
                        const Expanded(
                          child: Text(
                            'Детали заявки',
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                              letterSpacing: -0.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Program name
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Text(
                        application.program?.name ?? 'Программа',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                          height: 1.3,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Provider
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Text(
                        application.program?.provider ?? '',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.white.withValues(alpha: 0.85),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Status badge
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              application.status.label,
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
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
        ),

        // Content
        SliverPadding(
          padding: const EdgeInsets.all(20),
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              // Info card
              _buildInfoCard(application),
              const SizedBox(height: 20),

              // Timeline
              _buildTimelineSection(application),
              const SizedBox(height: 20),

              // Documents
              if (application.documents.isNotEmpty) ...[
                _buildDocumentsSection(application),
                const SizedBox(height: 20),
              ],

              // Rejection reason
              if (application.rejectionReason != null) ...[
                _buildRejectionSection(application),
                const SizedBox(height: 20),
              ],

              // Notes
              if (application.notes != null &&
                  application.notes!.isNotEmpty) ...[
                _buildNotesSection(application),
                const SizedBox(height: 20),
              ],

              // Actions
              if (application.status == ApplicationStatus.draft ||
                  application.status == ApplicationStatus.submitted ||
                  application.status == ApplicationStatus.underReview) ...[
                _buildActionsSection(context, application),
                const SizedBox(height: 20),
              ],

              const SizedBox(height: 60),
            ]),
          ),
        ),
      ],
    );
  }

  Widget _buildInfoCard(Application application) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Requested amount
          _InfoRow(
            icon: PhosphorIconsLight.currencyCircleDollar,
            iconColor: AppTheme.success600,
            label: 'Запрашиваемая сумма',
            value: Formatters.currency(application.requestedAmount),
          ),
          _buildDivider(),

          // Application ID
          _InfoRow(
            icon: PhosphorIconsLight.hashStraight,
            iconColor: AppTheme.primary,
            label: 'Номер заявки',
            value: application.id.length >= 8
                ? application.id.substring(0, 8).toUpperCase()
                : application.id.toUpperCase(),
          ),
          _buildDivider(),

          // Created date
          _InfoRow(
            icon: PhosphorIconsLight.calendarPlus,
            iconColor: AppTheme.secondary600,
            label: 'Дата создания',
            value: Formatters.date(application.createdAt),
          ),

          // Submitted date
          if (application.submittedAt != null) ...[
            _buildDivider(),
            _InfoRow(
              icon: PhosphorIconsLight.paperPlaneTilt,
              iconColor: AppTheme.primary,
              label: 'Дата подачи',
              value: Formatters.date(application.submittedAt!),
            ),
          ],

          // Updated date
          if (application.updatedAt != application.createdAt) ...[
            _buildDivider(),
            _InfoRow(
              icon: PhosphorIconsLight.clockCounterClockwise,
              iconColor: AppTheme.neutral500,
              label: 'Последнее обновление',
              value: Formatters.date(application.updatedAt),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDivider() {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 14),
      height: 1,
      color: AppTheme.neutral100,
    );
  }

  Widget _buildTimelineSection(Application application) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppTheme.primary50,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: PhosphorIcon(
                    PhosphorIconsLight.path,
                    size: 20,
                    color: AppTheme.primary,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Text(
                'Ход заявки',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.neutral900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Timeline items
          _TimelineItem(
            title: 'Черновик создан',
            date: application.createdAt,
            isCompleted: true,
            isFirst: true,
          ),
          if (application.submittedAt != null)
            _TimelineItem(
              title: 'Заявка подана',
              date: application.submittedAt!,
              isCompleted: true,
            ),
          if (application.status == ApplicationStatus.underReview ||
              application.status == ApplicationStatus.approved ||
              application.status == ApplicationStatus.rejected)
            _TimelineItem(
              title: 'На рассмотрении',
              date: application.submittedAt ?? application.updatedAt,
              isCompleted: application.status != ApplicationStatus.underReview,
              isCurrent: application.status == ApplicationStatus.underReview,
            ),
          if (application.status == ApplicationStatus.approved)
            _TimelineItem(
              title: 'Одобрено',
              date: application.updatedAt,
              isCompleted: true,
              isLast: true,
            ),
          if (application.status == ApplicationStatus.rejected)
            _TimelineItem(
              title: 'Отклонено',
              date: application.updatedAt,
              isCompleted: true,
              isRejected: true,
              isLast: true,
            ),
        ],
      ),
    );
  }

  Widget _buildDocumentsSection(Application application) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppTheme.secondary50,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: PhosphorIcon(
                    PhosphorIconsLight.files,
                    size: 20,
                    color: AppTheme.secondary600,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Text(
                'Документы',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.neutral900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...application.documents.map((doc) => _DocumentItem(document: doc)),
        ],
      ),
    );
  }

  Widget _buildRejectionSection(Application application) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.error50,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.error100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: PhosphorIcon(
                    PhosphorIconsLight.warning,
                    size: 20,
                    color: AppTheme.error500,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Text(
                'Причина отказа',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.error600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            application.rejectionReason!,
            style: TextStyle(
              fontSize: 15,
              color: AppTheme.error600,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNotesSection(Application application) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppTheme.primary50,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: PhosphorIcon(
                    PhosphorIconsLight.notepad,
                    size: 20,
                    color: AppTheme.primary,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Text(
                'Примечания',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.neutral900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            application.notes!,
            style: TextStyle(
              fontSize: 15,
              color: AppTheme.neutral700,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionsSection(BuildContext context, Application application) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Действия',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w600,
              color: AppTheme.neutral900,
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => _showCancelDialog(context, application),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.error500,
                side: BorderSide(color: AppTheme.error200),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              icon: PhosphorIcon(PhosphorIconsLight.x, size: 20),
              label: const Text(
                'Отменить заявку',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showCancelDialog(BuildContext context, Application application) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppTheme.error50,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: PhosphorIcon(
                  PhosphorIconsLight.warning,
                  size: 22,
                  color: AppTheme.error500,
                ),
              ),
            ),
            const SizedBox(width: 14),
            const Text('Отменить заявку?'),
          ],
        ),
        content: Text(
          'Вы уверены, что хотите отменить эту заявку? Это действие нельзя отменить.',
          style: TextStyle(
            color: AppTheme.neutral600,
            height: 1.5,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: Text(
              'Нет, оставить',
              style: TextStyle(color: AppTheme.neutral600),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(dialogContext).pop();
              context.read<ApplicationsBloc>().add(
                CancelApplication(applicationId: application.id),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.error500,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: const Text('Да, отменить'),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final PhosphorIconData icon;
  final Color iconColor;
  final String label;
  final String value;

  const _InfoRow({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: iconColor.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Center(
            child: PhosphorIcon(icon, size: 20, color: iconColor),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: AppTheme.neutral500,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.neutral900,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _TimelineItem extends StatelessWidget {
  final String title;
  final DateTime date;
  final bool isCompleted;
  final bool isFirst;
  final bool isLast;
  final bool isCurrent;
  final bool isRejected;

  const _TimelineItem({
    required this.title,
    required this.date,
    this.isCompleted = false,
    this.isFirst = false,
    this.isLast = false,
    this.isCurrent = false,
    this.isRejected = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = isRejected
        ? AppTheme.error500
        : isCurrent
            ? AppTheme.secondary600
            : isCompleted
                ? AppTheme.success600
                : AppTheme.neutral300;

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline line and dot
          SizedBox(
            width: 24,
            child: Column(
              children: [
                // Top line
                if (!isFirst)
                  Container(
                    width: 2,
                    height: 8,
                    color: color,
                  ),
                // Dot
                Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: isCurrent ? Colors.white : color,
                    shape: BoxShape.circle,
                    border: isCurrent
                        ? Border.all(color: color, width: 3)
                        : null,
                  ),
                ),
                // Bottom line
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: isCompleted ? color : AppTheme.neutral200,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 14),
          // Content
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: isRejected ? AppTheme.error600 : AppTheme.neutral900,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    Formatters.dateTime(date),
                    style: TextStyle(
                      fontSize: 13,
                      color: AppTheme.neutral500,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DocumentItem extends StatelessWidget {
  final ApplicationDocument document;

  const _DocumentItem({required this.document});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.neutral50,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(
              child: PhosphorIcon(
                _getFileIcon(document.type),
                size: 20,
                color: AppTheme.secondary600,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  document.name,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.neutral900,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  document.type.toUpperCase(),
                  style: TextStyle(
                    fontSize: 12,
                    color: AppTheme.neutral500,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () {
              // TODO: Download document
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Скачивание документа...')),
              );
            },
            icon: PhosphorIcon(
              PhosphorIconsLight.downloadSimple,
              size: 22,
              color: AppTheme.primary,
            ),
          ),
        ],
      ),
    );
  }

  PhosphorIconData _getFileIcon(String type) {
    switch (type.toLowerCase()) {
      case 'pdf':
        return PhosphorIconsLight.filePdf;
      case 'doc':
      case 'docx':
        return PhosphorIconsLight.fileDoc;
      case 'xls':
      case 'xlsx':
        return PhosphorIconsLight.fileXls;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return PhosphorIconsLight.fileImage;
      default:
        return PhosphorIconsLight.file;
    }
  }
}
