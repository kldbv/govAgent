import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../../app/theme.dart';
import '../../../core/models/calculator_result.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/subsidy_calculator_widget.dart';

class CalculatorScreen extends StatefulWidget {
  const CalculatorScreen({super.key});

  @override
  State<CalculatorScreen> createState() => _CalculatorScreenState();
}

class _CalculatorScreenState extends State<CalculatorScreen> {
  // Default values for initial calculation
  static const double _defaultLoanAmount = 50000000;
  static const int _defaultTermMonths = 36;
  static const double _defaultBankRate = 20.5;
  static const double _defaultSubsidyRate = 8.0;

  CalculatorResult? _result;

  @override
  void initState() {
    super.initState();
    // Calculate initial result
    _result = CalculatorResult.calculate(CalculatorInput(
      loanAmount: _defaultLoanAmount,
      termMonths: _defaultTermMonths,
      bankRate: _defaultBankRate,
      subsidyRate: _defaultSubsidyRate,
    ));
  }

  void _onResultChanged(CalculatorResult result) {
    setState(() {
      _result = result;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.neutral50,
      body: CustomScrollView(
        slivers: [
          // Header
          SliverToBoxAdapter(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    AppTheme.secondary500,
                    AppTheme.secondary600,
                  ],
                ),
                borderRadius: const BorderRadius.vertical(
                  bottom: Radius.circular(28),
                ),
              ),
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Title row
                      Row(
                        children: [
                          Container(
                            width: 52,
                            height: 52,
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: const Center(
                              child: PhosphorIcon(
                                PhosphorIconsFill.calculator,
                                size: 26,
                                color: Colors.white,
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Калькулятор',
                                style: TextStyle(
                                  fontSize: 26,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                  letterSpacing: -0.5,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Рассчитайте выгоду от субсидий',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.white.withValues(alpha: 0.85),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),

                      // Effective rate card
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.1),
                              blurRadius: 20,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Эффективная ставка',
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: AppTheme.neutral500,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Row(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        Formatters.percent(
                                            _result?.effectiveRate ?? 0),
                                        style: TextStyle(
                                          fontSize: 36,
                                          fontWeight: FontWeight.w700,
                                          color: AppTheme.success600,
                                          height: 1,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Padding(
                                        padding:
                                            const EdgeInsets.only(bottom: 4),
                                        child: Text(
                                          'годовых',
                                          style: TextStyle(
                                            fontSize: 14,
                                            color: AppTheme.neutral500,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                  colors: [
                                    AppTheme.success400,
                                    AppTheme.success600,
                                  ],
                                ),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: const PhosphorIcon(
                                PhosphorIconsFill.trendDown,
                                size: 28,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Calculator inputs
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
              child: SubsidyCalculatorWidget(
                initialAmount: _defaultLoanAmount,
                bankRate: _defaultBankRate,
                subsidyRate: _defaultSubsidyRate,
                isCompact: false,
                onResultChanged: _onResultChanged,
              ),
            ),
          ),

          // Results section
          if (_result != null)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 100),
                child: CalculatorResultsWidget(result: _result!),
              ),
            ),
        ],
      ),
    );
  }
}
