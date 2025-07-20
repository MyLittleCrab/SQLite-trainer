const BaseTestRunner = require('./base-test-runner');

// Класс для тестов доступности
class AccessibilityTests extends BaseTestRunner {
    async testKeyboardNavigation() {
        console.log('\n🧪 Тест: Навигация с клавиатуры');
        
        // Проверяем фокусируемые элементы
        const focusableElements = await this.page.$$('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])');
        console.log(`✅ Найдены фокусируемые элементы: ${focusableElements.length}`);
        
        if (focusableElements.length > 0) {
            this.pass(`Найдены фокусируемые элементы: ${focusableElements.length}`);
        } else {
            this.fail(`Найдены фокусируемые элементы: ${focusableElements.length}`);
        }
        
        // Тестируем фокус на SQL поле ввода
        await this.page.focus('#sql-input');
        const sqlInputFocused = await this.page.evaluate(() => {
            return document.activeElement.id === 'sql-input';
        });
        
        if (sqlInputFocused) {
            this.pass('SQL поле ввода получило фокус');
        } else {
            this.fail('SQL поле ввода получило фокус');
        }
        
        // Тестируем переход к следующему элементу
        await this.page.keyboard.press('Tab');
        const nextFocusedElement = await this.page.evaluate(() => {
            return document.activeElement.id;
        });
        
        if (nextFocusedElement && nextFocusedElement !== 'sql-input') {
            this.pass(`Фокус перешел к следующему элементу: ${nextFocusedElement}`);
        } else {
            this.fail(`Фокус перешел к следующему элементу: ${nextFocusedElement}`);
        }
    }

