@echo off
chcp 65001 >nul
echo ============================================
echo   正商诸葛AI - 本地服务器
echo ============================================
echo.
echo 正在启动本地Web服务器...
echo 打包地址: http://localhost:8888
echo.
echo 请将此地址填入 PakePlus 的"网站地址"栏
echo 按 Ctrl+C 可停止服务器
echo ============================================
echo.

cd /d "%~dp0"
python -m http.server 8888

pause
