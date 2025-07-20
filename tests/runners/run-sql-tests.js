const BaseTestRunner = require('../base-test-runner');
const SQLFunctionsTests = require('../sql-functions-tests');

async function runSQLTests() {
    console.log('🔧 Запуск тестов SQL функций...\n');
    
    await BaseTestRunner.waitForServer();
    
    const sqlTests = new SQLFunctionsTests();
    
    try {
        await sqlTests.init();
        const success = await sqlTests.runAllTests();
        await sqlTests.cleanup();
        
        process.exit(success ? 0 : 1);
    } catch (error) {
        console.error('❌ Критическая ошибка при выполнении SQL тестов:', error);
        await sqlTests.cleanup();
        process.exit(1);
    }
}

runSQLTests();