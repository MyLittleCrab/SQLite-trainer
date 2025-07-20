#!/usr/bin/env node

// Простой Node.js скрипт для запуска тестов i18n
const http = require('http');
const fs = require('fs');
const path = require('path');

// Мокируем DOM элементы для Node.js среды
global.document = {
    documentElement: {
        setAttribute: () => {}
    },
    addEventListener: () => {},
    getElementById: () => null,
    querySelectorAll: () => []
};

global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
};

global.fetch = async (url) => {
    return new Promise((resolve, reject) => {
        // Преобразуем относительный URL в абсолютный путь к файлу
        let filePath;
        if (url.startsWith('./i18n/')) {
            filePath = path.join(__dirname, '../../', url.substring(2));
        } else {
            filePath = path.join(__dirname, '../../', url);
        }
        
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(new Error(`File not found: ${filePath}`));
                return;
            }
            
            resolve({
                ok: true,
                json: () => Promise.resolve(JSON.parse(data))
            });
        });
    });
};

// Создаем контекст выполнения
const context = {
    console,
    document: global.document,
    localStorage: global.localStorage,
    fetch: global.fetch,
    setTimeout: global.setTimeout,
    Promise: global.Promise,
    Error: global.Error,
    Object: global.Object
};

// Функция для выполнения кода в контексте
function executeInContext(code, contextObj) {
    const keys = Object.keys(contextObj);
    const values = keys.map(key => contextObj[key]);
    const func = new Function(...keys, code);
    return func.apply(null, values);
}

// Загружаем и выполняем i18n.js
const i18nPath = path.join(__dirname, '../../i18n.js');
const i18nCode = fs.readFileSync(i18nPath, 'utf8');
executeInContext(i18nCode, context);

// Загружаем и выполняем тесты
const testPath = path.join(__dirname, 'i18n-test.js');
const testCode = fs.readFileSync(testPath, 'utf8');
const testResult = executeInContext(testCode + '; return { I18n, i18n, tester };', context);

// Извлекаем объекты из результата
const { I18n, i18n, tester } = testResult;

// Запускаем тесты
async function runTests() {
    console.log('🚀 Запуск тестов i18n в Node.js окружении...\n');
    
    try {
        const success = await tester.runAllTests();
        
        if (success) {
            console.log('\n✅ Все тесты прошли успешно!');
            process.exit(0);
        } else {
            console.log('\n❌ Некоторые тесты провалились');
            process.exit(1);
        }
    } catch (error) {
        console.error('\n💥 Критическая ошибка при запуске тестов:', error.message);
        process.exit(1);
    }
}

// Запускаем тесты
runTests();