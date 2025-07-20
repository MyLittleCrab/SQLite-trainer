const BaseTestRunner = require('./base-test-runner');
const UIBasicTests = require('./ui-basic-tests');
// TODO: Добавить остальные классы тестов после их рефакторинга
// const I18nTests = require('./i18n-tests');
// const TaskSystemTests = require('./task-system-tests');
// const SQLFunctionsTests = require('./sql-functions-tests');

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
    
    // TODO: Добавить остальные тесты
    // Пример для I18n:
    // const i18nTests = new I18nTests();
    // try {
    //     await i18nTests.init();
    //     const i18nSuccess = await i18nTests.runAllTests();
    //     totalPassed += i18nTests.testResults.passed;
    //     totalFailed += i18nTests.testResults.failed;
    //     await i18nTests.cleanup();
    // } catch (error) {
    //     console.error('❌ Критическая ошибка в I18n тестах:', error);
    //     totalFailed += 1;
    //     await i18nTests.cleanup();
    // }
    
    // Итоговый отчет
    console.log('\n📊 Результаты Puppeteer тестов:');
    console.log(`✅ Пройдено: ${totalPassed}`);
    console.log(`❌ Провалено: ${totalFailed}`);
    console.log(`📈 Общий результат: ${totalPassed}/${totalPassed + totalFailed}`);
    
    const success = totalFailed === 0;
    process.exit(success ? 0 : 1);
}

runAllTests();