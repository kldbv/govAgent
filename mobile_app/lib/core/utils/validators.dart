import 'constants.dart';

/// Валидаторы для форм с учётом требований Казахстана
class Validators {
  Validators._();

  /// Валидация email
  static String? email(String? value) {
    if (value == null || value.isEmpty) {
      return 'Email обязателен';
    }
    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!emailRegex.hasMatch(value)) {
      return 'Введите корректный email';
    }
    return null;
  }

  /// Валидация пароля
  static String? password(String? value) {
    if (value == null || value.isEmpty) {
      return 'Пароль обязателен';
    }
    if (value.length < AppConstants.minPasswordLength) {
      return 'Пароль должен быть минимум ${AppConstants.minPasswordLength} символов';
    }
    if (value.length > AppConstants.maxPasswordLength) {
      return 'Пароль не должен превышать ${AppConstants.maxPasswordLength} символов';
    }
    // Проверка на наличие цифры
    if (!RegExp(r'\d').hasMatch(value)) {
      return 'Пароль должен содержать хотя бы одну цифру';
    }
    // Проверка на наличие буквы
    if (!RegExp(r'[a-zA-Z]').hasMatch(value)) {
      return 'Пароль должен содержать хотя бы одну букву';
    }
    return null;
  }

  /// Обязательное поле
  static String? required(String? value, [String fieldName = 'Поле']) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName обязательно для заполнения';
    }
    return null;
  }

  /// Валидация казахстанского номера телефона
  /// Формат: +7 (7XX) XXX-XX-XX
  /// Полный номер: 11 цифр, начинается с 77 (код страны 7 + код оператора 7XX)
  static String? phone(String? value) {
    if (value == null || value.isEmpty) {
      return 'Телефон обязателен';
    }

    // Убираем все символы кроме цифр
    final cleanedPhone = value.replaceAll(RegExp(r'[^\d]'), '');

    // Проверяем что номер начинается с 7 (код страны)
    if (cleanedPhone.isEmpty || cleanedPhone[0] != '7') {
      return 'Номер должен начинаться с +7';
    }

    // Проверяем длину — должно быть 11 цифр для полного номера
    if (cleanedPhone.length < 11) {
      return 'Введите полный номер телефона';
    }

    if (cleanedPhone.length > 11) {
      return 'Номер слишком длинный';
    }

    // Проверяем что второй символ тоже 7 (код оператора 7XX)
    // Формат: 7 + 7XX + XXX + XXXX
    if (cleanedPhone[1] != '7') {
      return 'Код оператора должен начинаться с 7';
    }

    // Проверяем код оператора (XX после 77)
    // Казахстанские мобильные коды: 700-709, 747, 750-759, 760-769, 770-779, 775-778
    final operatorCode = cleanedPhone.substring(2, 4);
    final validCodes = [
      '00', '01', '02', '05', '06', '07', '08', '09',  // 770X
      '47',                                             // 7747
      '50', '51', '52', '55', '56', '57', '58', '59',  // 775X
      '60', '61', '62', '63', '64', '65', '66', '67', '68', '69',  // 776X
      '70', '71', '72', '75', '76', '77', '78',        // 777X
    ];

    if (!validCodes.contains(operatorCode)) {
      return 'Некорректный код оператора';
    }

    return null;
  }

  /// Опциональная валидация телефона (не обязательное поле)
  static String? phoneOptional(String? value) {
    if (value == null || value.isEmpty) {
      return null; // Поле не обязательное
    }
    return phone(value);
  }

  /// Валидация БИН (Бизнес-идентификационный номер)
  /// 12 цифр, 5-я цифра: 4-юр.лицо резидент, 5-юр.лицо нерезидент, 6-ИП
  static String? bin(String? value) {
    if (value == null || value.isEmpty) {
      return 'БИН обязателен';
    }

    final cleanedBin = value.replaceAll(RegExp(r'[^\d]'), '');

    if (cleanedBin.length != AppConstants.binLength) {
      return 'БИН должен содержать ${AppConstants.binLength} цифр';
    }

    if (!RegExp(r'^\d+$').hasMatch(cleanedBin)) {
      return 'БИН должен содержать только цифры';
    }

    // Проверка 5-й цифры (тип организации)
    final typeDigit = int.parse(cleanedBin[4]);
    if (typeDigit < 4 || typeDigit > 6) {
      return 'Некорректный БИН: неверный тип организации';
    }

    // Проверка контрольной суммы
    if (!_validateBinIinChecksum(cleanedBin)) {
      return 'Некорректный БИН: ошибка контрольной суммы';
    }

    return null;
  }

  /// Опциональная валидация БИН
  static String? binOptional(String? value) {
    if (value == null || value.isEmpty) {
      return null;
    }
    return bin(value);
  }

  /// Валидация ИИН (Индивидуальный идентификационный номер)
  /// 12 цифр, формат: ГГММДД + 5 цифр (пол, порядковый номер) + контрольная
  static String? iin(String? value) {
    if (value == null || value.isEmpty) {
      return 'ИИН обязателен';
    }

    final cleanedIin = value.replaceAll(RegExp(r'[^\d]'), '');

    if (cleanedIin.length != AppConstants.iinLength) {
      return 'ИИН должен содержать ${AppConstants.iinLength} цифр';
    }

    if (!RegExp(r'^\d+$').hasMatch(cleanedIin)) {
      return 'ИИН должен содержать только цифры';
    }

    // Проверка даты рождения (первые 6 цифр - ГГММДД)
    // Year is parsed but we only validate it's a valid 2-digit number (00-99)
    final month = int.parse(cleanedIin.substring(2, 4));
    final day = int.parse(cleanedIin.substring(4, 6));

    if (month < 1 || month > 12) {
      return 'Некорректный ИИН: неверный месяц';
    }

    if (day < 1 || day > 31) {
      return 'Некорректный ИИН: неверный день';
    }

    // Проверка 7-й цифры (век и пол)
    final centuryGender = int.parse(cleanedIin[6]);
    if (centuryGender < 1 || centuryGender > 6) {
      return 'Некорректный ИИН: неверный код века/пола';
    }

    // Проверка контрольной суммы
    if (!_validateBinIinChecksum(cleanedIin)) {
      return 'Некорректный ИИН: ошибка контрольной суммы';
    }

    return null;
  }

  /// Опциональная валидация ИИН
  static String? iinOptional(String? value) {
    if (value == null || value.isEmpty) {
      return null;
    }
    return iin(value);
  }

  /// Подтверждение пароля
  static String? confirmPassword(String? value, String? password) {
    if (value == null || value.isEmpty) {
      return 'Подтверждение пароля обязательно';
    }
    if (value != password) {
      return 'Пароли не совпадают';
    }
    return null;
  }

  /// Валидация суммы
  static String? amount(String? value, {double? min, double? max}) {
    if (value == null || value.isEmpty) {
      return 'Сумма обязательна';
    }
    final amount = double.tryParse(value.replaceAll(RegExp(r'[^\d.]'), ''));
    if (amount == null) {
      return 'Введите корректную сумму';
    }
    if (min != null && amount < min) {
      return 'Минимальная сумма: ${_formatAmount(min)}';
    }
    if (max != null && amount > max) {
      return 'Максимальная сумма: ${_formatAmount(max)}';
    }
    return null;
  }

  /// Валидация имени (только буквы, дефис, пробелы)
  static String? name(String? value, [String fieldName = 'Имя']) {
    if (value == null || value.isEmpty) {
      return '$fieldName обязательно';
    }

    if (value.length < 2) {
      return '$fieldName должно содержать минимум 2 символа';
    }

    if (value.length > 50) {
      return '$fieldName не должно превышать 50 символов';
    }

    // Разрешаем кириллицу, латиницу, пробелы и дефисы
    if (!RegExp(r'^[a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ\s\-]+$').hasMatch(value)) {
      return '$fieldName может содержать только буквы';
    }

    return null;
  }

  /// Опциональная валидация имени
  static String? nameOptional(String? value, [String fieldName = 'Имя']) {
    if (value == null || value.isEmpty) {
      return null;
    }
    return name(value, fieldName);
  }

  /// Валидация названия компании
  static String? companyName(String? value) {
    if (value == null || value.isEmpty) {
      return 'Название компании обязательно';
    }

    if (value.length < 2) {
      return 'Название должно содержать минимум 2 символа';
    }

    if (value.length > 200) {
      return 'Название не должно превышать 200 символов';
    }

    return null;
  }

  /// Валидация ОКЭД (Общий классификатор видов экономической деятельности)
  /// Формат: XX.XX или XX.XX.X
  static String? oked(String? value) {
    if (value == null || value.isEmpty) {
      return null; // ОКЭД не обязателен
    }

    // Формат ОКЭД: XX.XX или XX.XX.X (цифры и точки)
    if (!RegExp(r'^\d{2}\.\d{2}(\.\d)?$').hasMatch(value)) {
      return 'Формат ОКЭД: XX.XX или XX.XX.X';
    }

    return null;
  }

  /// Проверка контрольной суммы БИН/ИИН по алгоритму Казахстана
  static bool _validateBinIinChecksum(String value) {
    if (value.length != 12) return false;

    // Веса для первого прохода
    final weights1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    // Веса для второго прохода
    final weights2 = [3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 2];

    int sum = 0;
    for (int i = 0; i < 11; i++) {
      sum += int.parse(value[i]) * weights1[i];
    }

    int checkDigit = sum % 11;

    if (checkDigit == 10) {
      sum = 0;
      for (int i = 0; i < 11; i++) {
        sum += int.parse(value[i]) * weights2[i];
      }
      checkDigit = sum % 11;
      if (checkDigit == 10) {
        return false; // Невозможно вычислить контрольную сумму
      }
    }

    return checkDigit == int.parse(value[11]);
  }

  static String _formatAmount(double amount) {
    if (amount >= 1000000000) {
      return '${(amount / 1000000000).toStringAsFixed(1)} млрд ₸';
    } else if (amount >= 1000000) {
      return '${(amount / 1000000).toStringAsFixed(1)} млн ₸';
    } else if (amount >= 1000) {
      return '${(amount / 1000).toStringAsFixed(0)} тыс ₸';
    }
    return '${amount.toStringAsFixed(0)} ₸';
  }
}
