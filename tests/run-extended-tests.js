const { waitForServer, TestRunner, puppeteer } = require('./utils/test-config');
const UIBasicTests = require('./ui-basic-tests');
const I18nTests = require('./i18n-tests');
const TaskSystemTests = require('./task-system-tests');
const SQLFunctionTests = require('./sql-function-tests');
const PerformanceTests = require('./performance-tests');
const AccessibilityTests = require('./accessibility-tests');

// Расширенная функция запуска всех тестов (включая примеры)
async function runExtendedTests() {
    let browser = null;
    const runner = new TestRunner();

    try {
        // Ждем готовности сервера / Wait for server readiness
        await waitForServer();
        
        // Запускаем браузер / Launch browser
        console.log('🌐 Запуск Chromium...');
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--allow-running-insecure-content'
            ]
        });

        const page = await browser.newPage();
        
        // Включаем консольные логи / Enable console logs
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`🔴 Browser Error: ${msg.text()}`);
            }
        });

        // Создаем экземпляры всех тестовых классов
        const uiTests = new UIBasicTests(page, runner);
        const i18nTests = new I18nTests(page, runner);
        const taskTests = new TaskSystemTests(page, runner);
        const sqlTests = new SQLFunctionTests(page, runner);
        const performanceTests = new PerformanceTests(page, runner);
        const accessibilityTests = new AccessibilityTests(page, runner);

        console.log('\n🎯 === БАЗОВЫЕ ТЕСТЫ UI === 🎯');
        await uiTests.testPageLoad();
        await uiTests.testUIElements();
        await uiTests.testSQLiteInitialization();
        await uiTests.testSchemaDisplay();
        await uiTests.testExampleQueries();
        await uiTests.testErrorHandling();
        await uiTests.testResponsiveDesign();

        console.log('\n🌍 === ТЕСТЫ ИНТЕРНАЦИОНАЛИЗАЦИИ === 🌍');
        await i18nTests.testI18nSystem();
        await i18nTests.testLanguageSwitching();

        console.log('\n📝 === ТЕСТЫ СИСТЕМЫ ЗАДАЧ === 📝');
        const { taskTitle } = await taskTests.testTaskSystem();
        await taskTests.testTaskTextFieldsLocalization();
        await taskTests.testTaskExecution(taskTitle);
        await taskTests.testTaskSwitch(taskTitle);

        console.log('\n🔧 === ТЕСТЫ SQL ФУНКЦИЙ === 🔧');
        await sqlTests.testExecuteTestSQL();
        await sqlTests.testCheckSolutionSQL();
        await sqlTests.testExecuteTestButton();
        await sqlTests.testCheckSolutionButton();

        console.log('\n⚡ === ТЕСТЫ ПРОИЗВОДИТЕЛЬНОСТИ === ⚡');
        await performanceTests.testPageLoadSpeed();
        await performanceTests.testSQLiteInitSpeed();
        await performanceTests.testQueryExecutionSpeed();
        await performanceTests.testMemoryUsage();
        await performanceTests.testResponseTimes();

        console.log('\n♿ === ТЕСТЫ ДОСТУПНОСТИ === ♿');
        await accessibilityTests.testKeyboardNavigation();
        await accessibilityTests.testAriaLabels();
        await accessibilityTests.testColorContrast();
        await accessibilityTests.testScreenReaderCompatibility();
        await accessibilityTests.testFormAccessibility();
        await accessibilityTests.testFocusManagement();

        console.log('\n🏗️ === ДОПОЛНИТЕЛЬНЫЕ ТЕСТЫ === 🏗️');
        await uiTests.testInsertQuery();

    } catch (error) {
        console.error('❌ Критическая ошибка при выполнении тестов:', error);
        await runner.assert(false, `Критическая ошибка: ${error.message}`);
    } finally {
        // Закрываем браузер / Close browser
        if (browser) {
            await browser.close();
            console.log('🔒 Браузер закрыт');
        }
    }

    return runner.summary();
}

// Запуск тестов / Run tests
console.log('🚀 Запуск расширенного набора Puppeteer тестов для SQLite WebAssembly Playground\n');
console.log('📊 Включены: UI, i18n, задачи, SQL функции, производительность, доступность\n');

runExtendedTests().then(success => {
    process.exit(success ? 0 : 1);
});