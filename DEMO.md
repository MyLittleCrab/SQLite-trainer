# Демонстрация SQLite WebAssembly Playground

## 🎯 Что создано

Полнофункциональная веб-страница для работы с SQLite прямо в браузере:

1. **Поле ввода SQL** - можно писать любые SQL запросы
2. **Кнопка выполнения** - запускает SQL запросы через WebAssembly
3. **Схема базы данных** - показывает все таблицы и их структуру  
4. **Примеры запросов** - готовые кнопки с полезными SQL командами
5. **Результаты в таблице** - красивое отображение результатов SELECT

## 🚀 Возможности

### Полный SQL функционал
- ✅ CREATE TABLE, INSERT, UPDATE, DELETE
- ✅ SELECT с JOIN, GROUP BY, ORDER BY
- ✅ Агрегатные функции (COUNT, SUM, AVG)
- ✅ Подзапросы и сложная логика
- ✅ Индексы и внешние ключи

### Удобный интерфейс
- ✅ Автодополнение Ctrl+Enter
- ✅ Обработка ошибок SQL
- ✅ Кнопки с примерами запросов
- ✅ Автообновление схемы БД
- ✅ Responsive дизайн

### Техническая реализация
- ✅ SQLite 3.x через WebAssembly
- ✅ Работает полностью локально
- ✅ Не требует серверной части
- ✅ Кроссплатформенность

## 📊 Предустановленные данные

### Таблица пользователей
```sql
SELECT * FROM users;
```
| id | name           | email              | age | created_at |
|----|----------------|--------------------|-----|------------|
| 1  | Алексей Петров | alexey@example.com | 25  | 2024-...   |
| 2  | Мария Иванова  | maria@example.com  | 30  | 2024-...   |

### Таблица заказов  
```sql
SELECT * FROM orders;
```
| id | user_id | product_name | amount    | order_date |
|----|---------|--------------|-----------|------------|
| 1  | 1       | Ноутбук      | 75000.00  | 2024-...   |
| 2  | 2       | Смартфон     | 25000.00  | 2024-...   |

## 🧪 Примеры использования

### 1. Просмотр данных
```sql
-- Все пользователи
SELECT * FROM users;

-- Заказы с именами пользователей
SELECT u.name, o.product_name, o.amount 
FROM orders o 
JOIN users u ON o.user_id = u.id;
```

### 2. Добавление данных
```sql
-- Новый пользователь
INSERT INTO users (name, email, age) 
VALUES ('Анна Волкова', 'anna@example.com', 27);

-- Новый заказ
INSERT INTO orders (user_id, product_name, amount) 
VALUES (1, 'Планшет', 35000.00);
```

### 3. Аналитика
```sql
-- Статистика по пользователям
SELECT 
    u.name,
    COUNT(o.id) as orders_count,
    COALESCE(SUM(o.amount), 0) as total_amount
FROM users u 
LEFT JOIN orders o ON u.id = o.user_id 
GROUP BY u.id, u.name
ORDER BY total_amount DESC;
```

### 4. Создание новых таблиц
```sql
-- Таблица товаров
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT,
    in_stock BOOLEAN DEFAULT TRUE
);

-- Добавление товаров
INSERT INTO products (name, price, category) VALUES 
('iPhone 15', 80000, 'Смартфоны'),
('MacBook Pro', 150000, 'Ноутбуки'),
('AirPods', 15000, 'Аксессуары');
```

## 🔥 Продвинутые возможности

### Работа с JSON (SQLite 3.38+)
```sql
-- Создание таблицы с JSON
CREATE TABLE settings (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    preferences TEXT -- JSON данные
);

-- Вставка JSON
INSERT INTO settings (user_id, preferences) VALUES 
(1, '{"theme": "dark", "notifications": true}'),
(2, '{"theme": "light", "notifications": false}');

-- Запрос JSON данных
SELECT 
    user_id,
    json_extract(preferences, '$.theme') as theme,
    json_extract(preferences, '$.notifications') as notifications
FROM settings;
```

### Window Functions
```sql
-- Ранжирование заказов по сумме
SELECT 
    user_id,
    product_name,
    amount,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY amount DESC) as rank
FROM orders;
```

### CTE (Common Table Expressions)
```sql
-- Рекурсивный запрос (пример дерева категорий)
WITH RECURSIVE category_tree(id, name, parent_id, level) AS (
    SELECT id, name, parent_id, 0 
    FROM categories 
    WHERE parent_id IS NULL
    
    UNION ALL
    
    SELECT c.id, c.name, c.parent_id, ct.level + 1
    FROM categories c
    JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree;
```

## 🎉 Заключение

Проект демонстрирует, как современные web-технологии позволяют запускать полноценную базу данных прямо в браузере. Это открывает новые возможности для:

- **Offline-first приложений** 
- **Прототипирования** без сервера
- **Обучения SQL** в интерактивном режиме
- **Анализа данных** на клиенте
- **Портабельных инструментов** для работы с данными