#!/bin/bash

echo "🚀 Запуск SQLite WebAssembly Playground"
echo "======================================="
echo ""
echo "Сервер будет доступен по адресу: http://localhost:8000"
echo "Для остановки нажмите Ctrl+C"
echo ""

# Проверяем наличие Python
if command -v python3 &> /dev/null; then
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    python -m http.server 8000
else
    echo "❌ Python не найден!"
    echo "Установите Python или откройте index.html напрямую в браузере"
    exit 1
fi