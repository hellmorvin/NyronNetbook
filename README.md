<div align="center">

<img src="./packages/desktop/public/logo.png" width="130" height="130" alt="NeyroNetbook Logo" />

# NeyroNetbook 🧠

**Ваш персональный цифровой мозг, интерактивный нейро-граф знаний, планировщик рабочих смен и финансовый менеджер**

<p align="center">
  <img src="https://img.shields.io/badge/NEYRONETBOOK-v1.2.0-7c5cff?style=for-the-badge&logo=electron&logoColor=white" alt="Version" />
  <img src="https://img.shields.io/badge/TYPESCRIPT-5.7-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/REACT-18.3-61dafb?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/ELECTRON-34-47848F?style=for-the-badge&logo=electron&logoColor=white" alt="Electron" />
  <img src="https://img.shields.io/badge/ANDROID-CAPACITOR-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Android" />
  <img src="https://img.shields.io/badge/IOS-XCODE-000000?style=for-the-badge&logo=apple&logoColor=white" alt="iOS" />
  <img src="https://img.shields.io/badge/LINUX-APPIMAGE-FCC624?style=for-the-badge&logo=linux&logoColor=black" alt="Linux" />
  <img src="https://img.shields.io/badge/ETERNAL_VAULT-ENABLED-10b981?style=for-the-badge&logo=keepassxc&logoColor=white" alt="Eternal Vault" />
  <img src="https://img.shields.io/badge/LICENSE-MIT-yellow?style=for-the-badge" alt="License" />
</p>

*Кроссплатформенная экосистема: 🪟 **Windows** • 📱 **Android** • 🐧 **Linux** • 🍎 **iOS** • 🍏 **macOS***

</div>

---

