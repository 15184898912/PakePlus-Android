@echo off
chcp 65001 >nul
title 正商诸葛AI - 静态版
echo.
echo  ========================================
echo   正商诸葛AI - 云剪辑智能体
echo  ========================================
echo.

cd /d "%~dp0"

:: 优先使用 Node.js 启动完整服务器（带 TTS 代理）
where node >nul 2>nul
if %errorlevel% == 0 (
    if exist "server.cjs" (
        echo [推荐] 使用 Node.js 启动完整服务器（支持 TTS 语音合成）...
        echo 访问地址: http://localhost:8080
echo 手机访问: http://%COMPUTERNAME%:8080 或本机IP:8080
echo.
        start "" http://localhost:8080
        node server.cjs 8080
        goto :end
    ) else (
        echo [警告] 未找到 server.cjs，TTS 语音合成功能将不可用
echo.
    )
)

:: 回退：尝试使用 Python 启动简单 HTTP 服务器
echo [回退] 使用简单 HTTP 服务器（TTS 功能可能不可用）...
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
echo 错误: 未找到 Node.js、Python 或 npx
echo 请安装 Node.js (https://nodejs.org) 以获得完整功能
echo.
pause

:end