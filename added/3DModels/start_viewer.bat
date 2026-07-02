@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   Nordlab - просмотр 3D-модели рододендрона
echo ============================================
echo.
echo Поднимаю локальный сервер на порту 8765...
echo Закрыть: Ctrl+C или просто закрой это окно.
echo.
start "" cmd /c "timeout /t 2 >nul && start http://localhost:8765/rhododendron_viewer_offline.html"
python -m http.server 8765 2>nul || py -m http.server 8765
