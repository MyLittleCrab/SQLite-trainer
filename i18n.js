// Система интернационализации / Internationalization system
class I18n {
    constructor() {
        this.currentLanguage = 'en'; // По умолчанию английский
        this.translations = {
            en: {
                // Header texts
                'header.title': 'Browser SQL Trainer',
                'header.subtitle': 'Trainer for learning SQL: execute queries, check results, database schema',
                
                // Loading messages
                'loading.sqlite': 'Loading SQLite WebAssembly...',
                'loading.module': 'Loading SQLite WebAssembly module...',
                'loading.database': 'Creating database...',
                'loading.tasks': 'Loading tasks...',
                
                // Error messages
                'error.loading': 'SQLite loading error: ',
                'error.causes': 'Possible causes:',
                'error.no_internet': '• No internet connection',
                'error.blocked_access': '• Access to sql.js.org is blocked',
                'error.try_refresh': '• Try refreshing the page',
                'error.tasks_loading': 'Tasks loading error: ',
                'error.no_tasks': 'No available tasks',
                'error.task_loading': 'Task loading error: ',
                'error.db_init': 'Database initialization error for task: ',
                'error.schema_update': 'Schema update error: ',
                'error.sql_execution': 'SQL Error: ',
                'error.enter_sql': 'Enter SQL query',
                'error.sqlite_loading': 'SQLite WebAssembly is still loading...',
                'error.db_not_initialized': 'Database is not initialized',
                'error.result_check': 'Result check error: ',
                'error.db_not_ready': 'Database is not ready',
                'error.tables_not_found': 'Tables not found',
                'error.count_error': 'Could not get record count',
                
                // Section headers
                'section.current_task': '🎯 Current Task',
                'section.database_schema': '📋 Database Schema',
                'section.sql_editor': '💻 SQL Editor',
                'section.results': '📊 Results',
                
                // Task interface
                'task.next_task': 'Next Task',
                'task.hint_label': 'Hint:',
                'task.show_hint': 'Show Hint',
                'task.hide_hint': 'Hide Hint',
                'task.correct': 'Excellent! Task solved correctly!',
                'task.wrong_rows': 'Wrong number of rows. Expected: {expected}, got: {actual}',
                'task.wrong_value': 'Wrong value in row {row}, field "{field}". Expected: {expected}, got: {actual}',
                
                // SQL Editor
                'sql.placeholder': 'Enter your SQL query here...',
                'sql.execute': 'Execute Query',
                'sql.executing': 'Executing...',
                'sql.example_tables': 'List Tables',
                
                // Results
                'results.placeholder': 'Execution results will appear here...',
                'results.success_no_data': 'Query executed successfully. No results found.',
                'results.success_with_count': 'Query executed successfully. Records found: ',
                'results.success': 'Query executed successfully.',
                
                // Schema
                'schema.tables_title': 'Tables in database:',
                'schema.records_count': 'Records: ',
                'schema.loading_error': 'Schema loading error: ',
                
                // Language switcher
                'lang.switch': 'Language',
                'lang.russian': 'Русский',
                'lang.english': 'English'
            },
            ru: {
                // Header texts
                'header.title': 'Браузерный SQL тренажер',
                'header.subtitle': 'Тренажер для изучения SQL: выполнение запросов, проверка результатов, схема базы данных',
                
                // Loading messages
                'loading.sqlite': 'Загрузка SQLite WebAssembly...',
                'loading.module': 'Загрузка SQLite WebAssembly модуля...',
                'loading.database': 'Создание базы данных...',
                'loading.tasks': 'Загрузка задач...',
                
                // Error messages
                'error.loading': 'Ошибка загрузки SQLite: ',
                'error.causes': 'Возможные причины:',
                'error.no_internet': '• Нет подключения к интернету',
                'error.blocked_access': '• Заблокирован доступ к sql.js.org',
                'error.try_refresh': '• Попробуйте обновить страницу',
                'error.tasks_loading': 'Ошибка загрузки задач: ',
                'error.no_tasks': 'Нет доступных задач',
                'error.task_loading': 'Ошибка загрузки задачи: ',
                'error.db_init': 'Ошибка инициализации базы данных для задачи: ',
                'error.schema_update': 'Ошибка обновления схемы: ',
                'error.sql_execution': 'Ошибка SQL: ',
                'error.enter_sql': 'Введите SQL запрос',
                'error.sqlite_loading': 'SQLite WebAssembly еще загружается...',
                'error.db_not_initialized': 'База данных не инициализирована',
                'error.result_check': 'Ошибка при проверке результата: ',
                'error.db_not_ready': 'База данных не готова',
                'error.tables_not_found': 'Таблицы не найдены',
                'error.count_error': 'Не удалось получить количество записей',
                
                // Section headers
                'section.current_task': '🎯 Текущая задача',
                'section.database_schema': '📋 Схема базы данных',
                'section.sql_editor': '💻 SQL редактор',
                'section.results': '📊 Результаты',
                
                // Task interface
                'task.next_task': 'Следующая задача',
                'task.hint_label': 'Подсказка:',
                'task.show_hint': 'Показать подсказку',
                'task.hide_hint': 'Скрыть подсказку',
                'task.correct': 'Отлично! Задача решена верно!',
                'task.wrong_rows': 'Неверное количество строк. Ожидается: {expected}, получено: {actual}',
                'task.wrong_value': 'Неверное значение в строке {row}, поле "{field}". Ожидается: {expected}, получено: {actual}',
                
                // SQL Editor
                'sql.placeholder': 'Введите ваш SQL запрос здесь...',
                'sql.execute': 'Выполнить запрос',
                'sql.executing': 'Выполняется...',
                'sql.example_tables': 'Список таблиц',
                
                // Results
                'results.placeholder': 'Результаты выполнения появятся здесь...',
                'results.success_no_data': 'Запрос выполнен успешно. Результатов не найдено.',
                'results.success_with_count': 'Запрос выполнен успешно. Найдено записей: ',
                'results.success': 'Запрос выполнен успешно.',
                
                // Schema
                'schema.tables_title': 'Таблицы в базе данных:',
                'schema.records_count': 'Записей: ',
                'schema.loading_error': 'Ошибка загрузки схемы: ',
                
                // Language switcher
                'lang.switch': 'Язык',
                'lang.russian': 'Русский',
                'lang.english': 'English'
            }
        };
        
        // Загружаем сохраненный язык или используем английский по умолчанию
        this.loadLanguage();
        
        // Устанавливаем атрибут lang при инициализации, если DOM уже загружен
        if (document.documentElement) {
            document.documentElement.setAttribute('lang', this.currentLanguage);
        } else {
            // Если DOM еще не загружен, добавляем обработчик
            document.addEventListener('DOMContentLoaded', () => {
                document.documentElement.setAttribute('lang', this.currentLanguage);
            });
        }
    }
    