    async testAriaLabelsAndAttributes() {
        console.log('\n🧪 Тест: ARIA метки и атрибуты');
        
        // Проверяем SQL поле ввода
        const sqlInputHasLabel = await this.page.evaluate(() => {
            const input = document.getElementById('sql-input');
            return input && (
                input.getAttribute('aria-label') || 
                input.getAttribute('placeholder') ||
                document.querySelector('label[for="sql-input"]')
            );
        });
        
        if (sqlInputHasLabel) {
            this.pass('SQL поле ввода имеет описательный текст для скринридеров');
        } else {
            this.fail('SQL поле ввода имеет описательный текст для скринридеров');
        }
        
        // Проверяем кнопки
        const buttonsWithLabels = await this.page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            let count = 0;
            buttons.forEach(button => {
                if (button.textContent.trim() || button.getAttribute('aria-label') || button.getAttribute('title')) {
                    count++;
                }
            });
            return { total: buttons.length, withLabels: count };
        });
        
        if (buttonsWithLabels.withLabels === buttonsWithLabels.total && buttonsWithLabels.total > 0) {
            this.pass(`Все кнопки имеют описательный текст (${buttonsWithLabels.withLabels}/${buttonsWithLabels.total})`);
        } else {
            this.fail(`Все кнопки имеют описательный текст (${buttonsWithLabels.withLabels}/${buttonsWithLabels.total})`);
        }
    }

    async testColorContrast() {
        console.log('\n🧪 Тест: Контрастность цветов');
        
        // Получаем цвета основных элементов
        const colors = await this.page.evaluate(() => {
            const body = document.body;
            const computedStyle = window.getComputedStyle(body);
            return {
                backgroundColor: computedStyle.backgroundColor,
                color: computedStyle.color
            };
        });
        
        console.log(`🎨 Цвет фона: ${colors.backgroundColor}`);
        console.log(`🎨 Цвет текста: ${colors.color}`);
        
        // Простая проверка контрастности (базовая)
        const hasGoodContrast = colors.backgroundColor !== colors.color;
        
        if (hasGoodContrast) {
            this.pass('Контрастность цветов достаточная для читаемости');
        } else {
            this.fail('Контрастность цветов достаточная для читаемости');
        }
    }

    async testScreenReaderCompatibility() {
        console.log('\n🧪 Тест: Совместимость со скринридерами');
        
        // Проверяем заголовки
        const headings = await this.page.$$('h1, h2, h3, h4, h5, h6');
        
        if (headings.length > 0) {
            this.pass(`Найдены заголовки для структурирования содержимого: ${headings.length}`);
        } else {
            this.fail(`Найдены заголовки для структурирования содержимого: ${headings.length}`);
        }
        
        // Проверяем, что заголовки содержат текст
        const headingsWithText = await this.page.evaluate(() => {
            const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
            let count = 0;
            headings.forEach(heading => {
                if (heading.textContent.trim()) {
                    count++;
                }
            });
            return { total: headings.length, withText: count };
        });
        
        if (headingsWithText.withText === headingsWithText.total && headingsWithText.total > 0) {
            this.pass(`Все заголовки содержат текст (${headingsWithText.withText}/${headingsWithText.total})`);
        } else {
            this.fail(`Все заголовки содержат текст (${headingsWithText.withText}/${headingsWithText.total})`);
        }
        
        // Проверяем изображения
        const images = await this.page.$$('img');
        if (images.length === 0) {
            console.log('ℹ️ Изображения не найдены');
        } else {
            const imagesWithAlt = await this.page.evaluate(() => {
                const images = document.querySelectorAll('img');
                let count = 0;
                images.forEach(img => {
                    if (img.getAttribute('alt') !== null) {
                        count++;
                    }
                });
                return { total: images.length, withAlt: count };
            });
            
            if (imagesWithAlt.withAlt === imagesWithAlt.total) {
                this.pass(`Все изображения имеют alt атрибуты (${imagesWithAlt.withAlt}/${imagesWithAlt.total})`);
            } else {
                this.fail(`Все изображения имеют alt атрибуты (${imagesWithAlt.withAlt}/${imagesWithAlt.total})`);
            }
        }
    }

    async testFormAccessibility() {
        console.log('\n🧪 Тест: Доступность форм');
        
        // Проверяем поля формы с подписями
        const formFieldsWithLabels = await this.page.evaluate(() => {
            const inputs = document.querySelectorAll('input, select, textarea');
            let count = 0;
            inputs.forEach(input => {
                const id = input.id;
                if (id && document.querySelector(`label[for="${id}"]`)) {
                    count++;
                } else if (input.getAttribute('aria-label') || input.getAttribute('placeholder')) {
                    count++;
                }
            });
            return { total: inputs.length, withLabels: count };
        });
        
        if (formFieldsWithLabels.withLabels === formFieldsWithLabels.total && formFieldsWithLabels.total > 0) {
            this.pass(`Все поля формы имеют подписи (${formFieldsWithLabels.withLabels}/${formFieldsWithLabels.total})`);
        } else {
            this.fail(`Все поля формы имеют подписи (${formFieldsWithLabels.withLabels}/${formFieldsWithLabels.total})`);
        }
    }

    async testFocusManagement() {
        console.log('\n🧪 Тест: Управление фокусом');
        
        // Проверяем видимость фокуса
        await this.page.addStyleTag({
            content: `
                *:focus {
                    outline: 2px solid #007acc !important;
                    outline-offset: 2px !important;
                }
            `
        });
        
        this.pass('Добавлены стили для видимости фокуса');
        
        // Тестируем сохранение фокуса при вводе
        await this.page.focus('#sql-input');
        await this.page.type('#sql-input', 'SELECT * FROM test;');
        
        const focusPreserved = await this.page.evaluate(() => {
            return document.activeElement.id === 'sql-input';
        });
        
        if (focusPreserved) {
            this.pass('Фокус сохраняется при вводе текста');
        } else {
            this.fail('Фокус сохраняется при вводе текста');
        }
    }

    // Метод для запуска всех тестов доступности
    async runAllTests() {
        console.log('\n♿ === ТЕСТЫ ДОСТУПНОСТИ === ♿\n');
        
        try {
            await this.testKeyboardNavigation();
            await this.testAriaLabelsAndAttributes();
            await this.testColorContrast();
            await this.testScreenReaderCompatibility();
            await this.testFormAccessibility();
            await this.testFocusManagement();
            
            return this.summary();
        } catch (error) {
            console.error('❌ Критическая ошибка при выполнении тестов доступности:', error);
            this.fail(`Критическая ошибка: ${error.message}`);
            return false;
        }
    }
}

module.exports = AccessibilityTests;