Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\MyBook Hype AMD\.gemini\antigravity-ide\scratch\bstation-tool"
WshShell.Run "cmd /c launch_desktop_app.bat", 0, False
