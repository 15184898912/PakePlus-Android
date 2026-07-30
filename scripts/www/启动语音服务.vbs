' 正商诸葛AI · TTS 语音服务后台启动脚本
' 双击此文件即可在后台静默启动 TTS 服务守护进程
' 服务将在后台持续运行，关闭后可双击此文件重新启动

Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

' 获取脚本所在目录
scriptDir = FSO.GetParentFolderName(WScript.ScriptFullName)

' 构建启动命令：使用 keep_alive.cjs 守护进程
' /K 保持窗口打开（可查看日志），如需完全后台运行改为 /B
' 0 = 隐藏窗口, 1 = 正常窗口
' 使用 cmd /c start 在新窗口中运行，用户可以看到日志
cmdLine = "cmd /c title 正商诸葛AI-TTS语音服务 && node """ & scriptDir & "\keep_alive.cjs"" 8080"

' 以隐藏窗口方式启动（后台运行）
' 如需查看日志，将 0 改为 1
WshShell.Run cmdLine, 0, False

' 提示用户
MsgBox "TTS 语音服务已在后台启动！" & vbCrLf & vbCrLf & _
       "服务地址: http://localhost:8080" & vbCrLf & _
       "TTS 代理:  http://localhost:8080/tts-proxy" & vbCrLf & vbCrLf & _
       "服务将在后台持续运行，无需重复启动。" & vbCrLf & _
       "如需停止服务，请在任务管理器中结束 node.exe 进程。", _
       vbInformation, "正商诸葛AI · 语音服务"
