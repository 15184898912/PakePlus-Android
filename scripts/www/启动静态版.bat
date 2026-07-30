@echo off
chcp 65001 >nul
title 正商诸葛AI - 静态版
echo.
echo  ========================================
echo   正商诸葛AI - 纯静态HTML版本
echo  ========================================
echo.
echo  正在启动本地服务器...
echo  请在浏览器中访问: http://localhost:8080
echo  按 Ctrl+C 停止服务器
echo.

cd /d "%~dp0"

:: 尝试使用 Python 启动 HTTP 服务器
where python >nul 2>nul
if %errorlevel% == 0 (
    echo 使用 Python 服务器...
    start "" http://localhost:8080
    python -m http.server 8080
    goto :end
)

:: 尝试使用 Python3
where python3 >nul 2>nul
if %errorlevel% == 0 (
    echo 使用 Python3 服务器...
    start "" http://localhost:8080
    python3 -m http.server 8080
    goto :end
)

:: 尝试使用 npx
where npx >nul 2>nul
if %errorlevel% == 0 (
    echo 使用 npx http-server...
    start "" http://localhost:8080
    npx http-server -p 8080 -c-1
    goto :end
)

echo.
echo 错误: 未找到 Python 或 npx
echo 请安装 Python (https://python.org) 或 Node.js (https://nodejs.org)
echo.
pause

:end
