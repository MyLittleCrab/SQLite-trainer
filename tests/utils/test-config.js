const puppeteer = require('puppeteer');

// Конфигурация / Configuration
const PORT = 8000;
const BASE_URL = `http://localhost:${PORT}`;

// Функция ожидания готовности сервера / Server readiness waiting function
async function waitForServer(maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const response = await fetch(BASE_URL);
            if (response.ok) {
                console.log(`🌍 Сервер готов на ${BASE_URL}`);
                return true;
            }
        } catch (error) {
            // Сервер еще не готов, ждем / Server not ready yet, waiting
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('Сервер не отвечает после 30 секунд ожидания');
}

// Утилиты для тестирования / Testing utilities
class TestRunner {
    constructor() {
        this.passed = 0;
        this.failed = 0;
    }

    async assert(condition, message) {
        if (condition) {
            console.log(`✅ ${message}`);
            this.passed++;
        } else {
            console.log(`❌ ${message}`);
            this.failed++;
        }
    }

    async assertContains(text, substring, message) {
        await this.assert(text.includes(substring), 
            `${message} (текст должен содержать: "${substring}")`);
    }

    summary() {
        console.log(`\n📊 Результаты Puppeteer тестов:`);
        console.log(`✅ Пройдено: ${this.passed}`);
        console.log(`❌ Провалено: ${this.failed}`);
        console.log(`📈 Общий результат: ${this.passed}/${this.passed + this.failed}`);
        return this.failed === 0;
    }
}

// Базовый класс для всех тестов
class BaseTest {
    constructor(page, runner) {
        this.page = page;
        this.runner = runner;
    }
}

module.exports = {
    PORT,
    BASE_URL,
    waitForServer,
    TestRunner,
    BaseTest,
    puppeteer
};