@echo off
echo 🚀 Запуск SQLite WebAssembly Playground
echo =======================================
echo.
echo Сервер будет доступен по адресу: http://localhost:8000
echo Для остановки нажмите Ctrl+C
echo.

REM Проверяем наличие Python
python --version >nul 2>&1
if %errorlevel% == 0 (
    python -m http.server 8000
) else (
    python3 --version >nul 2>&1
    if %errorlevel% == 0 (
        python3 -m http.server 8000
    ) else (
        echo ❌ Python не найден!
        echo Установите Python или откройте index.html напрямую в браузере
        pause
        exit /b 1
    )
)