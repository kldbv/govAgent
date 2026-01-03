import 'package:flutter/services.dart';
import 'package:intl/intl.dart';

/// TextInputFormatter для казахстанского номера телефона
/// Формат: +7 (7XX) XXX-XX-XX
/// Казахстанские мобильные номера: +7 7XX XXX XXXX (код страны 7, код оператора 7XX)
class KazakhstanPhoneInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    // Удаляем все нецифровые символы
    String digits = newValue.text.replaceAll(RegExp(r'[^\d]'), '');

    // Обработка различных форматов ввода
    // Если пользователь вводит 87... — убираем 8, оставляем 7...
    if (digits.startsWith('87') && digits.length > 1) {
      digits = digits.substring(1);
    }
    // Если начинается с 8 (но не 87), заменяем на 7
    else if (digits.startsWith('8') && digits.length == 1) {
      digits = '7';
    }

    // Если пользователь начинает вводить с кода оператора (7XX),
    // добавляем код страны 7 в начало
    // Т.е. если ввели "77" или "70" и т.д. — это уже правильный формат
    // Но если ввели что-то другое (не начинается с 7) — добавляем "7" как код страны
    if (digits.isNotEmpty && !digits.startsWith('7')) {
      // Пользователь ввёл цифру не 7 первой — не добавляем автоматически,
      // пусть валидатор покажет ошибку, что номер должен начинаться с 7
      // Это даст пользователю понять формат
    }

    // Ограничиваем длину до 11 цифр (7 + 7XX XXX XXXX)
    if (digits.length > 11) {
      digits = digits.substring(0, 11);
    }

    // Форматируем: +7 (7XX) XXX-XX-XX
    final buffer = StringBuffer();
    for (int i = 0; i < digits.length; i++) {
      if (i == 0) {
        buffer.write('+');
      }
      if (i == 1) {
        buffer.write(' (');
      }
      if (i == 4) {
        buffer.write(') ');
      }
      if (i == 7) {
        buffer.write('-');
      }
      if (i == 9) {
        buffer.write('-');
      }
      buffer.write(digits[i]);
    }

    final formatted = buffer.toString();

    // Вычисляем новую позицию курсора
    int cursorPosition = formatted.length;

    // Если пользователь удаляет символы, пересчитываем позицию курсора
    if (newValue.selection.baseOffset < oldValue.selection.baseOffset) {
      final newDigitsBeforeCursor = newValue.text
          .substring(0, newValue.selection.baseOffset)
          .replaceAll(RegExp(r'[^\d]'), '')
          .length;

      int digitCount = 0;
      for (int i = 0; i < formatted.length && digitCount < newDigitsBeforeCursor; i++) {
        if (RegExp(r'\d').hasMatch(formatted[i])) {
          digitCount++;
        }
        cursorPosition = i + 1;
      }
    }

    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: cursorPosition),
    );
  }
}

class Formatters {
  Formatters._();

  // Currency formatter for Kazakhstani Tenge
  static final _currencyFormat = NumberFormat.currency(
    locale: 'ru_RU',
    symbol: '₸',
    decimalDigits: 0,
  );

  static final _currencyFormatWithDecimals = NumberFormat.currency(
    locale: 'ru_RU',
    symbol: '₸',
    decimalDigits: 2,
  );

  static final _numberFormat = NumberFormat('#,###', 'ru_RU');

  // Lazy initialization for date formatters to avoid locale initialization issues
  static DateFormat? _dateFormatCache;
  static DateFormat? _dateTimeFormatCache;
  static DateFormat? _shortDateFormatCache;
  static DateFormat? _monthYearFormatCache;

  static DateFormat get _dateFormat =>
      _dateFormatCache ??= DateFormat('dd.MM.yyyy', 'ru_RU');

  static DateFormat get _dateTimeFormat =>
      _dateTimeFormatCache ??= DateFormat('dd.MM.yyyy HH:mm', 'ru_RU');

  static DateFormat get _shortDateFormat =>
      _shortDateFormatCache ??= DateFormat('dd MMM', 'ru_RU');

  static DateFormat get _monthYearFormat =>
      _monthYearFormatCache ??= DateFormat('MMMM yyyy', 'ru_RU');

  /// Format amount in Tenge (e.g., "50 000 000 ₸")
  static String currency(num amount) {
    return _currencyFormat.format(amount);
  }

  /// Format amount with decimals (e.g., "1 234 567.89 ₸")
  static String currencyWithDecimals(num amount) {
    return _currencyFormatWithDecimals.format(amount);
  }

  /// Format large amounts in short form (e.g., "50 млн ₸")
  static String currencyShort(num amount) {
    if (amount >= 1000000000) {
      return '${_numberFormat.format(amount / 1000000000)} млрд ₸';
    } else if (amount >= 1000000) {
      return '${_numberFormat.format(amount / 1000000)} млн ₸';
    } else if (amount >= 1000) {
      return '${_numberFormat.format(amount / 1000)} тыс ₸';
    }
    return currency(amount);
  }

