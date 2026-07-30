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
echo  手机测试: http://电脑IP:8080
echo  按 Ctrl+C 停止服务器
echo.

cd /d "%~dp0"

:: 优先使用 Node.js + server.cjs（支持 TTS 语音合成代理）
where node >nul 2>nul
if %errorlevel% == 0 (
    :: 检查 server.cjs 是否在当前目录或上级目录
    if exist "%~dp0server.cjs" (
        echo 使用 Node.js 服务器 (server.cjs - 支持 TTS 代理)...
        start "" http://localhost:8080
        node "%~dp0server.cjs" 8080
        goto :end
    )
    if exist "%~dp0..\server.cjs" (
        echo 使用 Node.js 服务器 (上级 server.cjs - 支持 TTS 代理)...
        start "" http://localhost:8080
        node "%~dp0..\server.cjs" 8080
        goto :end
    )
)

:: 回退：使用 Python 启动 HTTP 服务器（不支持 TTS 代理）
where python >nul 2>nul
if %errorlevel% == 0 (
    echo 使用 Python 服务器 (不支持 TTS 代理，语音功能可能不可用)...
    start "" http://localhost:8080
    python -m http.server 8080
    goto :end
)

:: 回退：使用 Python3
where python3 >nul 2>nul
if %errorlevel% == 0 (
    echo 使用 Python3 服务器 (不支持 TTS 代理)...
    start "" http://localhost:8080
    python3 -m http.server 8080
    goto :end
)

:: 回退：使用 npx
where npx >nul 2>nul
if %errorlevel% == 0 (
    echo 使用 npx http-server...
    start "" http://localhost:8080
    npx http-server -p 8080 -c-1
    goto :end
)

echo.
echo 错误: 未找到 Node.js 或 Python
echo 请安装 Node.js (https://nodejs.org) 或 Python (https://python.org)
echo.
pause

:end
