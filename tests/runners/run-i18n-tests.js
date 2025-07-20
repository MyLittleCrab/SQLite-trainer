const BaseTestRunner = require('../base-test-runner');
const I18nTests = require('../i18n-tests');

async function runI18nTests() {
    console.log('🌍 Запуск тестов интернационализации...\n');
    
    await BaseTestRunner.waitForServer();
    
    const i18nTests = new I18nTests();
    
    try {
        await i18nTests.init();
        const success = await i18nTests.runAllTests();
        await i18nTests.cleanup();
        
        process.exit(success ? 0 : 1);
    } catch (error) {
        console.error('❌ Критическая ошибка при выполнении i18n тестов:', error);
        await i18nTests.cleanup();
        process.exit(1);
    }
}

runI18nTests();