  /// Format amount range (e.g., "1 - 500 млн ₸" or "до 15 млн ₸" if same)
  static String currencyRange(num min, num max) {
    String formatShort(num amount) {
      if (amount >= 1000000000) {
        return '${(amount / 1000000000).toStringAsFixed(amount % 1000000000 == 0 ? 0 : 1)} млрд';
      } else if (amount >= 1000000) {
        return '${(amount / 1000000).toStringAsFixed(amount % 1000000 == 0 ? 0 : 1)} млн';
      } else if (amount >= 1000) {
        return '${(amount / 1000).toStringAsFixed(0)} тыс';
      }
      return amount.toString();
    }

    // If min and max are the same, show "до X ₸"
    if (min == max || min == 0) {
      return 'до ${formatShort(max)} ₸';
    }

    // If max is 0 or very small, show "от X ₸"
    if (max == 0 || max < min) {
      return 'от ${formatShort(min)} ₸';
    }

    return '${formatShort(min)} - ${formatShort(max)} ₸';
  }

  /// Format number with thousand separators
  static String number(num value) {
    return _numberFormat.format(value);
  }

  /// Format percentage (e.g., "12.5%")
  static String percent(double value, {int decimalDigits = 1}) {
    return '${value.toStringAsFixed(decimalDigits)}%';
  }

  /// Format date (e.g., "25.12.2024")
  static String date(DateTime date) {
    return _dateFormat.format(date);
  }

  /// Format date and time (e.g., "25.12.2024 14:30")
  static String dateTime(DateTime date) {
    return _dateTimeFormat.format(date);
  }

  /// Format short date (e.g., "25 дек")
  static String shortDate(DateTime date) {
    return _shortDateFormat.format(date);
  }

  /// Format month and year (e.g., "Декабрь 2024")
  static String monthYear(DateTime date) {
    return _monthYearFormat.format(date);
  }

  /// Format relative date (e.g., "Сегодня", "Вчера", "3 дня назад")
  static String relativeDate(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final dateOnly = DateTime(date.year, date.month, date.day);
    final difference = today.difference(dateOnly).inDays;

    if (difference == 0) {
      return 'Сегодня';
    } else if (difference == 1) {
      return 'Вчера';
    } else if (difference < 7) {
      return '$difference ${_pluralize(difference, 'день', 'дня', 'дней')} назад';
    } else if (difference < 30) {
      final weeks = (difference / 7).floor();
      return '$weeks ${_pluralize(weeks, 'неделю', 'недели', 'недель')} назад';
    } else {
      return _dateFormat.format(date);
    }
  }

  /// Format days remaining (e.g., "Осталось 7 дней")
  static String daysRemaining(DateTime deadline) {
    final now = DateTime.now();
    final difference = deadline.difference(now).inDays;

    if (difference < 0) {
      return 'Истёк';
    } else if (difference == 0) {
      return 'Последний день';
    } else if (difference == 1) {
      return 'Остался 1 день';
    } else {
      return 'Осталось $difference ${_pluralize(difference, 'день', 'дня', 'дней')}';
    }
  }

  /// Format phone number (e.g., "+7 (777) 123-45-67")
  static String phone(String phone) {
    final cleaned = phone.replaceAll(RegExp(r'[^\d]'), '');
    if (cleaned.length == 11 && cleaned.startsWith('7')) {
      return '+7 (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7, 9)}-${cleaned.substring(9)}';
    } else if (cleaned.length == 10) {
      return '+7 (${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 8)}-${cleaned.substring(8)}';
    }
    return phone;
  }

  /// Format BIN (e.g., "123456 789012")
  static String bin(String bin) {
    final cleaned = bin.replaceAll(RegExp(r'[^\d]'), '');
    if (cleaned.length == 12) {
      return '${cleaned.substring(0, 6)} ${cleaned.substring(6)}';
    }
    return bin;
  }

  /// Pluralize Russian words
  static String _pluralize(int count, String one, String few, String many) {
    final mod10 = count % 10;
    final mod100 = count % 100;

    if (mod100 >= 11 && mod100 <= 19) {
      return many;
    } else if (mod10 == 1) {
      return one;
    } else if (mod10 >= 2 && mod10 <= 4) {
      return few;
    } else {
      return many;
    }
  }

  /// Format file size (e.g., "2.5 МБ")
  static String fileSize(int bytes) {
    if (bytes < 1024) {
      return '$bytes Б';
    } else if (bytes < 1024 * 1024) {
      return '${(bytes / 1024).toStringAsFixed(1)} КБ';
    } else if (bytes < 1024 * 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} МБ';
    } else {
      return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} ГБ';
    }
  }
}
