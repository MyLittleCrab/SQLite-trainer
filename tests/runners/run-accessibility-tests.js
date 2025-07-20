const { waitForServer, TestRunner, puppeteer } = require('../utils/test-config');
const AccessibilityTests = require('../accessibility-tests');

async function runAccessibilityTests() {
    console.log('♿ Запуск тестов доступности...\n');
    
    try {
        await waitForServer(3);
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        const runner = new TestRunner();
        
        const a11yTests = new AccessibilityTests(page, runner);
        
        // Загрузка страницы
        await page.goto('http://localhost:8000/index.html', { waitUntil: 'networkidle0' });
        
        // Запуск всех тестов доступности
        await a11yTests.testKeyboardNavigation();
        await a11yTests.testAriaLabels();
        await a11yTests.testColorContrast();
        await a11yTests.testScreenReaderCompatibility();
        await a11yTests.testFormAccessibility();
        await a11yTests.testFocusManagement();
        
        await browser.close();
        const success = runner.summary();
        process.exit(success ? 0 : 1);
        
    } catch (error) {
        console.error('❌ Критическая ошибка при выполнении тестов доступности:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    runAccessibilityTests();
}

module.exports = runAccessibilityTests;