const { waitForServer, TestRunner, puppeteer } = require('../utils/test-config');
const I18nTests = require('../i18n-tests');

async function runI18nTests() {
    console.log('🌍 Запуск тестов интернационализации...\n');
    
    try {
        await waitForServer(3);
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        const runner = new TestRunner();
        
        const i18nTests = new I18nTests(page, runner);
        
        // Загрузка страницы
        await page.goto('http://localhost:8000/index.html', { waitUntil: 'networkidle0' });
        
        // Запуск всех i18n тестов
        await i18nTests.testI18nSystem();
        await i18nTests.testLanguageSwitching();
        await i18nTests.testTranslationFileLoading();
        
        await browser.close();
        const success = runner.summary();
        process.exit(success ? 0 : 1);
        
    } catch (error) {
        console.error('❌ Критическая ошибка при выполнении i18n тестов:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    runI18nTests();
}

module.exports = runI18nTests;