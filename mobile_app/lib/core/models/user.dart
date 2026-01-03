import 'package:equatable/equatable.dart';

class User extends Equatable {
  final String id;
  final String email;
  final String? phone;
  final String? firstName;
  final String? lastName;
  final String? companyName;
  final String? bin;
  final String? region;
  final String? okedCode;
  final BusinessType businessType;
  final BusinessSize businessSize;
  final String? industry;
  final int? experienceYears;
  final double? annualRevenue;
  final int? employeeCount;
  final double? desiredLoanAmount;
  final List<String>? businessGoals;
  final String? businessGoalsComments;
  final bool isEmailVerified;
  final DateTime createdAt;
  final DateTime? updatedAt;

  const User({
    required this.id,
    required this.email,
    this.phone,
    this.firstName,
    this.lastName,
    this.companyName,
    this.bin,
    this.region,
    this.okedCode,
    this.businessType = BusinessType.individual,
    this.businessSize = BusinessSize.small,
    this.industry,
    this.experienceYears,
    this.annualRevenue,
    this.employeeCount,
    this.desiredLoanAmount,
    this.businessGoals,
    this.businessGoalsComments,
    this.isEmailVerified = false,
    required this.createdAt,
    this.updatedAt,
  });

  String get fullName {
    if (firstName != null && lastName != null) {
      return '$firstName $lastName';
    }
    return firstName ?? lastName ?? email.split('@').first;
  }

  String get displayName {
    if (businessType == BusinessType.sme && companyName != null) {
      return companyName!;
    }
    return fullName;
  }

  /// For backward compatibility
  UserType get userType {
    if (businessType == BusinessType.sme || businessType == BusinessType.startup) {
      return UserType.company;
    }
    return UserType.individual;
  }

  String get initials {
    if (firstName != null && lastName != null) {
      return '${firstName![0]}${lastName![0]}'.toUpperCase();
    }
    return email[0].toUpperCase();
  }

  /// Check if user has completed their profile with required data for applications
  /// Required by backend: business_type, business_size, industry, region, experience_years
  bool get isProfileComplete {
    // Required fields for all users (backend requirements)
    final hasRequiredFields = industry != null &&
        industry!.isNotEmpty &&
        region != null &&
        region!.isNotEmpty &&
        experienceYears != null;

    // For company users, also require company details
    if (userType == UserType.company) {
      return hasRequiredFields &&
          companyName != null &&
          companyName!.isNotEmpty &&
          bin != null &&
          bin!.isNotEmpty;
    }

    return hasRequiredFields;
  }

  /// Get list of missing profile fields
  List<String> get missingProfileFields {
    final missing = <String>[];

    if (industry == null || industry!.isEmpty) {
      missing.add('Отрасль');
    }
    if (region == null || region!.isEmpty) {
      missing.add('Регион');
    }
    if (experienceYears == null) {
      missing.add('Опыт работы');
    }

    if (userType == UserType.company) {
      if (companyName == null || companyName!.isEmpty) {
        missing.add('Название компании');
      }
      if (bin == null || bin!.isEmpty) {
        missing.add('БИН');
      }
    }

    return missing;
  }

