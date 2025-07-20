const BaseTestRunner = require('../base-test-runner');
const AccessibilityTests = require('../accessibility-tests');

async function runAccessibilityTests() {
    console.log('♿ Запуск тестов доступности...\n');
    
    await BaseTestRunner.waitForServer();
    
    const accessTests = new AccessibilityTests();
    
    try {
        await accessTests.init();
        const success = await accessTests.runAllTests();
        await accessTests.cleanup();
        
        process.exit(success ? 0 : 1);
    } catch (error) {
        console.error('❌ Критическая ошибка при выполнении тестов доступности:', error);
        await accessTests.cleanup();
        process.exit(1);
    }
}

runAccessibilityTests();