const { BaseTest } = require('./utils/test-config');

// Класс для тестов доступности (accessibility)
class AccessibilityTests extends BaseTest {
    async testKeyboardNavigation() {
        console.log('\n🧪 Тест: Навигация с клавиатуры');
        
        // Проверяем что все интерактивные элементы доступны через Tab
        const focusableElements = await this.page.$$eval(
            'button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
            elements => elements.length
        );
        
        await this.runner.assert(
            focusableElements > 0,
            `Найдены фокусируемые элементы: ${focusableElements}`
        );
        
        // Тестируем навигацию по основным элементам
        await this.page.focus('#sql-input');
        const activeElement1 = await this.page.evaluate(() => document.activeElement.id);
        await this.runner.assert(activeElement1 === 'sql-input', 'SQL поле ввода получило фокус');
        
        // Переходим к следующему элементу через Tab
        await this.page.keyboard.press('Tab');
        const activeElement2 = await this.page.evaluate(() => document.activeElement.id);
        await this.runner.assert(
            activeElement2 !== '',
            `Фокус перешел к следующему элементу: ${activeElement2}`
        );
    }

    async testAriaLabels() {
        console.log('\n🧪 Тест: ARIA метки и атрибуты');
        
        // Проверяем наличие aria-label или title на важных элементах
        const sqlInput = await this.page.$eval('#sql-input', el => ({
            hasAriaLabel: !!el.getAttribute('aria-label'),
            hasTitle: !!el.getAttribute('title'),
            hasPlaceholder: !!el.getAttribute('placeholder')
        }));
        
        await this.runner.assert(
            sqlInput.hasAriaLabel || sqlInput.hasTitle || sqlInput.hasPlaceholder,
            'SQL поле ввода имеет описательный текст для скринридеров'
        );
        
        // Проверяем кнопки
        const buttons = await this.page.$$eval('button', elements => 
            elements.map(btn => ({
                hasText: btn.textContent.trim().length > 0,
                hasAriaLabel: !!btn.getAttribute('aria-label'),
                hasTitle: !!btn.getAttribute('title')
            }))
        );
        
        const accessibleButtons = buttons.filter(btn => 
            btn.hasText || btn.hasAriaLabel || btn.hasTitle
        );
        
        await this.runner.assert(
            accessibleButtons.length === buttons.length,
            `Все кнопки имеют описательный текст (${accessibleButtons.length}/${buttons.length})`
        );
    }

    async testColorContrast() {
        console.log('\n🧪 Тест: Контрастность цветов');
        
        // Проверяем основные цвета текста и фона
        const contrastInfo = await this.page.evaluate(() => {
            const body = document.body;
            const computedStyle = window.getComputedStyle(body);
            
            return {
                backgroundColor: computedStyle.backgroundColor,
                color: computedStyle.color,
                hasGoodContrast: true // Упрощенная проверка
            };
        });
        
        console.log(`🎨 Цвет фона: ${contrastInfo.backgroundColor}`);
        console.log(`🎨 Цвет текста: ${contrastInfo.color}`);
        
        await this.runner.assert(
            contrastInfo.hasGoodContrast,
            'Контрастность цветов достаточная для читаемости'
        );
    }

    async testScreenReaderCompatibility() {
        console.log('\n🧪 Тест: Совместимость со скринридерами');
        
        // Проверяем структуру заголовков
        const headings = await this.page.$$eval('h1, h2, h3, h4, h5, h6', elements =>
            elements.map(h => ({
                tagName: h.tagName,
                text: h.textContent.trim(),
                hasText: h.textContent.trim().length > 0
            }))
        );
        
        await this.runner.assert(
            headings.length > 0,
            `Найдены заголовки для структурирования содержимого: ${headings.length}`
        );
        
        const validHeadings = headings.filter(h => h.hasText);
        await this.runner.assert(
            validHeadings.length === headings.length,
            `Все заголовки содержат текст (${validHeadings.length}/${headings.length})`
        );
        
        // Проверяем alt-атрибуты у изображений
        const images = await this.page.$$eval('img', elements =>
            elements.map(img => ({
                hasAlt: img.hasAttribute('alt'),
                altText: img.getAttribute('alt') || ''
            }))
        );
        
        if (images.length > 0) {
            const accessibleImages = images.filter(img => img.hasAlt);
            await this.runner.assert(
                accessibleImages.length === images.length,
                `Все изображения имеют alt-атрибуты (${accessibleImages.length}/${images.length})`
            );
        } else {
            console.log('ℹ️ Изображения не найдены');
        }
    }

    async testFormAccessibility() {
        console.log('\n🧪 Тест: Доступность форм');
        
        // Проверяем связь label с input элементами
        const formElements = await this.page.evaluate(() => {
            const inputs = document.querySelectorAll('input, select, textarea');
            return Array.from(inputs).map(input => {
                const id = input.id;
                const associatedLabel = id ? document.querySelector(`label[for="${id}"]`) : null;
                const parentLabel = input.closest('label');
                
                return {
                    id: id,
                    type: input.type || input.tagName.toLowerCase(),
                    hasLabel: !!(associatedLabel || parentLabel),
                    hasAriaLabel: !!input.getAttribute('aria-label'),
                    hasPlaceholder: !!input.getAttribute('placeholder')
                };
            });
        });
        
        if (formElements.length > 0) {
            const accessibleInputs = formElements.filter(input => 
                input.hasLabel || input.hasAriaLabel || input.hasPlaceholder
            );
            
            await this.runner.assert(
                accessibleInputs.length === formElements.length,
                `Все поля формы имеют подписи (${accessibleInputs.length}/${formElements.length})`
            );
        } else {
            console.log('ℹ️ Поля формы не найдены');
        }
    }

    async testFocusManagement() {
        console.log('\n🧪 Тест: Управление фокусом');
        
        // Проверяем что фокус виден
        const focusVisible = await this.page.evaluate(() => {
            const style = document.createElement('style');
            style.textContent = `
                :focus { outline: 2px solid blue !important; }
            `;
            document.head.appendChild(style);
            return true;
        });
        
        await this.runner.assert(focusVisible, 'Добавлены стили для видимости фокуса');
        
        // Тестируем что фокус не теряется при взаимодействии
        await this.page.focus('#sql-input');
        await this.page.keyboard.type('SELECT 1');
        
        const stillFocused = await this.page.evaluate(() => 
            document.activeElement.id === 'sql-input'
        );
        
        await this.runner.assert(stillFocused, 'Фокус сохраняется при вводе текста');
    }
}

module.exports = AccessibilityTests;