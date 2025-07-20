// Тесты для системы интернационализации
class I18nTester {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }
    
    // Добавить тест
    addTest(name, testFn) {
        this.tests.push({ name, testFn });
    }
    
    // Запустить все тесты
    async runAllTests() {
        console.log('🧪 Запуск тестов i18n...\n');
        
        for (const test of this.tests) {
            try {
                await test.testFn();
                this.passed++;
                console.log(`✅ ${test.name}`);
            } catch (error) {
                this.failed++;
                console.error(`❌ ${test.name}:`);
                console.error(`   ${error.message}`);
            }
        }
        
        console.log(`\n📊 Результаты тестов:`);
        console.log(`   Пройдено: ${this.passed}`);
        console.log(`   Провалено: ${this.failed}`);
        console.log(`   Всего: ${this.tests.length}`);
        
        if (this.failed === 0) {
            console.log('🎉 Все тесты прошли успешно!');
        } else {
            console.log('⚠️  Некоторые тесты провалились');
        }
        
        return this.failed === 0;
    }
    
    // Утилиты для тестов
    assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }
    
    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(`${message || 'Assertion failed'}: expected "${expected}", got "${actual}"`);
        }
    }
    
    assertNotEmpty(value, message) {
        if (!value || value.length === 0) {
            throw new Error(message || 'Expected non-empty value');
        }
    }
    
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Создаем экземпляр тестера
const tester = new I18nTester();

// Тест загрузки переводов
tester.addTest('Загрузка английских переводов', async () => {
    const i18nInstance = new I18n();
    await i18nInstance.loadTranslations('en');
    
    tester.assert(i18nInstance.translations['en'], 'Английские переводы должны быть загружены');
    tester.assertNotEmpty(Object.keys(i18nInstance.translations['en']), 'Английские переводы не должны быть пустыми');
});

tester.addTest('Загрузка русских переводов', async () => {
    const i18nInstance = new I18n();
    await i18nInstance.loadTranslations('ru');
    
    tester.assert(i18nInstance.translations['ru'], 'Русские переводы должны быть загружены');
    tester.assertNotEmpty(Object.keys(i18nInstance.translations['ru']), 'Русские переводы не должны быть пустыми');
});

// Тест преобразования вложенной структуры
tester.addTest('Преобразование вложенной структуры в плоскую', () => {
    const i18nInstance = new I18n();
    const nested = {
        header: {
            title: 'Test Title',
            subtitle: 'Test Subtitle'
        },
        error: {
            loading: 'Loading Error'
        }
    };
    
    const flattened = i18nInstance.flattenTranslations(nested);
    
    tester.assertEqual(flattened['header.title'], 'Test Title', 'header.title должен быть правильно преобразован');
    tester.assertEqual(flattened['header.subtitle'], 'Test Subtitle', 'header.subtitle должен быть правильно преобразован');
    tester.assertEqual(flattened['error.loading'], 'Loading Error', 'error.loading должен быть правильно преобразован');
});

// Тест получения переводов
tester.addTest('Получение английских переводов', async () => {
    const i18nInstance = new I18n();
    await i18nInstance.loadTranslations('en');
    
    const title = i18nInstance.t('header.title');
    tester.assertEqual(title, 'Browser SQL Trainer', 'Заголовок должен быть на английском');
    
    const subtitle = i18nInstance.t('header.subtitle');
    tester.assertNotEmpty(subtitle, 'Подзаголовок не должен быть пустым');
});

tester.addTest('Получение русских переводов', async () => {
    const i18nInstance = new I18n();
    await i18nInstance.setLanguage('ru');
    
    const title = i18nInstance.t('header.title');
    tester.assertEqual(title, 'Браузерный SQL тренажер', 'Заголовок должен быть на русском');
    
    const subtitle = i18nInstance.t('header.subtitle');
    tester.assertNotEmpty(subtitle, 'Подзаголовок не должен быть пустым');
});

// Тест параметризованных переводов
tester.addTest('Параметризованные переводы', async () => {
    const i18nInstance = new I18n();
    await i18nInstance.loadTranslations('en');
    
    const message = i18nInstance.t('task.wrong_rows', { expected: 5, actual: 3 });
    tester.assert(message.includes('5'), 'Сообщение должно содержать ожидаемое значение');
    tester.assert(message.includes('3'), 'Сообщение должно содержать фактическое значение');
});

// Тест переключения языка
tester.addTest('Переключение языка', async () => {
    const i18nInstance = new I18n();
    
    // Начинаем с английского
    await i18nInstance.setLanguage('en');
    let title = i18nInstance.t('header.title');
    tester.assertEqual(title, 'Browser SQL Trainer', 'Должен быть английский заголовок');
    
    // Переключаемся на русский
    await i18nInstance.setLanguage('ru');
    title = i18nInstance.t('header.title');
    tester.assertEqual(title, 'Браузерный SQL тренажер', 'Должен быть русский заголовок');
});

// Тест получения текущего языка
tester.addTest('Получение текущего языка', async () => {
    const i18nInstance = new I18n();
    
    await i18nInstance.setLanguage('ru');
    tester.assertEqual(i18nInstance.getCurrentLanguage(), 'ru', 'Текущий язык должен быть русский');
    
    await i18nInstance.setLanguage('en');
    tester.assertEqual(i18nInstance.getCurrentLanguage(), 'en', 'Текущий язык должен быть английский');
});

// Тест обработки несуществующих ключей
tester.addTest('Обработка несуществующих ключей', async () => {
    const i18nInstance = new I18n();
    await i18nInstance.loadTranslations('en');
    
    const nonExistent = i18nInstance.t('non.existent.key');
    tester.assertEqual(nonExistent, 'non.existent.key', 'Несуществующий ключ должен возвращать сам ключ');
});

// Тест сравнения языков
tester.addTest('Сравнение количества ключей в языках', async () => {
    const i18nInstance = new I18n();
    await i18nInstance.loadTranslations('en');
    await i18nInstance.loadTranslations('ru');
    
    const enKeys = Object.keys(i18nInstance.translations['en']);
    const ruKeys = Object.keys(i18nInstance.translations['ru']);
    
    tester.assertEqual(enKeys.length, ruKeys.length, 'Количество ключей в английском и русском языках должно совпадать');
    
    // Проверяем, что все ключи из английского есть в русском
    for (const key of enKeys) {
        tester.assert(ruKeys.includes(key), `Ключ "${key}" должен присутствовать в русском языке`);
    }
});

// Тест важных ключей
tester.addTest('Проверка важных ключей переводов', async () => {
    const i18nInstance = new I18n();
    await i18nInstance.loadTranslations('en');
    await i18nInstance.loadTranslations('ru');
    
    const importantKeys = [
        'header.title',
        'header.subtitle',
        'section.current_task',
        'section.database_schema',
        'section.sql_editor',
        'section.results',
        'sql.execute',
        'task.correct',
        'lang.switch',
        'lang.english',
        'lang.russian'
    ];
    
    for (const key of importantKeys) {
        const enValue = i18nInstance.translations['en'][key];
        const ruValue = i18nInstance.translations['ru'][key];
        
        tester.assertNotEmpty(enValue, `Английский перевод для "${key}" не должен быть пустым`);
        tester.assertNotEmpty(ruValue, `Русский перевод для "${key}" не должен быть пустым`);
    }
});

// Экспортируем тестер для использования
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { I18nTester, tester };
}