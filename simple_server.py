#!/usr/bin/env python3
"""
Упрощенный HTTP сервер для SQLite WebAssembly
"""

import http.server
import socketserver
import os

PORT = 8000

def main():
    os.chdir('.')
    
    handler = http.server.SimpleHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Сервер запущен на http://localhost:{PORT}")
        print("Нажмите Ctrl+C для остановки")
        httpd.serve_forever()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nСервер остановлен")