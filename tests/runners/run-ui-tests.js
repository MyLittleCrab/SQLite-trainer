const BaseTestRunner = require('../base-test-runner');
const UIBasicTests = require('../ui-basic-tests');

async function runUITests() {
    console.log('🎯 Запуск UI тестов...\n');
    
    await BaseTestRunner.waitForServer();
    
    const uiTests = new UIBasicTests();
    
    try {
        await uiTests.init();
        const success = await uiTests.runAllTests();
        await uiTests.cleanup();
        
        process.exit(success ? 0 : 1);
    } catch (error) {
        console.error('❌ Критическая ошибка при выполнении UI тестов:', error);
        await uiTests.cleanup();
        process.exit(1);
    }
}

runUITests();