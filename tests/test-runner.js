// Простой Test Runner для SQLite WebAssembly тестов

class TestRunner {
    constructor() {
        this.tests = [];
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: []
        };
    }

    // Добавление теста
    addTest(name, testFn, category = 'unit') {
        this.tests.push({
            name,
            testFn,
            category,
            status: 'pending'
        });
    }

    // Запуск всех тестов
    async runAll() {
        this.clearResults();
        await this.runTests(this.tests);
        this.displaySummary();
    }

    // Запуск тестов по категории
    async runByCategory(category) {
        this.clearResults();
        const categoryTests = this.tests.filter(test => test.category === category);
        await this.runTests(categoryTests);
        this.displaySummary();
    }

    // Запуск конкретного набора тестов
    async runTests(testsToRun) {
        this.results.total = testsToRun.length;
        
        const resultsDiv = document.getElementById('test-results');
        
        for (const test of testsToRun) {
            const testDiv = this.createTestDiv(test);
            resultsDiv.appendChild(testDiv);
            
            try {
                this.updateTestStatus(testDiv, 'running', 'Выполняется...');
                
                // Запускаем тест
                await test.testFn();
                
                this.updateTestStatus(testDiv, 'pass', 'PASSED');
                this.results.passed++;
                
            } catch (error) {
                this.updateTestStatus(testDiv, 'fail', `FAILED: ${error.message}`);
                this.results.failed++;
                this.results.errors.push({
                    test: test.name,
                    error: error.message,
                    stack: error.stack
                });
                
                // Добавляем детали ошибки
                const errorDetails = document.createElement('pre');
                errorDetails.textContent = error.stack || error.message;
                testDiv.appendChild(errorDetails);
            }
            
            // Небольшая задержка между тестами для лучшей видимости
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    // Создание div для теста
    createTestDiv(test) {
        const testDiv = document.createElement('div');
        testDiv.className = 'test-case test-running';
        testDiv.innerHTML = `
            <strong>${test.name}</strong>
            <span class="status">Ожидание...</span>
        `;
        return testDiv;
    }

    // Обновление статуса теста
    updateTestStatus(testDiv, status, message) {
        testDiv.className = `test-case test-${status}`;
        const statusSpan = testDiv.querySelector('.status');
        statusSpan.textContent = message;
    }

    // Отображение итоговой сводки
    displaySummary() {
        const summaryDiv = document.getElementById('summary');
        const passRate = this.results.total > 0 ? 
            Math.round((this.results.passed / this.results.total) * 100) : 0;
        
        summaryDiv.innerHTML = `
            <div>📊 Результаты тестирования:</div>
            <div>Всего тестов: ${this.results.total}</div>
            <div style="color: green;">✅ Прошло: ${this.results.passed}</div>
            <div style="color: red;">❌ Не прошло: ${this.results.failed}</div>
            <div>📈 Процент успеха: ${passRate}%</div>
        `;
        
        if (this.results.failed > 0) {
            summaryDiv.innerHTML += `<div style="color: red; margin-top: 10px;">⚠️ Есть проваленные тесты!</div>`;
        } else if (this.results.total > 0) {
            summaryDiv.innerHTML += `<div style="color: green; margin-top: 10px;">🎉 Все тесты прошли успешно!</div>`;
        }
    }

    // Очистка результатов
    clearResults() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: []
        };
        
        const resultsDiv = document.getElementById('test-results');
        resultsDiv.innerHTML = '';
        
        const summaryDiv = document.getElementById('summary');
        summaryDiv.innerHTML = 'Подготовка к запуску тестов...';
    }
}

// Создаем глобальный экземпляр test runner
const testRunner = new TestRunner();

// Вспомогательные функции для тестов
function assert(condition, message = 'Assertion failed') {
    if (!condition) {
        throw new Error(message);
    }
}

function assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
        throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
    }
}

function assertNotEqual(actual, notExpected, message = '') {
    if (actual === notExpected) {
        throw new Error(`${message}\nExpected NOT to be: ${notExpected}\nActual: ${actual}`);
    }
}

function assertThrows(fn, message = 'Expected function to throw') {
    try {
        fn();
        throw new Error(message);
    } catch (error) {
        // Ожидаемое поведение
    }
}

function assertArraysEqual(actual, expected, message = '') {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
    }
}

// Функции для запуска тестов (вызываются из HTML)
async function runAllTests() {
    await testRunner.runAll();
}

async function runUnitTests() {
    await testRunner.runByCategory('unit');
}

async function runIntegrationTests() {
    await testRunner.runByCategory('integration');
}

function clearResults() {
    testRunner.clearResults();
}