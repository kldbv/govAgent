import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../app/theme.dart';
import '../../core/models/calculator_result.dart';
import '../../core/utils/formatters.dart';
import 'custom_slider.dart';

/// Compact calculator widget for embedding in program details
class SubsidyCalculatorWidget extends StatefulWidget {
  final double? initialAmount;
  final double? minAmount;
  final double? maxAmount;
  final double? bankRate;
  final double? subsidyRate;
  final int? maxTermMonths;
  final List<int>? termOptions;
  final bool isCompact;
  final String? programName;
  final VoidCallback? onExpandTap;
  final ValueChanged<CalculatorResult>? onResultChanged;

  const SubsidyCalculatorWidget({
    super.key,
    this.initialAmount,
    this.minAmount,
    this.maxAmount,
    this.bankRate,
    this.subsidyRate,
    this.maxTermMonths,
    this.termOptions,
    this.isCompact = false,
    this.programName,
    this.onExpandTap,
    this.onResultChanged,
  });

  @override
  State<SubsidyCalculatorWidget> createState() =>
      _SubsidyCalculatorWidgetState();
}

class _SubsidyCalculatorWidgetState extends State<SubsidyCalculatorWidget> {
  late double _loanAmount;
  late int _termMonths;
  late double _bankRate;
  late double _subsidyRate;

  CalculatorResult? _result;

  // Default values
  static const double _defaultMinAmount = 1000000;
  static const double _defaultMaxAmount = 500000000;
  static const List<int> _defaultTermOptions = [12, 24, 36, 48, 60, 72, 84];

  // Computed limits based on program parameters
  // Ensure we always have a valid range (min < max)
  double get _minAmount {
    final min = widget.minAmount ?? _defaultMinAmount;
    final max = widget.maxAmount ?? _defaultMaxAmount;
    // If min equals or exceeds max, return a sensible minimum
    if (min >= max) {
      return max * 0.1; // 10% of max as minimum
    }
    return min;
  }

  double get _maxAmount => widget.maxAmount ?? _defaultMaxAmount;

  List<int> get _termOptions {
    if (widget.termOptions != null) return widget.termOptions!;

    // Filter term options based on maxTermMonths
    if (widget.maxTermMonths != null) {
      return _defaultTermOptions
          .where((term) => term <= widget.maxTermMonths!)
          .toList();
    }
    return _defaultTermOptions;
  }

  @override
  void initState() {
    super.initState();

    // Initialize loan amount within program limits
    final defaultAmount = widget.initialAmount ??
        ((_minAmount + _maxAmount) / 2).clamp(_minAmount, _maxAmount);
    _loanAmount = defaultAmount.clamp(_minAmount, _maxAmount);

    // Initialize term within program limits
    final availableTerms = _termOptions;
    if (availableTerms.isNotEmpty) {
      // Default to middle term or closest to 36 months
      final defaultTerm = availableTerms.reduce((a, b) =>
          (a - 36).abs() < (b - 36).abs() ? a : b);
      _termMonths = defaultTerm;
    } else {
      _termMonths = widget.maxTermMonths ?? 36;
    }

    _bankRate = widget.bankRate ?? 20.5;
    _subsidyRate = widget.subsidyRate ?? 8.0;
    // Calculate without notifying parent during initState to avoid setState during build
    _calculate(notifyParent: false);
  }

  void _calculate({bool notifyParent = true}) {
    final input = CalculatorInput(
      loanAmount: _loanAmount,
      termMonths: _termMonths,
      bankRate: _bankRate,
      subsidyRate: _subsidyRate,
    );

    final result = CalculatorResult.calculate(input);

    setState(() {
      _result = result;
    });

    // Notify parent about result change (skip during initState to avoid setState during build)
    if (notifyParent) {
      widget.onResultChanged?.call(result);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.isCompact) {
      return _buildCompactView();
    }
    return _buildFullView();
  }

