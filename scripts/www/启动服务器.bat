@echo off
chcp 65001 >nul
title 正商诸葛AI·爆款云剪智能体 - 本地服务器
echo ============================================================
echo   正商诸葛AI·爆款云剪智能体 - 本地服务器启动
echo ============================================================
echo.

cd /d "%~dp0"

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到Python，请先安装Python 3.8+
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check if edge-tts is installed
pip show edge-tts >nul 2>&1
if errorlevel 1 (
    echo [提示] 正在安装语音合成依赖 edge-tts...
    pip install edge-tts
)

echo  服务器启动中... 浏览器将在3秒后自动打开
echo  访问地址: http://localhost:8099
echo  按 Ctrl+C 可停止服务器
echo.

REM Open browser after 3 seconds, then start server in foreground
start /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:8099"
python server.py
pause
