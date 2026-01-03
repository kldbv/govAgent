# Руководство по публикации в TestFlight

## Предварительные требования

### 1. Apple Developer Account
- Необходима подписка Apple Developer Program ($99/год)
- Зарегистрируйтесь на [developer.apple.com](https://developer.apple.com)

### 2. Xcode
- Установите последнюю версию Xcode из Mac App Store
- Xcode 15 или выше

### 3. Сертификаты и профили
```bash
# Проверьте текущие сертификаты
security find-identity -v -p codesigning
```

---

## Шаг 1: Настройка проекта в Xcode

### 1.1 Откройте проект iOS
```bash
cd mobile_app
open ios/Runner.xcworkspace
```

### 1.2 Настройте Bundle Identifier
1. В Xcode выберите **Runner** в навигаторе проекта
2. Перейдите в **Signing & Capabilities**
3. Установите **Bundle Identifier**: `com.mgp.businesssupport`
4. Выберите свою **Team** (ваш Apple Developer account)

> **Apple ID приложения**: 6757338852

### 1.3 Настройте версию приложения
В файле `pubspec.yaml`:
```yaml
version: 1.0.0+1  # 1.0.0 = версия, 1 = build number
```

### 1.4 Настройте Info.plist
Откройте `ios/Runner/Info.plist` и добавьте необходимые разрешения:
```xml
<!-- Камера -->
<key>NSCameraUsageDescription</key>
<string>Для загрузки документов</string>

<!-- Фото -->
<key>NSPhotoLibraryUsageDescription</key>
<string>Для выбора документов</string>

<!-- Face ID -->
<key>NSFaceIDUsageDescription</key>
<string>Для безопасного входа</string>
```

---

## Шаг 2: Создание App Store Connect записи

### 2.1 Войдите в App Store Connect
1. Перейдите на [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Войдите с Apple ID разработчика

### 2.2 Создайте новое приложение
1. Нажмите **"+"** → **"New App"**
2. Заполните:
   - **Platform**: iOS
   - **Name**: Business Support
   - **Primary Language**: Russian
   - **Bundle ID**: `com.mgp.businesssupport` (должен совпадать с Xcode)
   - **SKU**: businesssupport-app (уникальный идентификатор)
   - **Apple ID**: 6757338852

---

## Шаг 3: Сборка приложения

### 3.1 Очистите предыдущие сборки
```bash
cd mobile_app
flutter clean
flutter pub get
```

### 3.2 Соберите релизную версию
```bash
flutter build ios --release
```

### 3.3 Откройте Xcode для архивации
```bash
open ios/Runner.xcworkspace
```

---

## Шаг 4: Архивация и загрузка

### 4.1 Создайте архив
1. В Xcode выберите **Product** → **Archive**
2. Убедитесь что выбран **Any iOS Device (arm64)**
3. Дождитесь завершения архивации

### 4.2 Загрузите в App Store Connect
1. После архивации откроется **Organizer**
2. Выберите архив и нажмите **"Distribute App"**
3. Выберите **"App Store Connect"**
4. Выберите **"Upload"**
5. Включите все опции (Manage Version, Strip Swift Symbols, Upload Symbols)
6. Нажмите **"Upload"**

---

## Шаг 5: Настройка TestFlight

### 5.1 Дождитесь обработки
- После загрузки Apple обрабатывает сборку (5-30 минут)
- Вы получите email когда сборка будет готова

### 5.2 Ответьте на вопросы соответствия
1. В App Store Connect → **TestFlight**
2. Выберите сборку
3. Ответьте на вопросы о шифровании (обычно "No" для стандартных приложений)

### 5.3 Добавьте информацию для тестирования
1. Заполните **"What to Test"** - что тестировать
2. Добавьте **"Test Information"**:
   - Email для обратной связи
   - Данные для тестовой авторизации

### 5.4 Добавьте внутренних тестировщиков
1. **TestFlight** → **Internal Testing**
2. Нажмите **"+"** для создания группы
3. Добавьте тестировщиков (до 100 человек)
4. Они получат приглашение по email

### 5.5 Добавьте внешних тестировщиков (опционально)
1. **TestFlight** → **External Testing**
2. Создайте группу и добавьте тестировщиков (до 10,000 человек)
3. Требуется проверка Apple Review (1-2 дня)

---

## Шаг 6: Установка TestFlight

### Для тестировщиков:
1. Установите приложение **TestFlight** из App Store
2. Откройте приглашение по email или используйте код
3. Нажмите **"Accept"** и **"Install"**

---

## Автоматизация с Fastlane

### Установка Fastlane
```bash
# Установите Ruby (если нет)
brew install ruby

# Установите Fastlane
gem install fastlane
```

### Инициализация
```bash
cd mobile_app/ios
fastlane init
```

### Создайте Fastfile
```ruby
# ios/fastlane/Fastfile
default_platform(:ios)

platform :ios do
  desc "Push a new beta build to TestFlight"
  lane :beta do
    # Increment build number
    increment_build_number(xcodeproj: "Runner.xcodeproj")

    # Build
    build_app(
      workspace: "Runner.xcworkspace",
      scheme: "Runner",
      export_method: "app-store"
    )

    # Upload to TestFlight
    upload_to_testflight(
      skip_waiting_for_build_processing: true
    )
  end
end
```

### Запуск
```bash
cd mobile_app/ios
fastlane beta
```

---

## Полезные команды

### Проверка сборки
```bash
flutter analyze
flutter test
flutter build ios --release
```

### Проверка версии
```bash
flutter --version
xcodebuild -version
```

### Очистка
```bash
flutter clean
cd ios && pod deintegrate && pod install && cd ..
```

---

## Частые проблемы

### 1. Ошибка подписи
```
error: No signing certificate "iOS Distribution" found
```
**Решение**: Создайте Distribution сертификат в Apple Developer Portal

### 2. Ошибка Bundle ID
```
The bundle identifier "..." is not available
```
**Решение**: Используйте уникальный Bundle ID

### 3. Ошибка минимальной версии iOS
```
Deployment target lower than 12.0
```
**Решение**: В `ios/Podfile` установите:
```ruby
platform :ios, '12.0'
```

### 4. Ошибка CocoaPods
```bash
cd ios
pod deintegrate
pod install
```

### 5. Ошибка при загрузке
```
Unable to process request
```
**Решение**: Подождите и попробуйте снова, или используйте Transporter app

---

## Чек-лист перед релизом

- [ ] Bundle ID уникален и зарегистрирован
- [ ] Версия и build number обновлены
- [ ] Все иконки приложения добавлены
- [ ] Launch Screen настроен
- [ ] Разрешения (камера, фото) описаны в Info.plist
- [ ] Тесты проходят
- [ ] Приложение собирается без ошибок
- [ ] App Store Connect запись создана
- [ ] Тестировщики добавлены в TestFlight

---

## Ресурсы

- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [TestFlight Documentation](https://developer.apple.com/testflight/)
- [Fastlane Documentation](https://docs.fastlane.tools/)
- [Flutter iOS Deployment](https://docs.flutter.dev/deployment/ios)