  Widget _buildCompactView() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppTheme.secondary500,
            AppTheme.secondary600,
          ],
        ),
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: AppTheme.secondary500.withValues(alpha: 0.3),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Center(
                  child: PhosphorIcon(
                    PhosphorIconsFill.calculator,
                    size: 22,
                    color: Colors.white,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.programName != null
                          ? 'Калькулятор'
                          : 'Калькулятор выгоды',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                    Text(
                      widget.programName ?? 'Рассчитайте экономию',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.white.withValues(alpha: 0.8),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              if (widget.onExpandTap != null)
                GestureDetector(
                  onTap: widget.onExpandTap,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const PhosphorIcon(
                      PhosphorIconsLight.arrowsOut,
                      size: 18,
                      color: Colors.white,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 20),

          // Amount slider with program limits
          _buildCompactSlider(
            label: 'Сумма финансирования',
            value: Formatters.currencyShort(_loanAmount),
            slider: CustomSlider(
              value: _loanAmount,
              min: _minAmount,
              max: _maxAmount,
              divisions: 100,
              activeColor: Colors.white,
              inactiveColor: Colors.white.withValues(alpha: 0.3),
              onChanged: (value) {
                setState(() => _loanAmount = value);
                _calculate();
              },
            ),
          ),
          // Show program limits
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'от ${Formatters.currencyShort(_minAmount)}',
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.white.withValues(alpha: 0.6),
                  ),
                ),
                Text(
                  'до ${Formatters.currencyShort(_maxAmount)}',
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.white.withValues(alpha: 0.6),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Term selector
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Срок',
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.white.withValues(alpha: 0.8),
                ),
              ),
              if (widget.maxTermMonths != null)
                Text(
                  'макс. ${widget.maxTermMonths} мес',
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.white.withValues(alpha: 0.6),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _termOptions.map((term) {
                final isSelected = _termMonths == term;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: GestureDetector(
                    onTap: () {
                      setState(() => _termMonths = term);
                      _calculate();
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? Colors.white
                            : Colors.white.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '$term мес',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: isSelected
                              ? AppTheme.secondary600
                              : Colors.white,
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 20),

          // Results
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildResultItem(
                      'Эффективная ставка',
                      Formatters.percent(_result?.effectiveRate ?? 0),
                      AppTheme.success600,
                    ),
                    Container(
                      width: 1,
                      height: 40,
                      color: AppTheme.neutral100,
                    ),
                    _buildResultItem(
                      'Экономия/мес',
                      Formatters.currencyShort(_result?.monthlySavings ?? 0),
                      AppTheme.success600,
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.success50,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      PhosphorIcon(
                        PhosphorIconsFill.piggyBank,
                        size: 20,
                        color: AppTheme.success600,
                      ),
                      const SizedBox(width: 10),
                      Text(
                        'Общая экономия: ',
                        style: TextStyle(
                          fontSize: 14,
                          color: AppTheme.neutral700,
                        ),
                      ),
                      Text(
                        Formatters.currencyShort(_result?.totalSavings ?? 0),
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.success600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCompactSlider({
    required String label,
    required String value,
    required Widget slider,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                color: Colors.white.withValues(alpha: 0.8),
              ),
            ),
            Text(
              value,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        slider,
      ],
    );
  }

  Widget _buildResultItem(String label, String value, Color valueColor) {
    return Expanded(
      child: Column(
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: AppTheme.neutral500,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: valueColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFullView() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Loan Amount
        _buildInputCard(
          icon: PhosphorIconsLight.currencyCircleDollar,
          iconColor: AppTheme.primary,
          iconBgColor: AppTheme.primary50,
          title: 'Сумма кредита',
          value: Formatters.currencyShort(_loanAmount),
          child: Column(
            children: [
              CustomSlider(
                value: _loanAmount,
                min: _minAmount,
                max: _maxAmount,
                divisions: 100,
                activeColor: AppTheme.primary,
                inactiveColor: AppTheme.primary100,
                onChanged: (value) {
                  setState(() => _loanAmount = value);
                  _calculate();
                },
                labelBuilder: (v) => Formatters.currencyShort(v),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    Formatters.currencyShort(_minAmount),
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.neutral400,
                    ),
                  ),
                  Text(
                    Formatters.currencyShort(_maxAmount),
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.neutral400,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Term
        _buildInputCard(
          icon: PhosphorIconsLight.calendar,
          iconColor: AppTheme.secondary600,
          iconBgColor: AppTheme.secondary50,
          title: 'Срок кредита',
          value: '$_termMonths мес.',
          child: CustomRangeSelector<int>(
            value: _termMonths,
            options: _termOptions,
            labelBuilder: (v) => '$v мес',
            activeColor: AppTheme.secondary600,
            onChanged: (value) {
              setState(() => _termMonths = value);
              _calculate();
            },
          ),
        ),
        const SizedBox(height: 16),

        // Bank Rate
        _buildInputCard(
          icon: PhosphorIconsLight.percent,
          iconColor: AppTheme.error500,
          iconBgColor: AppTheme.error50,
          title: 'Ставка банка',
          value: Formatters.percent(_bankRate),
          child: Row(
            children: [
              Expanded(
                child: CustomSlider(
                  value: _bankRate,
                  min: 10,
                  max: 30,
                  divisions: 40,
                  activeColor: AppTheme.error500,
                  inactiveColor: AppTheme.error50,
                  onChanged: (value) {
                    setState(() => _bankRate = value);
                    _calculate();
                  },
                  labelBuilder: (v) => '${v.toStringAsFixed(1)}%',
                ),
              ),
              const SizedBox(width: 16),
              _buildRateDisplay(
                '${_bankRate.toStringAsFixed(1)}%',
                AppTheme.neutral50,
                AppTheme.neutral700,
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Subsidy Rate
        _buildInputCard(
          icon: PhosphorIconsLight.piggyBank,
          iconColor: AppTheme.success600,
          iconBgColor: AppTheme.success50,
          title: 'Ставка субсидии',
          value: Formatters.percent(_subsidyRate),
          child: Row(
            children: [
              Expanded(
                child: CustomSlider(
                  value: _subsidyRate,
                  min: 0,
                  max: 15,
                  divisions: 30,
                  activeColor: AppTheme.success600,
                  inactiveColor: AppTheme.success50,
                  onChanged: (value) {
                    setState(() => _subsidyRate = value);
                    _calculate();
                  },
                  labelBuilder: (v) => '${v.toStringAsFixed(1)}%',
                ),
              ),
              const SizedBox(width: 16),
              _buildRateDisplay(
                '${_subsidyRate.toStringAsFixed(1)}%',
                AppTheme.success50,
                AppTheme.success700,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildInputCard({
    required PhosphorIconData icon,
    required Color iconColor,
    required Color iconBgColor,
    required String title,
    required String value,
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
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: iconBgColor,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: PhosphorIcon(icon, size: 20, color: iconColor),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.neutral700,
                  ),
                ),
              ),
              Text(
                value,
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  color: iconColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          child,
        ],
      ),
    );
  }

  Widget _buildRateDisplay(String value, Color bgColor, Color textColor) {
    return Container(
      width: 72,
      padding: const EdgeInsets.symmetric(
        horizontal: 12,
        vertical: 12,
      ),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: textColor.withValues(alpha: 0.2),
        ),
      ),
      child: Text(
        value,
        textAlign: TextAlign.center,
        style: TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w700,
          color: textColor,
        ),
      ),
    );
  }
}

/// Calculator results display widget
class CalculatorResultsWidget extends StatelessWidget {
  final CalculatorResult result;

  const CalculatorResultsWidget({
    super.key,
    required this.result,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Результат расчёта',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppTheme.neutral900,
          ),
        ),
        const SizedBox(height: 16),

        // Monthly payment comparison
        Row(
          children: [
            Expanded(
              child: _ResultCard(
                title: 'Без субсидии',
                value: Formatters.currency(result.monthlyPaymentBefore),
                subtitle: 'в месяц',
                color: AppTheme.neutral500,
                bgColor: AppTheme.neutral50,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _ResultCard(
                title: 'С субсидией',
                value: Formatters.currency(result.monthlyPaymentAfter),
                subtitle: 'в месяц',
                color: AppTheme.success600,
                bgColor: AppTheme.success50,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Savings highlight
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppTheme.success500,
                AppTheme.success600,
              ],
            ),
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: AppTheme.success500.withValues(alpha: 0.3),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Center(
                  child: PhosphorIcon(
                    PhosphorIconsFill.piggyBank,
                    color: Colors.white,
                    size: 28,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Ваша экономия',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.white.withValues(alpha: 0.85),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      Formatters.currency(result.monthlySavings),
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                    Text(
                      'ежемесячно',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.white.withValues(alpha: 0.7),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Detailed results
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.neutral100),
          ),
          child: Column(
            children: [
              _buildResultRow(
                icon: PhosphorIconsLight.trophy,
                iconColor: AppTheme.secondary600,
                label: 'Общая экономия',
                value: Formatters.currencyShort(result.totalSavings),
                valueColor: AppTheme.success600,
              ),
              _divider(),
              _buildResultRow(
                icon: PhosphorIconsLight.chartLineDown,
                iconColor: AppTheme.neutral500,
                label: 'Переплата без субсидии',
                value: Formatters.currencyShort(result.totalInterestBefore),
              ),
              _divider(),
              _buildResultRow(
                icon: PhosphorIconsLight.chartLineUp,
                iconColor: AppTheme.success600,
                label: 'Переплата с субсидией',
                value: Formatters.currencyShort(result.totalInterestAfter),
                valueColor: AppTheme.success600,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _divider() {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 14),
      height: 1,
      color: AppTheme.neutral100,
    );
  }

  Widget _buildResultRow({
    required PhosphorIconData icon,
    required Color iconColor,
    required String label,
    required String value,
    Color? valueColor,
  }) {
    return Row(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: iconColor.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Center(
            child: PhosphorIcon(icon, size: 18, color: iconColor),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 14,
              color: AppTheme.neutral700,
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

class _ResultCard extends StatelessWidget {
  final String title;
  final String value;
  final String subtitle;
  final Color color;
  final Color bgColor;

  const _ResultCard({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.color,
    required this.bgColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: color.withValues(alpha: 0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              color: color,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              fontSize: 16,
              color: color,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: TextStyle(
              fontSize: 12,
              color: color.withValues(alpha: 0.7),
            ),
          ),
        ],
      ),
    );
  }
}
