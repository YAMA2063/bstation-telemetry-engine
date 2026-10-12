import os
import sys
import subprocess
import shutil
import zipfile

def main():
    base_dir = r"C:\Users\MyBook Hype AMD\.gemini\antigravity-ide\scratch\bstation-tool"
    app_dir = os.path.join(base_dir, "android_app", "app", "src", "main")
    sdk_dir = os.path.join(base_dir, "android-sdk")
    build_tools = os.path.join(sdk_dir, "build-tools", "34.0.0")
    android_jar = os.path.join(sdk_dir, "platforms", "android-34", "android.jar")
    jdk_home = r"C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot"

    env = os.environ.copy()
    env["JAVA_HOME"] = jdk_home
    env["PATH"] = os.path.join(jdk_home, "bin") + ";" + env["PATH"]

    aapt_exe = os.path.join(build_tools, "aapt.exe")
    d8_bat = os.path.join(build_tools, "d8.bat")
    zipalign_exe = os.path.join(build_tools, "zipalign.exe")
    apksigner_bat = os.path.join(build_tools, "apksigner.bat")

    build_dir = os.path.join(base_dir, "build_apk_temp")
    gen_dir = os.path.join(build_dir, "gen")
    classes_dir = os.path.join(build_dir, "classes")
    dex_dir = os.path.join(build_dir, "dex")

    # Clean & setup directories
    if os.path.exists(build_dir):
        shutil.rmtree(build_dir)
    os.makedirs(gen_dir, exist_ok=True)
    os.makedirs(classes_dir, exist_ok=True)
    os.makedirs(dex_dir, exist_ok=True)

    manifest_xml = os.path.join(app_dir, "AndroidManifest.xml")
    res_dir = os.path.join(app_dir, "res")
    assets_dir = os.path.join(app_dir, "assets")
    java_dir = os.path.join(app_dir, "java", "com", "bstation", "booster")

    print("[1/7] Menghasilkan R.java menggunakan aapt...")
    cmd_r = [
        aapt_exe, "package", "-f", "-m",
        "-J", gen_dir,
        "-M", manifest_xml,
        "-S", res_dir,
        "-I", android_jar
    ]
    subprocess.run(cmd_r, check=True, env=env)
    print("      [OK] R.java berhasil dibuat!")

    print("[2/7] Mengompilasi kode Java menjadi bytecode .class...")
    java_files = [
        os.path.join(java_dir, "MainActivity.java"),
        os.path.join(java_dir, "WebAppInterface.java"),
        os.path.join(java_dir, "BstationBoosterEngine.java"),
        os.path.join(gen_dir, "com", "bstation", "booster", "R.java")
    ]
    javac_exe = os.path.join(jdk_home, "bin", "javac.exe")
    cmd_javac = [
        javac_exe, "-encoding", "UTF-8", "-source", "1.8", "-target", "1.8",
        "-cp", f"{android_jar};{classes_dir}",
        "-d", classes_dir
    ] + java_files
    subprocess.run(cmd_javac, check=True, env=env)
    print("      [OK] Kode Java berhasil dikompilasi!")

    print("[3/7] Mengonversi .class menjadi Dalvik Executable (classes.dex) menggunakan d8...")
    compiled_classes = []
    for root, dirs, files in os.walk(classes_dir):
        for f in files:
            if f.endswith(".class"):
                compiled_classes.append(os.path.join(root, f))

    cmd_d8 = [d8_bat, "--lib", android_jar, "--output", dex_dir] + compiled_classes
    subprocess.run(cmd_d8, check=True, env=env)
    classes_dex = os.path.join(dex_dir, "classes.dex")
    if not os.path.exists(classes_dex):
        raise RuntimeError("classes.dex tidak ditemukan setelah d8!")
    print(f"      [OK] classes.dex berhasil dibuat ({os.path.getsize(classes_dex):,} bytes)!")

    print("[4/7] Memaketkan resource & assets ke unaligned APK...")
    unaligned_apk = os.path.join(build_dir, "unaligned.apk")
    cmd_aapt_apk = [
        aapt_exe, "package", "-f",
        "-M", manifest_xml,
        "-S", res_dir,
        "-A", assets_dir,
        "-I", android_jar,
        "-F", unaligned_apk
    ]
    subprocess.run(cmd_aapt_apk, check=True, env=env)
    print("      [OK] Paket aset selesai!")

    print("[5/7] Memasukkan classes.dex ke dalam APK...")
    with zipfile.ZipFile(unaligned_apk, "a", compression=zipfile.ZIP_DEFLATED) as z:
        z.write(classes_dex, arcname="classes.dex")
    print("      [OK] classes.dex dimasukkan ke APK!")

    print("[6/7] Menyelaraskan alignment 4-byte menggunakan zipalign...")
    aligned_apk = os.path.join(build_dir, "aligned.apk")
    cmd_zipalign = [zipalign_exe, "-f", "-p", "4", unaligned_apk, aligned_apk]
    subprocess.run(cmd_zipalign, check=True, env=env)
    print("      [OK] Zipalign berhasil!")

    print("[7/7] Menandatangani APK (Signing) menggunakan apksigner...")
    keystore = os.path.join(base_dir, "debug.keystore")
    if not os.path.exists(keystore):
        keytool_exe = os.path.join(jdk_home, "bin", "keytool.exe")
        cmd_key = [
            keytool_exe, "-genkeypair", "-v",
            "-keystore", keystore,
            "-storepass", "android",
            "-alias", "androiddebugkey",
            "-keypass", "android",
            "-keyalg", "RSA",
            "-keysize", "2048",
            "-validity", "10000",
            "-dname", "CN=BstationBooster,O=Booster,C=ID"
        ]
        subprocess.run(cmd_key, check=True, env=env)
        print("      [OK] Keystore dibuat!")

    desktop_apk = r"C:\Users\MyBook Hype AMD\Desktop\BstationBooster.apk"
    downloads_apk = r"C:\Users\MyBook Hype AMD\Downloads\BstationBooster.apk"

    cmd_sign = [
        apksigner_bat, "sign",
        "--ks", keystore,
        "--ks-pass", "pass:android",
        "--key-pass", "pass:android",
        "--out", desktop_apk,
        aligned_apk
    ]
    subprocess.run(cmd_sign, check=True, env=env)
    print("      [OK] APK berhasil ditandatangani!")

    # Verifikasi tanda tangan
    cmd_verify = [apksigner_bat, "verify", "-v", desktop_apk]
    subprocess.run(cmd_verify, check=True, env=env)

    # Salin ke Downloads
    shutil.copyfile(desktop_apk, downloads_apk)

    size_mb = os.path.getsize(desktop_apk) / (1024 * 1024)
    print("================================================================")
    print(f"[SUCCESS] APK Bstation Booster siap dipasang di HP Android!")
    print(f"Lokasi Desktop  : {desktop_apk} ({size_mb:.2f} MB)")
    print(f"Lokasi Unduhan  : {downloads_apk}")
    print("================================================================")

if __name__ == "__main__":
    main()
