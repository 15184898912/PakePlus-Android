@echo off
chcp 65001 >nul 2>&1
title 正商诸葛AI · 安装开机自启

echo ============================================
echo   正商诸葛AI · TTS 语音服务开机自启安装
echo ============================================
echo.

:: 获取脚本所在目录
set "SCRIPT_DIR=%~dp0"
:: 去掉末尾的反斜杠
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

:: 检查 VBS 脚本是否存在
if not exist "%SCRIPT_DIR%\启动语音服务.vbs" (
    echo [错误] 找不到 启动语音服务.vbs 文件
    echo 请确保此脚本与 启动语音服务.vbs 在同一目录
    pause
    exit /b 1
)

:: 获取 Windows 启动目录
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

:: 创建快捷方式（使用 PowerShell）
echo 正在创建开机自启快捷方式...
powershell -NoProfile -Command ^
    "$ws = New-Object -ComObject WScript.Shell; " ^
    "$sc = $ws.CreateShortcut('%STARTUP_DIR%\正商诸葛AI-TTS服务.lnk'); " ^
    "$sc.TargetPath = '%SCRIPT_DIR%\启动语音服务.vbs'; " ^
    "$sc.WorkingDirectory = '%SCRIPT_DIR%'; " ^
    "$sc.IconLocation = 'shell32.dll,13'; " ^
    "$sc.Description = '正商诸葛AI TTS语音服务'; " ^
    "$sc.Save()"

if %errorlevel% equ 0 (
    echo.
    echo [成功] 开机自启已安装！
    echo.
    echo 快捷方式位置: %STARTUP_DIR%\正商诸葛AI-TTS服务.lnk
    echo.
    echo 每次开机后，TTS 语音服务将自动在后台启动。
    echo.
    echo 如需卸载开机自启：
    echo   删除上述快捷方式即可。
) else (
    echo.
    echo [失败] 安装开机自启失败，请尝试手动操作：
    echo   1. 按 Win+R 打开运行
    echo   2. 输入 shell:startup 打开启动文件夹
    echo   3. 将 启动语音服务.vbs 的快捷方式拖入
)

echo.
pause
