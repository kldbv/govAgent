import 'package:equatable/equatable.dart';

class CalculatorInput extends Equatable {
  final double loanAmount;
  final int termMonths;
  final double bankRate;
  final double subsidyRate;
  final PaymentType paymentType;

  const CalculatorInput({
    required this.loanAmount,
    required this.termMonths,
    required this.bankRate,
    required this.subsidyRate,
    this.paymentType = PaymentType.annuity,
  });

  double get effectiveRate => bankRate - subsidyRate;

  Map<String, dynamic> toJson() {
    return {
      'loanAmount': loanAmount,
      'termMonths': termMonths,
      'bankRate': bankRate,
      'subsidyRate': subsidyRate,
      'paymentType': paymentType.value,
    };
  }

  CalculatorInput copyWith({
    double? loanAmount,
    int? termMonths,
    double? bankRate,
    double? subsidyRate,
    PaymentType? paymentType,
  }) {
    return CalculatorInput(
      loanAmount: loanAmount ?? this.loanAmount,
      termMonths: termMonths ?? this.termMonths,
      bankRate: bankRate ?? this.bankRate,
      subsidyRate: subsidyRate ?? this.subsidyRate,
      paymentType: paymentType ?? this.paymentType,
    );
  }

  @override
  List<Object?> get props =>
      [loanAmount, termMonths, bankRate, subsidyRate, paymentType];
}

class CalculatorResult extends Equatable {
  final double loanAmount;
  final int termMonths;
  final double bankRate;
  final double subsidyRate;
  final double effectiveRate;
  final double monthlyPaymentBefore;
  final double monthlyPaymentAfter;
  final double monthlySavings;
  final double totalPaymentBefore;
  final double totalPaymentAfter;
  final double totalSavings;
  final double totalInterestBefore;
  final double totalInterestAfter;
  final double interestSavings;
  final List<PaymentScheduleItem>? schedule;

  const CalculatorResult({
    required this.loanAmount,
    required this.termMonths,
    required this.bankRate,
    required this.subsidyRate,
    required this.effectiveRate,
    required this.monthlyPaymentBefore,
    required this.monthlyPaymentAfter,
    required this.monthlySavings,
    required this.totalPaymentBefore,
    required this.totalPaymentAfter,
    required this.totalSavings,
    required this.totalInterestBefore,
    required this.totalInterestAfter,
    required this.interestSavings,
    this.schedule,
  });

  double get savingsPercentage =>
      totalPaymentBefore > 0 ? (totalSavings / totalPaymentBefore) * 100 : 0;

