const puppeteer = require('puppeteer');

class BaseTestRunner {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }

    async init() {
        console.log('🌍 Сервер готов на http://localhost:8000');
        console.log('🌐 Запуск Chromium...');
        
        this.browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        
        // Настройка viewport
        await this.page.setViewport({ width: 1280, height: 720 });
        
        // Обработка ошибок в консоли
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('🔴 Browser Error:', msg.text());
            }
        });
        
        // Переход на страницу
        await this.page.goto('http://localhost:8000/index.html', { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });
        
        // Ожидание загрузки i18n системы
        await this.page.waitForFunction(() => {
            return window.i18n && typeof window.i18n.t === 'function';
        }, { timeout: 10000 });
        
        // Ожидание загрузки SQLite и инициализации приложения (опционально)
        try {
            await this.page.waitForFunction(() => {
                return window.db && typeof window.db.exec === 'function';
            }, { timeout: 10000 });
        } catch (error) {
            console.log('⚠️ SQLite инициализация займет больше времени, продолжаем тесты...');
        }
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('🔒 Браузер закрыт');
        }
    }

    // Метод для ожидания готовности сервера
    static async waitForServer(timeout = 30000) {
        const http = require('http');
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            try {
                await new Promise((resolve, reject) => {
                    const req = http.get('http://localhost:8000', (res) => {
                        resolve(res.statusCode === 200);
                    });
                    req.on('error', reject);
                    req.setTimeout(1000, () => req.destroy());
                });
                return true;
            } catch (error) {
                // Сервер еще не готов
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        throw new Error('Сервер не запустился в течение заданного времени');
    }

    // Методы для отчетности
    pass(message) {
        this.testResults.passed++;
        this.testResults.total++;
        console.log(`✅ ${message}`);
    }

    fail(message) {
        this.testResults.failed++;
        this.testResults.total++;
        console.log(`❌ ${message}`);
    }

    info(message) {
        console.log(`ℹ️ ${message}`);
    }

    warn(message) {
        console.log(`⚠️ ${message}`);
    }

    summary() {
        console.log('\n📊 Результаты Puppeteer тестов:');
        console.log(`✅ Пройдено: ${this.testResults.passed}`);
        console.log(`❌ Провалено: ${this.testResults.failed}`);
        console.log(`📈 Общий результат: ${this.testResults.passed}/${this.testResults.total}`);
        
        return this.testResults.failed === 0;
    }

    // Абстрактный метод для запуска всех тестов
    async runAllTests() {
        throw new Error('Метод runAllTests должен быть реализован в дочернем классе');
    }
}

module.exports = BaseTestRunner;