// Система интернационализации / Internationalization system
class I18n {
    constructor() {
        this.currentLanguage = 'en'; // По умолчанию английский
        this.translations = {};
        this.loadingPromises = {};
        
        // Загружаем сохраненный язык или используем английский по умолчанию
        this.loadLanguage();
        
        // Устанавливаем атрибут lang при инициализации, если DOM уже загружен
        if (document.documentElement) {
            document.documentElement.setAttribute('lang', this.currentLanguage);
        } else {
            // Если DOM еще не загружен, добавляем обработчик
            document.addEventListener('DOMContentLoaded', () => {
                document.documentElement.setAttribute('lang', this.currentLanguage);
            });
        }
        
        // Начинаем загрузку переводов для текущего языка
        this.loadTranslations(this.currentLanguage);
    }
    
    // Загрузка переводов из файла
    async loadTranslations(lang) {
        if (this.translations[lang]) {
            return; // Уже загружено
        }
        
        if (this.loadingPromises[lang]) {
            return this.loadingPromises[lang]; // Уже загружается
        }
        
        this.loadingPromises[lang] = this.fetchTranslations(lang);
        
        try {
            await this.loadingPromises[lang];
        } catch (error) {
            console.error(`Failed to load translations for ${lang}:`, error);
            delete this.loadingPromises[lang];
        }
    }
    
    // Получение переводов с сервера
    async fetchTranslations(lang) {
        try {
            const response = await fetch(`./i18n/i18n${lang}.json`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const translations = await response.json();
            this.translations[lang] = this.flattenTranslations(translations);
            console.log(`Translations loaded for ${lang}`);
        } catch (error) {
            console.error(`Error loading translations for ${lang}:`, error);
            throw error;
        }
    }
    
    // Преобразование вложенной структуры в плоскую с точками
    flattenTranslations(obj, prefix = '') {
        const flattened = {};
        
        for (const key in obj) {
            const newKey = prefix ? `${prefix}.${key}` : key;
            
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                Object.assign(flattened, this.flattenTranslations(obj[key], newKey));
            } else {
                flattened[newKey] = obj[key];
            }
        }
        
        return flattened;
    }
    
    // Получить перевод для ключа
    t(key, params = {}) {
        let translation = this.translations[this.currentLanguage]?.[key] || 
                         this.translations['en']?.[key] || 
                         key;
        
        // Заменяем параметры в строке
        Object.keys(params).forEach(param => {
            translation = translation.replace(`{${param}}`, params[param]);
        });
        
        return translation;
    }
    
    // Установить язык
    async setLanguage(lang) {
        try {
            // Загружаем переводы для нового языка
            await this.loadTranslations(lang);
            
            this.currentLanguage = lang;
            this.saveLanguage();
            
            // Обновляем атрибут lang в HTML элементе
            document.documentElement.setAttribute('lang', lang);
            
            this.updateUI();
        } catch (error) {
            console.error(`Failed to set language to ${lang}:`, error);
        }
    }
    
    // Получить текущий язык
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    
    // Сохранить язык в localStorage
    saveLanguage() {
        localStorage.setItem('sqltrainer-language', this.currentLanguage);
    }
    
    // Загрузить язык из localStorage
    loadLanguage() {
        const saved = localStorage.getItem('sqltrainer-language');
        if (saved && this.translations[saved]) {
            this.currentLanguage = saved;
        }
    }
    
    // Обновить весь интерфейс
    updateUI() {
        // Обновляем статические элементы
        this.updateStaticElements();
        
        // Обновляем динамические элементы, если они существуют
        if (typeof updateSchema === 'function') {
            updateSchema();
        }
        
        if (typeof displayTask === 'function' && typeof currentTask !== 'undefined' && currentTask) {
            displayTask();
        }
    }
    
    // Обновить статические элементы интерфейса
    updateStaticElements() {
        // Обновляем все элементы с data-i18n атрибутом
        const i18nElements = document.querySelectorAll('[data-i18n]');
        i18nElements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = this.t(key);
        });
        
        // Обновляем placeholder для элементов с data-i18n-placeholder
        const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
        placeholderElements.forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });
        
        // Кнопка выполнения - особый случай для состояния disabled
        const executeBtn = document.getElementById('execute-btn');
        if (executeBtn && !executeBtn.disabled) {
            executeBtn.textContent = this.t('sql.execute');
        }
        
        // Результаты по умолчанию - проверяем содержимое
        const resultsContainer = document.getElementById('results-container');
        if (resultsContainer && (
            resultsContainer.innerHTML.includes('Результаты выполнения появятся здесь') || 
            resultsContainer.innerHTML.includes('Execution results will appear here'))) {
            resultsContainer.innerHTML = `<p data-i18n="results.placeholder">${this.t('results.placeholder')}</p>`;
        }
    }
}

// Создаем глобальный экземпляр i18n
const i18n = new I18n();