> [!CAUTION]
> ### 🛑 ВНИМАНИЕ: ОСТЕРЕГАЙТЕСЬ ФЕЙКОВ / FAKE CLONES!
>
> Я не веду никакие другие страницы/группы в Telegram или каналы на YouTube. Если вы наткнулись на файлы, сборки или архивы в сети вне этой официальной страницы GitHub, распространяемые от моего лица — это **ФЕЙК**.
>
> Загружайте и используйте программу **исключительно** из проверенного официального репозитория автора: **[github.com/hellmorvin](https://github.com/hellmorvin)**. Другие источники могут содержать вредоносные скрипты и вирусы, ворующие персональные данные.

---

## 🚀 Что нового в версии 1.2.0 (Release Notes v1.2.0)

- 🛡️ **Вечное хранилище (Eternal Vault Folder — Защита от случайного удаления)**:
  - Программа автоматически сохраняет все заметки (`.md` файлы с метаданными YAML frontmatter) и полный слепок состояния (`vault_state.json`) в системную папку пользователя `Documents/NeironoNotebook_Vault/`.
  - Даже если приложение случайно удалили, снесли систему или очистили кэш — все данные остаются невредимыми на диске.
  - При повторном запуске приложение автоматически находит папку в `Документах` и восстанавливает всё в один клик. Встроен ротационный бэкап на 15 версий.
- ⚡ **Быстрая локальная синхронизация по Wi-Fi (Телефон ↔ ПК)**:
  - Десктопная версия поднимает локальный REST/WebSocket сервер на порту `49200`.
  - В мобильном приложении достаточно ввести IP-адрес компьютера и нажать «Синхронизировать сейчас» — двусторонний обмен происходит мгновенно без облаков и сторонних серверов.
- 📊 **Глубокая Аналитика и Метрики (Десктоп и Мобильный)**:
  - **Нейро-граф знаний:** расчет плотности связей, ключевые смысловые узлы (хабы), список изолированных заметок без связей, время чтения базы знаний, распределение по папкам и тегам.
  - **Финансы и Cash Flow:** интерактивный график денежных потоков по месяцам и годам, накопления по целям, заработок со смен.
  - **Продуктивность:** учет часов, баланс дневных и ночных смен, средняя дневная выработка.
- 🎨 **Бесконечный Холст (Canvas) + Мост с Графом Знаний**:
  - Возможность открыть связи выбранного узла графа прямо на холсте в виде интерактивных связанных карточек.
  - Добавлена кнопка быстрой очистки холста для удаления лишних элементов и предотвращения захламления.
- 📝 **Исправленный редактор текста и заметок**:
  - Устранен баг со скачками курсора при форматировании (жирный, курсив, заголовки, код, цитаты).
  - Удобное перемещение заметок между папками и наведение порядка в структуре.
- 🍎 **Поддержка Apple iOS и 🐧 Linux**:
  - Добавлен нативный проект для сборки на iOS (`packages/mobile/ios`) через Capacitor 7.
  - Добавлены конфигурации сборки под Linux (`AppImage`, `.deb`, `.tar.gz`).

---

## 📷 Скриншоты Интерфейса / Interface Showcase

<div align="center">

### 🖥️ Десктопная версия (Windows / macOS / Linux) — Интерактивный Нейро-Граф
<a href="./scrinshot/2.png" target="_blank">
  <img src="./scrinshot/2.png" width="940" alt="NeyroNetbook Desktop Interface" style="border-radius: 12px; border: 1px solid rgba(124, 92, 255, 0.4); box-shadow: 0 16px 45px rgba(0,0,0,0.8);" />
</a>

<p align="center">
  <code>⚡ Силовая физика графа</code> &nbsp;•&nbsp; 
  <code>🌐 Нейронная сеть мыслей</code> &nbsp;•&nbsp; 
  <code>📝 Obsidian Markdown</code> &nbsp;•&nbsp; 
  <code>📊 Excel & Word Ribbon</code> &nbsp;•&nbsp; 
  <code>🏷️ Multi-Tag Filters</code>
</p>

<br/>

### 📱 Мобильный Клиент (Android / iOS) — Сенсорный Граф и Управление на ходу
<a href="./scrinshot/1.png" target="_blank">
  <img src="./scrinshot/1.png" width="360" alt="NeyroNetbook Mobile Interface" style="border-radius: 20px; border: 1px solid rgba(59, 130, 246, 0.4); box-shadow: 0 16px 45px rgba(0,0,0,0.8);" />
</a>

<p align="center">
  <code>👆 Сенсорный граф</code> &nbsp;•&nbsp; 
  <code>🔍 Быстрый поиск</code> &nbsp;•&nbsp; 
  <code>🧭 Нижняя навигация</code> &nbsp;•&nbsp; 
  <code>🔒 Приватный P2P Sync</code>
</p>

</div>

---

## 📥 Загрузка и Установка (Releases v1.0.0)

Официальные сборки доступны на странице **[GitHub Releases v1.0.0](https://github.com/hellmorvin/NyronNetbook/releases/tag/v1.0.0)**:

| Платформа | Формат пакета | Прямая ссылка | Описание |
| :--- | :--- | :--- | :--- |
| 🪟 **Windows 10 / 11** | `.exe` (Portable) | **[Скачать для Windows (.exe)](https://github.com/hellmorvin/NyronNetbook/releases/download/v1.0.0/NeyroNetbook.1.0.0.exe)** | Автономный запуск x64 без установки |
| 📱 **Android** | `.apk` (Signed) | **[Скачать для Android (.apk)](https://github.com/hellmorvin/NyronNetbook/releases/download/v1.0.0/NeyroNetbook.apk)** | Мобильный релизный APK (Android 8.0 - 15+) |
| 🪟 **Windows (Zip)** | `.zip` (Archive) | **[Скачать для Windows (.zip)](https://github.com/hellmorvin/NyronNetbook/releases/download/v1.0.0/NeyroNetbook-1.0.0-win.zip)** | Полный архив программы в zip |
| 🐧 **Linux** | `.AppImage` / `.deb` | **[Страница релиза v1.0.0](https://github.com/hellmorvin/NyronNetbook/releases/tag/v1.0.0)** | Ubuntu, Debian, Fedora, Arch Linux |
| 🍏 **macOS (Apple)** | `.dmg` / `.zip` | **[Страница релиза v1.0.0](https://github.com/hellmorvin/NyronNetbook/releases/tag/v1.0.0)** | Apple Silicon (M1-M4) и Intel x64 |
| 🍎 **iOS (Apple)** | `Xcode Workspace` | **[Исходный проект iOS](https://github.com/hellmorvin/NyronNetbook/tree/main/packages/mobile/ios)** | Проект для компиляции в Xcode на iPhone / iPad |

---

## ✨ Основные Модули и Возможности

### 🌌 1. Интерактивный Нейро-Граф Знаний
- Наглядная интерактивная визуализация мыслей и концептов на движке силовой физики связей.
- Автоматическая прокладка синаптических связей через двусторонние вики-ссылки `[[Имя заметки]]`.
- **4 физических пресета компоновки:**
  - ⚡ **Базовый:** сбалансированная гравитация и упругость связей.
  - 🌐 **Кластер:** компактная группировка по тегам и смысловым категориям.
  - 🪐 **Космос:** просторная структура для объемных баз знаний.
  - ⚛️ **Ядро:** плотная визуализация вокруг центральных концептов.
- **Связь с Холстом (Canvas Bridge):** экспорт выбранных связей и узлов графа на бесконечный интерактивный холст в один клик.

### 📝 2. Мультирежимный Редактор Заметок
- **Obsidian Markdown:** мгновенный предпросмотр, математические формулы, списки задач и подсветка кода.
- **Word-Style Ribbon Bar:** наглядная панель форматирования шрифтов, стилей заголовков и выравнивания.
- **Excel-Style Интерактивные Таблицы:** удобное редактирование структурированных табличных данных с автоподсчетом.
- Система тегов, двусторонних ссылок, прикрепления метаданных и цветового кодирования.

### 📅 3. Календарь Рабочих Смен и Расписание
- Генератор сменных циклов: **2/2**, **3/3**, **5/2**, **1/3**, **1/2** или произвольный шаблон.
- Автоматический расчет заработной платы с учетом дневных/ночных ставок и премиальных.
- Трекер личных дел, тренировок, стрижек, обслуживания авто с привязкой к конкретным датам.

### 💰 4. Финансовый Менеджер и Калькулятор Вкладов
- Учет доходов и расходов по категориям с наглядными интерактивными графиками распределения бюджета.
- Калькулятор банковских вкладов и накопительных счетов с **ежемесячной капитализацией процентов**.
- Постановка и отслеживание прогресса финансовых целей и накоплений.

### 🔒 5. Защищенное P2P Сопряжение (Offline-First)
- Прямая синхронизация между телефоном и компьютером без сторонних серверов.
- **Секретный закрытый токен (Pairing PIN):** любые другие устройства в той же сети Wi-Fi изолированы и не могут перехватить данные.
- 100% данных хранится только на ваших личных устройствах.

---

## ❖ Таблица Горячих Клавиш

| Комбинация | Действие |
| :--- | :--- |
| `Ctrl + N` / `Cmd + N` | Создать новую мысль или заметку |
| `Ctrl + O` / `Cmd + O` | Быстрое переключение заметок (Quick Switcher) |
| `Ctrl + F` / `Cmd + F` | Полнотекстовый и фонетический поиск |
| `Ctrl + G` / `Cmd + G` | Мгновенное открытие Нейро-Графа Знаний |
| `Ctrl + B` / `Cmd + B` | Скрыть или развернуть боковое дерево файлов |
| `Ctrl + S` / `Cmd + S` | Принудительное сохранение текущей заметки |
| `Ctrl + W` / `Cmd + W` | Закрыть активную вкладку |
| `Ctrl + ,` / `Cmd + ,` | Меню персональных настроек и цветовых тем |

---

## 🛠️ Технологический Стек

<div align="center">
  <table>
    <tr>
      <th align="left" width="30%">Уровень</th>
      <th align="left" width="70%">Используемые технологии</th>
    </tr>
    <tr>
      <td><b>Интерфейс & Рендеринг</b></td>
      <td>React 18.3 • TypeScript 5.7 • Tailwind CSS 3.4 • Lucide Icons</td>
    </tr>
    <tr>
      <td><b>Графика и Визуализация</b></td>
      <td>Интерактивный движок связей • WebGL 2.0 Shader Engine</td>
    </tr>
    <tr>
      <td><b>Платформенные оболочки</b></td>
      <td>Electron 34 (Windows/macOS/Linux) • Capacitor 7 (Android/iOS)</td>
    </tr>
    <tr>
      <td><b>Синхронизация & База</b></td>
      <td>Local-First Vault • Merkle Tree Verification • P2P WebSocket Sync Engine</td>
    </tr>
    <tr>
      <td><b>Безопасность & Сборка</b></td>
      <td>Vite 6 • esbuild Minification • DevTools Shield • Zero-Telemetry</td>
    </tr>
  </table>
</div>

---

## 📦 Структура Монорепозитория

```text
NeyroNetbook/
├── packages/
│   ├── desktop/            # Десктопный клиент (Electron + React 18 + Vite)
│   │   ├── electron/       # Главный процесс Electron, оконный менеджер, безопасность
│   │   └── src/            # Интерфейс, Нейро-Граф, Редакторы, Финансы, Смены
│   ├── mobile/             # Мобильный клиент (Capacitor + Android + iOS)
│   │   ├── android/        # Нативный проект Android Studio с Gradle
│   │   └── src/            # Адаптивный сенсорный UI и мобильный граф
│   └── shared/             # Общий TypeScript модуль
│       └── src/
│           ├── sync/       # P2P Sync Engine и валидация ключей сопряжения
│           ├── parser/     # Двусторонний парсер Markdown и вычисление хешей
│           └── search/     # Гибридный полнотекстовый и фонетический поиск
├── release/                # Готовые подписанные бинарники (.exe, .apk, .zip)
└── scrinshot/              # Официальные скриншоты интерфейса
```

---

## 🛡️ Безопасность и Приватность Данных

- ✦ **100% Local-First:** Все ваши заметки, пароли, финансовые записи и графики хранятся исключительно локально на вашем устройстве в виде открытых файлов Markdown и структурированного JSON.
- ✦ **Zero-Cloud & Zero-Telemetry:** Программа не отправляет никаких фоновых аналитических запросов, трекеров активности или телеметрии.
- ✦ **Защита от декомпиляции:** В релизных сборках полностью отключены Source Maps, вырезаны отладочные инструкции и включена защита главного процесса Electron от внедрения скриптов.

---

## ❓ Часто Задаваемые Вопросы (FAQ)

<details>
<summary><b>1. Как связать телефон и компьютер через P2P?</b></summary>
<br/>
Откройте меню <b>Синхронизация</b> на компьютере и телефоне, убедитесь, что оба устройства подключены к одной локальной сети (Wi-Fi), и введите <b>Секретный токен (Pairing PIN)</b>. Обмен произойдет мгновенно и напрямую без облачных серверов.
</details>

<details>
<summary><b>2. Где хранятся мои заметки?</b></summary>
<br/>
Все заметки сохраняются в папке вашего локального хранилища на диске. Вы можете в любой момент скопировать их, открыть в любом другом текстовом редакторе или сделать резервную копию через встроенную кнопку <b>Экспорт Vault</b>.
</details>

<details>
<summary><b>3. Как настроить график смен 2/2 или 3/3?</b></summary>
<br/>
Перейдите во вкладку <b>Смены</b>, нажмите <b>Сгенерировать график</b>, выберите тип цикла (например 2/2), дату первого рабочего дня и ставку — календарь автоматически заполнит все месяцы и подсчитает доход.
</details>

---

## 💻 Сборка и Разработка из Исходников

```bash
# 1. Клонировать репозиторий
git clone https://github.com/hellmorvin/NyronNetbook.git
cd NyronNetbook

# 2. Установить зависимости monorepo
npm install

# 3. Запуск в режиме разработки:
npm run dev             # Десктоп (Electron + Vite с горячей перезагрузкой)
npm run dev:mobile      # Сенсорный мобильный интерфейс (в браузере / смартфоне)

# 4. Сборка готовых пакетов для всех платформ:
npm run build:desktop:win   # 🪟 Windows Portable .exe и .zip (папка release/)
npm run build:linux         # 🐧 Linux .AppImage и .deb (папка release/)
npm run build:mac           # 🍏 macOS .dmg и .zip (Universal / Apple Silicon / Intel)
npm run build:apk           # 🤖 Android APK (готовый пакет в папке release/)
npm run build:ios           # 🍎 iOS (синхронизация нативного проекта с Capacitor)
npm run open:ios            # 🍎 Открытие проекта в Xcode для сборки на iPhone / iPad
```

### 🐧 Сборка для Linux (Ubuntu, Debian, Fedora, Arch):
```bash
# Сборка пакетов AppImage и DEB:
npm run build:linux
# Готовые дистрибутивы будут сгенерированы в папке release/:
# ➜ NeyroNetbook-1.0.0.AppImage
# ➜ neyronetbook_1.0.0_amd64.deb
```

### 🍎 Сборка для iOS (iPhone / iPad):
```bash
# Требования: компьютер Mac с установленным Xcode и CocoaPods
# 1. Сборка веб-пакета и синхронизация с Capacitor iOS:
npm run build:ios

# 2. Открытие нативного проекта в Xcode:
npm run open:ios

# 3. В Xcode выберите физический iPhone или симулятор iOS и нажмите Run (Cmd + R).
```

---

## 🌟 Поддержка проекта / Support the Project

Вы можете поддержать проект следующими способами:

1. Поставьте **Звезду ⭐** этому репозиторию (в верхнем правом углу этой страницы).
2. Вы можете материально поддержать оригинального разработчика **NeyroNetbook (morvin)**:
   - 👉 **[Открыть DonationAlerts для поддержки morvin](https://www.donationalerts.com/r/morvin)**
   - 🪙 **USDT (TRC-20):** `TV59nxuwqqGxeappjPsRAZNdpzs6E7J754`

Большое спасибо за поддержку развития проекта!

---

## 📜 Лицензия и Авторские Права

Проект распространяется под открытой лицензией **MIT License** с расширенным положением о защите авторского бренда. Подробнее см. файл [LICENSE](LICENSE).

<div align="center">
  <sub>Разработано для продуктивности и свободы мышления <b>NeyroNetbook</b> © 2026. Автор проекта: <a href="https://github.com/hellmorvin">@hellmorvin</a></sub>
</div>
