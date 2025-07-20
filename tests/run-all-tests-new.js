const BaseTestRunner = require('./base-test-runner');
const UIBasicTests = require('./ui-basic-tests');
const I18nTests = require('./i18n-tests');
const TaskSystemTests = require('./task-system-tests');
const SQLFunctionsTests = require('./sql-functions-tests');
const PerformanceTests = require('./performance-tests');
const AccessibilityTests = require('./accessibility-tests');

async function runAllTests() {
    console.log('🚀 Запуск Puppeteer тестов для SQLite WebAssembly Playground\n');
    
    // Ожидание готовности сервера
    await BaseTestRunner.waitForServer();
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    // Запуск UI тестов
    const uiTests = new UIBasicTests();
    try {
        await uiTests.init();
        const uiSuccess = await uiTests.runAllTests();
        totalPassed += uiTests.testResults.passed;
        totalFailed += uiTests.testResults.failed;
        await uiTests.cleanup();
    } catch (error) {
        console.error('❌ Критическая ошибка в UI тестах:', error);
        totalFailed += 1;
        await uiTests.cleanup();
    }
    
    // Запуск i18n тестов
    const i18nTests = new I18nTests();
    try {
        await i18nTests.init();
        await i18nTests.runAllTests();
        totalPassed += i18nTests.testResults.passed;
        totalFailed += i18nTests.testResults.failed;
        await i18nTests.cleanup();
    } catch (error) {
        console.error('❌ Критическая ошибка в I18n тестах:', error);
        totalFailed += 1;
        await i18nTests.cleanup();
    }
    
    // Запуск тестов системы задач
    const taskTests = new TaskSystemTests();
    try {
        await taskTests.init();
        await taskTests.runAllTests();
        totalPassed += taskTests.testResults.passed;
        totalFailed += taskTests.testResults.failed;
        await taskTests.cleanup();
    } catch (error) {
        console.error('❌ Критическая ошибка в тестах задач:', error);
        totalFailed += 1;
        await taskTests.cleanup();
    }
    
    // Запуск SQL тестов
    const sqlTests = new SQLFunctionsTests();
    try {
        await sqlTests.init();
        await sqlTests.runAllTests();
        totalPassed += sqlTests.testResults.passed;
        totalFailed += sqlTests.testResults.failed;
        await sqlTests.cleanup();
    } catch (error) {
        console.error('❌ Критическая ошибка в SQL тестах:', error);
        totalFailed += 1;
        await sqlTests.cleanup();
    }
    
    // Запуск тестов производительности
    const perfTests = new PerformanceTests();
    try {
        await perfTests.init();
        await perfTests.runAllTests();
        totalPassed += perfTests.testResults.passed;
        totalFailed += perfTests.testResults.failed;
        await perfTests.cleanup();
    } catch (error) {
        console.error('❌ Критическая ошибка в тестах производительности:', error);
        totalFailed += 1;
        await perfTests.cleanup();
    }
    
    // Запуск тестов доступности
    const accessTests = new AccessibilityTests();
    try {
        await accessTests.init();
        await accessTests.runAllTests();
        totalPassed += accessTests.testResults.passed;
        totalFailed += accessTests.testResults.failed;
        await accessTests.cleanup();
    } catch (error) {
        console.error('❌ Критическая ошибка в тестах доступности:', error);
        totalFailed += 1;
        await accessTests.cleanup();
    }
    
    // Итоговый отчет
    console.log('\n📊 Результаты Puppeteer тестов:');
    console.log(`✅ Пройдено: ${totalPassed}`);
    console.log(`❌ Провалено: ${totalFailed}`);
    console.log(`📈 Общий результат: ${totalPassed}/${totalPassed + totalFailed}`);
    
    const success = totalFailed === 0;
    process.exit(success ? 0 : 1);
}

runAllTests();