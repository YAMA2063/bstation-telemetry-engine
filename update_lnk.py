import os
import subprocess

vbs_code = r'''Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = oWS.SpecialFolders("Desktop") & "\Bstation Booster.lnk"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = "C:\Users\MyBook Hype AMD\Desktop\Bstation Booster (PC Desktop).exe"
oLink.WorkingDirectory = "C:\Users\MyBook Hype AMD\.gemini\antigravity-ide\scratch\bstation-tool"
oLink.Description = "Bstation Booster - Smart View Engine Desktop App"
oLink.IconLocation = "C:\Users\MyBook Hype AMD\.gemini\antigravity-ide\scratch\bstation-tool\app_icon.ico,0"
oLink.Save
'''

temp_vbs = r"C:\Users\MyBook Hype AMD\.gemini\antigravity-ide\scratch\bstation-tool\_update_lnk.vbs"
with open(temp_vbs, "w", encoding="utf-8") as f:
    f.write(vbs_code)

subprocess.run(["cscript", "//nologo", temp_vbs], check=True)
if os.path.exists(temp_vbs):
    os.remove(temp_vbs)
print("Updated Bstation Booster.lnk with new Bstation icon!")
