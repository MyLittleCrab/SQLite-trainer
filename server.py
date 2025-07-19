#!/usr/bin/env python3
"""
Простой HTTP сервер для тестирования SQLite WebAssembly приложения
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000

class HTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Обработчик HTTP запросов с правильными MIME типами"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
    
    def end_headers(self):
        # Добавляем заголовки для WebAssembly
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        super().end_headers()
    
    def guess_type(self, path):
        """Определяем MIME тип для файлов"""
        mimetype, encoding = super().guess_type(path)
        
        # Специальные типы для WebAssembly
        if path.endswith('.wasm'):
            return 'application/wasm'
        
        return mimetype, encoding

def main():
    """Запуск HTTP сервера"""
    
    # Убеждаемся, что мы в правильной директории
    if not os.path.exists('index.html'):
        print("❌ Файл index.html не найден!")
        print("Убедитесь, что вы запускаете сервер в директории с проектом.")
        sys.exit(1)
    
    # Создаем сервер
    with socketserver.TCPServer(("", PORT), HTTPRequestHandler) as httpd:
        print(f"🚀 Запуск сервера на порту {PORT}")
        print(f"📂 Обслуживается директория: {os.getcwd()}")
        print(f"🌐 Откройте в браузере: http://localhost:{PORT}")
        print(f"📱 Или откройте: http://127.0.0.1:{PORT}")
        print()
        print("Для остановки сервера нажмите Ctrl+C")
        print("-" * 50)
        
        try:
            # Автоматически открываем браузер
            webbrowser.open(f'http://localhost:{PORT}')
            
            # Запускаем сервер
            httpd.serve_forever()
            
        except KeyboardInterrupt:
            print("\n🛑 Сервер остановлен")
            httpd.shutdown()

if __name__ == "__main__":
    main()