  factory CalculatorResult.fromJson(Map<String, dynamic> json) {
    return CalculatorResult(
      loanAmount: (json['loanAmount'] as num).toDouble(),
      termMonths: json['termMonths'] as int,
      bankRate: (json['bankRate'] as num).toDouble(),
      subsidyRate: (json['subsidyRate'] as num).toDouble(),
      effectiveRate: (json['effectiveRate'] as num).toDouble(),
      monthlyPaymentBefore: (json['monthlyPaymentBefore'] as num).toDouble(),
      monthlyPaymentAfter: (json['monthlyPaymentAfter'] as num).toDouble(),
      monthlySavings: (json['monthlySavings'] as num).toDouble(),
      totalPaymentBefore: (json['totalPaymentBefore'] as num).toDouble(),
      totalPaymentAfter: (json['totalPaymentAfter'] as num).toDouble(),
      totalSavings: (json['totalSavings'] as num).toDouble(),
      totalInterestBefore: (json['totalInterestBefore'] as num).toDouble(),
      totalInterestAfter: (json['totalInterestAfter'] as num).toDouble(),
      interestSavings: (json['interestSavings'] as num).toDouble(),
      schedule: (json['schedule'] as List<dynamic>?)
          ?.map((e) => PaymentScheduleItem.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'loanAmount': loanAmount,
      'termMonths': termMonths,
      'bankRate': bankRate,
      'subsidyRate': subsidyRate,
      'effectiveRate': effectiveRate,
      'monthlyPaymentBefore': monthlyPaymentBefore,
      'monthlyPaymentAfter': monthlyPaymentAfter,
      'monthlySavings': monthlySavings,
      'totalPaymentBefore': totalPaymentBefore,
      'totalPaymentAfter': totalPaymentAfter,
      'totalSavings': totalSavings,
      'totalInterestBefore': totalInterestBefore,
      'totalInterestAfter': totalInterestAfter,
      'interestSavings': interestSavings,
      'schedule': schedule?.map((s) => s.toJson()).toList(),
    };
  }

  /// Calculate result locally (for offline mode)
  factory CalculatorResult.calculate(CalculatorInput input) {
    final loanAmount = input.loanAmount;
    final termMonths = input.termMonths;
    final bankRate = input.bankRate;
    final subsidyRate = input.subsidyRate;
    final effectiveRate = input.effectiveRate;

    // Monthly rates
    final monthlyBankRate = bankRate / 100 / 12;
    final monthlyEffectiveRate = effectiveRate / 100 / 12;

    // Annuity formula: M = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
    double calculateMonthlyPayment(double principal, double monthlyRate) {
      if (monthlyRate == 0) return principal / termMonths;
      final factor = (1 + monthlyRate);
      final power = _pow(factor, termMonths);
      return principal * (monthlyRate * power) / (power - 1);
    }

    final monthlyPaymentBefore =
        calculateMonthlyPayment(loanAmount, monthlyBankRate);
    final monthlyPaymentAfter =
        calculateMonthlyPayment(loanAmount, monthlyEffectiveRate);
    final monthlySavings = monthlyPaymentBefore - monthlyPaymentAfter;

    final totalPaymentBefore = monthlyPaymentBefore * termMonths;
    final totalPaymentAfter = monthlyPaymentAfter * termMonths;
    final totalSavings = totalPaymentBefore - totalPaymentAfter;

    final totalInterestBefore = totalPaymentBefore - loanAmount;
    final totalInterestAfter = totalPaymentAfter - loanAmount;
    final interestSavings = totalInterestBefore - totalInterestAfter;

    return CalculatorResult(
      loanAmount: loanAmount,
      termMonths: termMonths,
      bankRate: bankRate,
      subsidyRate: subsidyRate,
      effectiveRate: effectiveRate,
      monthlyPaymentBefore: monthlyPaymentBefore,
      monthlyPaymentAfter: monthlyPaymentAfter,
      monthlySavings: monthlySavings,
      totalPaymentBefore: totalPaymentBefore,
      totalPaymentAfter: totalPaymentAfter,
      totalSavings: totalSavings,
      totalInterestBefore: totalInterestBefore,
      totalInterestAfter: totalInterestAfter,
      interestSavings: interestSavings,
    );
  }

  static double _pow(double base, int exponent) {
    double result = 1.0;
    for (int i = 0; i < exponent; i++) {
      result *= base;
    }
    return result;
  }

  @override
  List<Object?> get props => [
        loanAmount,
        termMonths,
        bankRate,
        subsidyRate,
        effectiveRate,
        monthlyPaymentBefore,
        monthlyPaymentAfter,
        monthlySavings,
        totalPaymentBefore,
        totalPaymentAfter,
        totalSavings,
        totalInterestBefore,
        totalInterestAfter,
        interestSavings,
        schedule,
      ];
}

class PaymentScheduleItem extends Equatable {
  final int month;
  final double payment;
  final double principal;
  final double interest;
  final double subsidy;
  final double balance;

  const PaymentScheduleItem({
    required this.month,
    required this.payment,
    required this.principal,
    required this.interest,
    required this.subsidy,
    required this.balance,
  });

  factory PaymentScheduleItem.fromJson(Map<String, dynamic> json) {
    return PaymentScheduleItem(
      month: json['month'] as int,
      payment: (json['payment'] as num).toDouble(),
      principal: (json['principal'] as num).toDouble(),
      interest: (json['interest'] as num).toDouble(),
      subsidy: (json['subsidy'] as num).toDouble(),
      balance: (json['balance'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'month': month,
      'payment': payment,
      'principal': principal,
      'interest': interest,
      'subsidy': subsidy,
      'balance': balance,
    };
  }

  @override
  List<Object?> get props =>
      [month, payment, principal, interest, subsidy, balance];
}

enum PaymentType {
  annuity('annuity', 'Аннуитетный'),
  differentiated('differentiated', 'Дифференцированный');

  final String value;
  final String label;

  const PaymentType(this.value, this.label);
}