  factory User.fromJson(Map<String, dynamic> json) {
    // Helper to safely parse double from dynamic (handles String, num, null)
    double? parseDouble(dynamic value) {
      if (value == null) return null;
      if (value is num) return value.toDouble();
      if (value is String) return double.tryParse(value);
      return null;
    }

    // Helper to safely parse int from dynamic (handles String, num, null)
    int? parseInt(dynamic value) {
      if (value == null) return null;
      if (value is int) return value;
      if (value is num) return value.toInt();
      if (value is String) return int.tryParse(value);
      return null;
    }

    // Handle full_name from backend (split into firstName/lastName)
    String? firstName;
    String? lastName;
    final fullName = json['full_name'] as String?;
    if (fullName != null && fullName.isNotEmpty) {
      final parts = fullName.split(' ');
      firstName = parts.first;
      lastName = parts.length > 1 ? parts.sublist(1).join(' ') : null;
    } else {
      firstName = json['firstName'] as String?;
      lastName = json['lastName'] as String?;
    }

    // Handle profile data if present
    final profile = json['profile'] as Map<String, dynamic>?;

    // Parse business goals
    List<String>? businessGoals;
    final goalsData = profile?['business_goals'] ?? json['businessGoals'];
    if (goalsData != null) {
      if (goalsData is List) {
        businessGoals = goalsData.map((e) => e.toString()).toList();
      }
    }

    return User(
      id: json['id'].toString(),
      email: json['email'] as String,
      phone: json['phone'] as String?,
      firstName: firstName,
      lastName: lastName,
      companyName: json['companyName'] as String? ?? json['company_name'] as String?,
      bin: profile?['bin'] as String? ?? json['bin'] as String?,
      region: profile?['region'] as String? ?? json['region'] as String?,
      okedCode: profile?['oked_code'] as String? ?? json['okedCode'] as String?,
      businessType: BusinessType.fromString(
        profile?['business_type'] as String? ?? json['businessType'] as String?,
      ),
      businessSize: BusinessSize.fromString(
        profile?['business_size'] as String? ?? json['businessSize'] as String?,
      ),
      industry: profile?['industry'] as String? ?? json['industry'] as String?,
      experienceYears: parseInt(profile?['experience_years'] ?? json['experienceYears']),
      annualRevenue: parseDouble(profile?['annual_revenue'] ?? json['annualRevenue']),
      employeeCount: parseInt(profile?['employee_count'] ?? json['employeeCount']),
      desiredLoanAmount: parseDouble(profile?['desired_loan_amount'] ?? json['desiredLoanAmount']),
      businessGoals: businessGoals,
      businessGoalsComments: profile?['business_goals_comments'] as String? ?? json['businessGoalsComments'] as String?,
      isEmailVerified: json['isEmailVerified'] as bool? ?? false,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : (json['createdAt'] != null
              ? DateTime.parse(json['createdAt'] as String)
              : DateTime.now()),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'phone': phone,
      'firstName': firstName,
      'lastName': lastName,
      'companyName': companyName,
      'bin': bin,
      'region': region,
      'okedCode': okedCode,
      'businessType': businessType.value,
      'businessSize': businessSize.value,
      'industry': industry,
      'experienceYears': experienceYears,
      'annualRevenue': annualRevenue,
      'employeeCount': employeeCount,
      'desiredLoanAmount': desiredLoanAmount,
      'businessGoals': businessGoals,
      'businessGoalsComments': businessGoalsComments,
      'isEmailVerified': isEmailVerified,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  User copyWith({
    String? id,
    String? email,
    String? phone,
    String? firstName,
    String? lastName,
    String? companyName,
    String? bin,
    String? region,
    String? okedCode,
    BusinessType? businessType,
    BusinessSize? businessSize,
    String? industry,
    int? experienceYears,
    double? annualRevenue,
    int? employeeCount,
    double? desiredLoanAmount,
    List<String>? businessGoals,
    String? businessGoalsComments,
    bool? isEmailVerified,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      companyName: companyName ?? this.companyName,
      bin: bin ?? this.bin,
      region: region ?? this.region,
      okedCode: okedCode ?? this.okedCode,
      businessType: businessType ?? this.businessType,
      businessSize: businessSize ?? this.businessSize,
      industry: industry ?? this.industry,
      experienceYears: experienceYears ?? this.experienceYears,
      annualRevenue: annualRevenue ?? this.annualRevenue,
      employeeCount: employeeCount ?? this.employeeCount,
      desiredLoanAmount: desiredLoanAmount ?? this.desiredLoanAmount,
      businessGoals: businessGoals ?? this.businessGoals,
      businessGoalsComments: businessGoalsComments ?? this.businessGoalsComments,
      isEmailVerified: isEmailVerified ?? this.isEmailVerified,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [
        id,
        email,
        phone,
        firstName,
        lastName,
        companyName,
        bin,
        region,
        okedCode,
        businessType,
        businessSize,
        industry,
        experienceYears,
        annualRevenue,
        employeeCount,
        desiredLoanAmount,
        businessGoals,
        businessGoalsComments,
        isEmailVerified,
        createdAt,
        updatedAt,
      ];
}

/// For backward compatibility with existing code
enum UserType {
  individual('individual'),
  company('company');

  final String value;

  const UserType(this.value);

  static UserType fromString(String? value) {
    return UserType.values.firstWhere(
      (type) => type.value == value,
      orElse: () => UserType.individual,
    );
  }
}

/// Business type as required by backend API
/// Valid values: startup, sme, individual, ngo
enum BusinessType {
  startup('startup'),
  sme('sme'),
  individual('individual'),
  ngo('ngo');

  final String value;

  const BusinessType(this.value);

  String get displayName {
    switch (this) {
      case BusinessType.startup:
        return 'Стартап';
      case BusinessType.sme:
        return 'МСБ (Компания)';
      case BusinessType.individual:
        return 'Физическое лицо';
      case BusinessType.ngo:
        return 'НКО';
    }
  }

  static BusinessType fromString(String? value) {
    return BusinessType.values.firstWhere(
      (type) => type.value == value,
      orElse: () => BusinessType.individual,
    );
  }
}

/// Business size as required by backend API
/// Valid values: micro, small, medium, large
enum BusinessSize {
  micro('micro'),
  small('small'),
  medium('medium'),
  large('large');

  final String value;

  const BusinessSize(this.value);

  String get displayName {
    switch (this) {
      case BusinessSize.micro:
        return 'Микро (до 15 сотрудников)';
      case BusinessSize.small:
        return 'Малый (до 100 сотрудников)';
      case BusinessSize.medium:
        return 'Средний (до 250 сотрудников)';
      case BusinessSize.large:
        return 'Крупный (более 250 сотрудников)';
    }
  }

  static BusinessSize fromString(String? value) {
    return BusinessSize.values.firstWhere(
      (type) => type.value == value,
      orElse: () => BusinessSize.small,
    );
  }
}