    // Получить перевод для ключа
    t(key, params = {}) {
        let translation = this.translations[this.currentLanguage][key] || this.translations['en'][key] || key;
        
        // Заменяем параметры в строке
        Object.keys(params).forEach(param => {
            translation = translation.replace(`{${param}}`, params[param]);
        });
        
        return translation;
    }
    
    // Установить язык
    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
            this.saveLanguage();
            
            // Обновляем атрибут lang в HTML элементе
            document.documentElement.setAttribute('lang', lang);
            
            this.updateUI();
        }
    }
    
    // Получить текущий язык
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    
    // Сохранить язык в localStorage
    saveLanguage() {
        localStorage.setItem('sqltrainer-language', this.currentLanguage);
    }
    
    // Загрузить язык из localStorage
    loadLanguage() {
        const saved = localStorage.getItem('sqltrainer-language');
        if (saved && this.translations[saved]) {
            this.currentLanguage = saved;
        }
    }
    
    // Обновить весь интерфейс
    updateUI() {
        // Обновляем статические элементы
        this.updateStaticElements();
        
        // Обновляем динамические элементы, если они существуют
        if (typeof updateSchema === 'function') {
            updateSchema();
        }
        
        if (typeof displayTask === 'function' && typeof currentTask !== 'undefined' && currentTask) {
            displayTask();
        }
    }
    
    // Обновить статические элементы интерфейса
    updateStaticElements() {
        // Обновляем все элементы с data-i18n атрибутом
        const i18nElements = document.querySelectorAll('[data-i18n]');
        i18nElements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = this.t(key);
        });
        
        // Обновляем placeholder для элементов с data-i18n-placeholder
        const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
        placeholderElements.forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });
        
        // Кнопка выполнения - особый случай для состояния disabled
        const executeBtn = document.getElementById('execute-btn');
        if (executeBtn && !executeBtn.disabled) {
            executeBtn.textContent = this.t('sql.execute');
        }
        
        // Результаты по умолчанию - проверяем содержимое
        const resultsContainer = document.getElementById('results-container');
        if (resultsContainer && (
            resultsContainer.innerHTML.includes('Результаты выполнения появятся здесь') || 
            resultsContainer.innerHTML.includes('Execution results will appear here'))) {
            resultsContainer.innerHTML = `<p data-i18n="results.placeholder">${this.t('results.placeholder')}</p>`;
        }
    }
}

// Создаем глобальный экземпляр i18n
const i18n = new I18n();