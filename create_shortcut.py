import os
import subprocess

vbs_code = r'''Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = oWS.SpecialFolders("Desktop") & "\Bstation Booster.lnk"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = "wscript.exe"
oLink.Arguments = Chr(34) & "C:\Users\MyBook Hype AMD\.gemini\antigravity-ide\scratch\bstation-tool\launch_silent.vbs" & Chr(34)
oLink.WorkingDirectory = "C:\Users\MyBook Hype AMD\.gemini\antigravity-ide\scratch\bstation-tool"
oLink.Description = "Bstation Booster - Smart View Engine Desktop App"
oLink.IconLocation = "shell32.dll,220"
oLink.Save
'''

temp_vbs = os.path.join(os.path.dirname(__file__), "_create_lnk.vbs")
with open(temp_vbs, "w", encoding="utf-8") as f:
    f.write(vbs_code)

subprocess.run(["cscript", "//nologo", temp_vbs], check=True)
os.remove(temp_vbs)
print("Desktop shortcut created successfully!")
