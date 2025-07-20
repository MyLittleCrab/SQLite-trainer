const BaseTestRunner = require('./base-test-runner');

// Класс для тестов интернационализации
class I18nTests extends BaseTestRunner {
    async testI18nSystem() {
        console.log('\n🧪 Тест: Проверка системы интернационализации');
        
        // Ждем загрузки i18n системы - несколько попыток
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
                // Проверяем напрямую без ожидания
                i18nLoaded = await this.page.evaluate(() => {
                    return typeof window.i18n !== 'undefined' && typeof window.i18n.t === 'function';
                });
                
                if (!i18nLoaded && attempts < maxAttempts) {
                    console.log(`Попытка ${attempts}: i18n не загружен, ждем еще...`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
        }
        
        // Если i18n не загрузился, проверяем, работает ли переключение языков (функциональный тест)
        if (!i18nLoaded) {
            console.log('i18n объект не найден, проверяем работу переключения языков...');
            
            // Тестируем переключение языка напрямую
            const languageSwitchWorks = await this.page.evaluate(() => {
                const langSelect = document.getElementById('language-select');
                if (langSelect) {
                    langSelect.value = 'ru';
                    langSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    return true;
                }
                return false;
            });
            
            if (languageSwitchWorks) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Проверяем, изменился ли текст
                const titleChanged = await this.page.evaluate(() => {
                    const title = document.querySelector('[data-i18n="header.title"]');
                    return title && title.textContent.includes('тренажер');
                });
                
                await this.runner.assert(titleChanged, 'Система i18n работает функционально (переключение языков)');
            } else {
                await this.runner.assert(false, 'Система i18n недоступна');
                return;
            }
        } else {
            await this.runner.assert(true, `Система i18n загружена (попытка ${attempts}/${maxAttempts})`);
        }
        
        // Проверяем наличие переводов
        const hasTranslations = await this.page.evaluate(() => {
            return typeof window.i18n === 'object' && 
                   typeof window.i18n.t === 'function';
        });
        await this.runner.assert(hasTranslations, 'Функция перевода i18n.t доступна');
        
        // Проверяем элементы с data-i18n атрибутами
        const i18nElements = await this.page.$$('[data-i18n]');
        await this.runner.assert(i18nElements.length > 0, 'Найдены элементы с data-i18n атрибутами');
        console.log(`Найдено ${i18nElements.length} элементов с data-i18n`);
        
        // Проверяем основные переводы
        const headerTitle = await this.page.$eval('[data-i18n="header.title"]', el => el.textContent);
        await this.runner.assert(headerTitle.length > 0, 'Заголовок переведен');
        console.log(`Заголовок: "${headerTitle}"`);
    }

    async testLanguageSwitching() {
        console.log('\n🧪 Тест: Переключение языков');
        
        // Получаем изначальный заголовок (английский)
        const initialTitle = await this.page.$eval('[data-i18n="header.title"]', el => el.textContent);
        console.log(`Изначальный заголовок: "${initialTitle}"`);
        
        // Переключаемся на русский
        await this.page.select('#language-select', 'ru');
        
        // Ждем обновления интерфейса и загрузки переводов
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Проверяем, что заголовок изменился
        const russianTitle = await this.page.$eval('[data-i18n="header.title"]', el => el.textContent);
        console.log(`Русский заголовок: "${russianTitle}"`);
        
        await this.runner.assert(
            russianTitle !== initialTitle && russianTitle.includes('тренажер'),
            'Заголовок переведен на русский'
        );
        
        // Проверяем другие элементы интерфейса
        const executeButton = await this.page.$eval('[data-i18n="sql.execute_test"]', el => el.textContent);
        await this.runner.assert(
            executeButton.includes('Выполнить'),
            'Кнопка "Выполнить запрос" переведена на русский'
        );
        
        // Возвращаемся на английский
        await this.page.select('#language-select', 'en');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const englishTitle = await this.page.$eval('[data-i18n="header.title"]', el => el.textContent);
        await this.runner.assert(
            englishTitle === initialTitle,
            'Заголовок вернулся к английскому'
        );
        
        // Проверяем сохранение языка в localStorage
        const savedLanguage = await this.page.evaluate(() => {
            return localStorage.getItem('sqltrainer-language');
        });
        await this.runner.assert(savedLanguage === 'en', 'Выбранный язык сохранен в localStorage');
        
        // Проверяем атрибут lang в HTML
        const htmlLang = await this.page.evaluate(() => {
            return document.documentElement.getAttribute('lang');
        });
        await this.runner.assert(htmlLang === 'en', 'Атрибут lang в HTML установлен корректно');
        
        // Дополнительно проверяем загрузку JSON файлов переводов
        await this.testI18nFileLoading();
    }
    
    async testI18nFileLoading() {
        console.log('\n🧪 Тест: Проверка загрузки JSON файлов переводов');
        
        // Проверяем загрузку английских переводов
        const enTranslations = await this.page.evaluate(async () => {
            try {
                const response = await fetch('./i18n/i18nen.json');
                return response.ok;
            } catch (error) {
                return false;
            }
        });
        await this.runner.assert(enTranslations, 'Файл английских переводов загружается');
        
        // Проверяем загрузку русских переводов
        const ruTranslations = await this.page.evaluate(async () => {
            try {
                const response = await fetch('./i18n/i18nru.json');
                return response.ok;
            } catch (error) {
                return false;
            }
        });
        await this.runner.assert(ruTranslations, 'Файл русских переводов загружается');
        
        // Проверяем содержимое переводов
        const translationsData = await this.page.evaluate(async () => {
            try {
                const [enResponse, ruResponse] = await Promise.all([
                    fetch('./i18n/i18nen.json'),
                    fetch('./i18n/i18nru.json')
                ]);
                
                const [enData, ruData] = await Promise.all([
                    enResponse.json(),
                    ruResponse.json()
                ]);
                
                return {
                    en: enData,
                    ru: ruData,
                    enKeys: Object.keys(enData).length,
                    ruKeys: Object.keys(ruData).length
                };
            } catch (error) {
                return null;
            }
        });
        
        if (translationsData) {
            await this.runner.assert(
                translationsData.enKeys > 0,
                `Английские переводы содержат ${translationsData.enKeys} секций`
            );
            
            await this.runner.assert(
                translationsData.ruKeys > 0,
                `Русские переводы содержат ${translationsData.ruKeys} секций`
            );
            
            await this.runner.assert(
                translationsData.enKeys === translationsData.ruKeys,
                'Количество секций в английском и русском переводах совпадает'
            );
            
            // Проверяем наличие ключевых переводов
            const hasKeyTranslations = translationsData.en.header && 
                                      translationsData.en.header.title &&
                                      translationsData.ru.header && 
                                      translationsData.ru.header.title;
            
            if (hasKeyTranslations) {
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