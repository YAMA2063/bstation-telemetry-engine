using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;

namespace BstationDesktop
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            string appDir = @"C:\Users\MyBook Hype AMD\.gemini\antigravity-ide\scratch\bstation-tool";
            string serverUrl = "http://localhost:3737";

            // Cek apakah server lokal sudah aktif
            bool isRunning = false;
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create(serverUrl + "/api/status");
                req.Timeout = 1000;
                using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
                {
                    if (resp.StatusCode == HttpStatusCode.OK) isRunning = true;
                }
            }
            catch {}

            if (!isRunning)
            {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = "node";
                psi.Arguments = "server.js";
                psi.WorkingDirectory = appDir;
                psi.CreateNoWindow = true;
                psi.WindowStyle = ProcessWindowStyle.Hidden;
                psi.UseShellExecute = false;
                Process.Start(psi);
                Thread.Sleep(1500);
            }

            // Buka dalam mode App Window (tampilan software native tanpa address bar)
            string edge1 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe");
            string edge2 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe");
            string chrome1 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe");
            string chrome2 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe");

            if (File.Exists(edge1))
            {
                Process.Start(edge1, "--app=" + serverUrl + " --window-size=1200,820");
            }
            else if (File.Exists(edge2))
            {
                Process.Start(edge2, "--app=" + serverUrl + " --window-size=1200,820");
            }
            else if (File.Exists(chrome1))
            {
                Process.Start(chrome1, "--app=" + serverUrl + " --window-size=1200,820");
            }
            else if (File.Exists(chrome2))
            {
                Process.Start(chrome2, "--app=" + serverUrl + " --window-size=1200,820");
            }
            else
            {
                Process.Start(serverUrl);
            }
        }
    }
}
