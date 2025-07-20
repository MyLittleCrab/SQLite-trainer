// Простой скрипт для проверки файлов переводов
const fs = require('fs');
const path = require('path');

console.log('🧪 Простая проверка файлов i18n...\n');

async function runSimpleTests() {
    let passed = 0;
    let failed = 0;
    
    function test(name, testFn) {
        try {
            testFn();
            console.log(`✅ ${name}`);
            passed++;
        } catch (error) {
            console.error(`❌ ${name}: ${error.message}`);
            failed++;
        }
    }
    
    function assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }
    
    function assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(`${message}: expected "${expected}", got "${actual}"`);
        }
    }
    
    // Тест 1: Проверка существования файлов
    test('Проверка существования файлов переводов', () => {
        const enPath = path.join(__dirname, '../../i18n/i18nen.json');
        const ruPath = path.join(__dirname, '../../i18n/i18nru.json');
        
        assert(fs.existsSync(enPath), 'Файл английских переводов должен существовать');
        assert(fs.existsSync(ruPath), 'Файл русских переводов должен существовать');
    });
    
    // Тест 2: Проверка валидности JSON
    let enData, ruData;
    test('Проверка валидности JSON файлов', () => {
        const enPath = path.join(__dirname, '../../i18n/i18nen.json');
        const ruPath = path.join(__dirname, '../../i18n/i18nru.json');
        
        const enContent = fs.readFileSync(enPath, 'utf8');
        const ruContent = fs.readFileSync(ruPath, 'utf8');
        
        enData = JSON.parse(enContent);
        ruData = JSON.parse(ruContent);
        
        assert(typeof enData === 'object', 'Английские переводы должны быть объектом');
        assert(typeof ruData === 'object', 'Русские переводы должны быть объектом');
    });
    
    // Тест 3: Проверка структуры
    test('Проверка структуры переводов', () => {
        const requiredSections = ['header', 'loading', 'error', 'section', 'task', 'sql', 'results', 'schema', 'lang'];
        
        for (const section of requiredSections) {
            assert(enData[section], `Английские переводы должны содержать секцию "${section}"`);
            assert(ruData[section], `Русские переводы должны содержать секцию "${section}"`);
        }
    });
    
    // Тест 4: Проверка ключевых переводов
    test('Проверка ключевых переводов', () => {
        assertEqual(enData.header.title, 'Browser SQL Trainer', 'Английский заголовок');
        assertEqual(ruData.header.title, 'Браузерный SQL тренажер', 'Русский заголовок');
        assertEqual(enData.lang.english, 'English', 'Название английского языка');
        assertEqual(ruData.lang.russian, 'Русский', 'Название русского языка');
    });
    
    // Тест 5: Функция преобразования вложенных объектов
    test('Преобразование вложенной структуры', () => {
        function flattenTranslations(obj, prefix = '') {
            const flattened = {};
            
            for (const key in obj) {
                const newKey = prefix ? `${prefix}.${key}` : key;
                
                if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                    Object.assign(flattened, flattenTranslations(obj[key], newKey));
                } else {
                    flattened[newKey] = obj[key];
                }
            }
            
            return flattened;
        }
        
        const enFlat = flattenTranslations(enData);
        const ruFlat = flattenTranslations(ruData);
        
        assert(enFlat['header.title'], 'Английский плоский объект должен содержать header.title');
        assert(ruFlat['header.title'], 'Русский плоский объект должен содержать header.title');
        
        assertEqual(enFlat['header.title'], 'Browser SQL Trainer', 'Плоский английский заголовок');
        assertEqual(ruFlat['header.title'], 'Браузерный SQL тренажер', 'Плоский русский заголовок');
    });
    
    // Тест 6: Сравнение количества ключей
    test('Сравнение количества ключей между языками', () => {
        function countKeys(obj) {
            let count = 0;
            for (const key in obj) {
                if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                    count += countKeys(obj[key]);
                } else {
                    count++;
                }
            }
            return count;
        }
        
        const enCount = countKeys(enData);
        const ruCount = countKeys(ruData);
        
        assertEqual(enCount, ruCount, 'Количество ключей в английском и русском языках должно совпадать');
    });
    
    // Тест 7: Проверка параметризованных строк
    test('Проверка параметризованных строк', () => {
        const enWrongRows = enData.task.wrong_rows;
        const ruWrongRows = ruData.task.wrong_rows;
        
        assert(enWrongRows.includes('{expected}'), 'Английская строка должна содержать {expected}');
        assert(enWrongRows.includes('{actual}'), 'Английская строка должна содержать {actual}');
        assert(ruWrongRows.includes('{expected}'), 'Русская строка должна содержать {expected}');
        assert(ruWrongRows.includes('{actual}'), 'Русская строка должна содержать {actual}');
    });
    
    console.log(`\n📊 Результаты простых тестов:`);
    console.log(`   Пройдено: ${passed}`);
    console.log(`   Провалено: ${failed}`);
    console.log(`   Всего: ${passed + failed}`);
    
    if (failed === 0) {
        console.log('🎉 Все простые тесты прошли успешно!');
        return true;
    } else {
        console.log('⚠️  Некоторые тесты провалились');
        return false;
    }
}

// Запускаем тесты
runSimpleTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('💥 Критическая ошибка:', error.message);
    process.exit(1);
});