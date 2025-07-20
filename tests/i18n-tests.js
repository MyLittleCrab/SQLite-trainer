const BaseTestRunner = require('./base-test-runner');

// Класс для тестов интернационализации
class I18nTests extends BaseTestRunner {
    async testI18nSystem() {
        console.log('\n🧪 Тест: Проверка системы интернационализации');
        
        // Ждем загрузки i18n системы
        let i18nLoaded = false;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (!i18nLoaded && attempts < maxAttempts) {
            attempts++;
            try {
                await this.page.waitForFunction(
                    () => window.i18n !== undefined && typeof window.i18n.t === 'function',
                    { timeout: 8000 }
                );
                i18nLoaded = true;
            } catch (error) {
                i18nLoaded = await this.page.evaluate(() => {
                    return typeof window.i18n !== 'undefined' && typeof window.i18n.t === 'function';
                });
                
                if (!i18nLoaded && attempts < maxAttempts) {
                    console.log(`Попытка ${attempts}: i18n не загружен, ждем еще...`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
        }
        
        if (i18nLoaded) {
            this.pass(`Система i18n загружена (попытка ${attempts}/${maxAttempts})`);
        } else {
            this.fail(`Система i18n не загрузилась за ${maxAttempts} попыток`);
        }
        
        // Проверяем функцию перевода
        const i18nFunctionWorks = await this.page.evaluate(() => {
            return window.i18n && typeof window.i18n.t === 'function';
        });
        
        if (i18nFunctionWorks) {
            this.pass('Функция перевода i18n.t доступна');
        } else {
            this.fail('Функция перевода i18n.t доступна');
        }
        
        // Проверяем элементы с data-i18n атрибутами
        const i18nElements = await this.page.$$('[data-i18n]');
        console.log(`Найдено ${i18nElements.length} элементов с data-i18n`);
        
        if (i18nElements.length > 0) {
            this.pass('Найдены элементы с data-i18n атрибутами');
        } else {
            this.fail('Найдены элементы с data-i18n атрибутами');
        }
        
        // Проверяем заголовок
        const titleElement = await this.page.$('h1[data-i18n="header.title"]');
        if (titleElement) {
            const titleText = await this.page.evaluate(el => el.textContent, titleElement);
            console.log(`Заголовок: "${titleText}"`);
            this.pass('Заголовок переведен');
        } else {
            this.fail('Заголовок переведен');
        }
    }

    async testLanguageSwitching() {
        console.log('\n🧪 Тест: Переключение языков');
        
        // Получаем начальный заголовок
        const initialTitle = await this.page.evaluate(() => {
            const titleEl = document.querySelector('h1[data-i18n="header.title"]');
            return titleEl ? titleEl.textContent.trim() : '';
        });
        console.log(`Изначальный заголовок: "${initialTitle}"`);
        
        // Переключаем на русский
        await this.page.select('#language-select', 'ru');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const russianTitle = await this.page.evaluate(() => {
            const titleEl = document.querySelector('h1[data-i18n="header.title"]');
            return titleEl ? titleEl.textContent.trim() : '';
        });
        console.log(`Русский заголовок: "${russianTitle}"`);
        
        if (russianTitle.includes('Браузерный') || russianTitle.includes('тренажер')) {
            this.pass('Заголовок переведен на русский');
        } else {
            this.fail('Заголовок переведен на русский');
        }
        
        // Проверяем кнопку выполнения
        const runButtonText = await this.page.evaluate(() => {
            const btn = document.getElementById('execute-test-btn');
            return btn ? btn.textContent.trim() : '';
        });
        
        if (runButtonText.includes('Выполнить') || runButtonText.includes('запрос')) {
            this.pass('Кнопка "Выполнить запрос" переведена на русский');
        } else {
            this.fail('Кнопка "Выполнить запрос" переведена на русский');
        }
        
        // Переключаем обратно на английский
        await this.page.select('#language-select', 'en');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const englishTitle = await this.page.evaluate(() => {
            const titleEl = document.querySelector('h1[data-i18n="header.title"]');
            return titleEl ? titleEl.textContent.trim() : '';
        });
        
        if (englishTitle.includes('Browser') || englishTitle.includes('Trainer')) {
            this.pass('Заголовок вернулся к английскому');
        } else {
            this.fail('Заголовок вернулся к английскому');
        }
        
        // Проверяем сохранение языка в localStorage
        const savedLanguage = await this.page.evaluate(() => {
            return localStorage.getItem('sqltrainer-language');
        });
        
        if (savedLanguage) {
            this.pass('Выбранный язык сохранен в localStorage');
        } else {
            this.fail('Выбранный язык сохранен в localStorage');
        }
        
        // Проверяем атрибут lang в HTML
        const htmlLang = await this.page.evaluate(() => {
            return document.documentElement.getAttribute('lang');
        });
        
        if (htmlLang === 'en') {
            this.pass('Атрибут lang в HTML установлен корректно');
        } else {
            this.fail('Атрибут lang в HTML установлен корректно');
        }
    }

    async testI18nFileLoading() {
        console.log('\n🧪 Тест: Проверка загрузки JSON файлов переводов');
        
        // Проверяем загрузку файлов переводов через JavaScript
        const translationsLoaded = await this.page.evaluate(async () => {
            try {
                // Загружаем английский файл
                const enResponse = await fetch('/i18n/i18nen.json');
                if (!enResponse.ok) return { success: false, error: 'English file not found' };
                const enData = await enResponse.json();
                
                // Загружаем русский файл
                const ruResponse = await fetch('/i18n/i18nru.json');
                if (!ruResponse.ok) return { success: false, error: 'Russian file not found' };
                const ruData = await ruResponse.json();
                
                // Проверяем структуру
                const enSections = Object.keys(enData).length;
                const ruSections = Object.keys(ruData).length;
                
                return {
                    success: true,
                    enSections,
                    ruSections,
                    hasKeyTranslations: !!(enData.header && enData.header.title && ruData.header && ruData.header.title)
                };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
        
        if (translationsLoaded.success) {
            this.pass('Файл английских переводов загружается');
            this.pass('Файл русских переводов загружается');
            this.pass(`Английские переводы содержат ${translationsLoaded.enSections} секций`);
            this.pass(`Русские переводы содержат ${translationsLoaded.ruSections} секций`);
            
            if (translationsLoaded.enSections === translationsLoaded.ruSections) {
                this.pass('Количество секций в английском и русском переводах совпадает');
            } else {
                this.fail('Количество секций в английском и русском переводах совпадает');
            }
            
            if (translationsLoaded.hasKeyTranslations) {
                this.pass('Ключевые переводы (header.title) присутствуют');
            } else {
                this.fail('Ключевые переводы (header.title) присутствуют');
            }
        } else {
            this.fail('Не удалось загрузить и проверить содержимое переводов');
        }
    }

    // Метод для запуска всех i18n тестов
    async runAllTests() {
        console.log('\n🌍 === ТЕСТЫ ИНТЕРНАЦИОНАЛИЗАЦИИ === 🌍\n');
        
        try {
            await this.testI18nSystem();
            await this.testLanguageSwitching();
            await this.testI18nFileLoading();
            
            return this.summary();
        } catch (error) {
            console.error('❌ Критическая ошибка при выполнении i18n тестов:', error);
            this.fail(`Критическая ошибка: ${error.message}`);
            return false;
        }
    }
}

module.exports = I18nTests;