VideoPrompter - Windows 64-bit

1. Extract the entire ZIP to a folder you own (for example Documents\VideoPrompter).
2. Double-click Start-VideoPrompter.cmd. It starts VideoPrompter.exe and opens your browser.
3. Allow microphone access in Edge or Chrome when prompted.
4. Paste a script under Script, click Load Script, then Start.
5. Stop recognition when finished. Export SRT to save approximate captions based on your original script.

VideoPrompter is a local ASP.NET Core web application. The EXE starts a local
server at http://127.0.0.1:5088, and the interface opens in your browser.
Close the VideoPrompter Server console window when finished.

No separate .NET installation is required for this self-contained Windows build.
Browser speech recognition MAY use a cloud service. Local speech recognition is
planned but is not currently implemented. Internet access may therefore be
needed for speech recognition. Never assume microphone audio stays offline.

If Windows SmartScreen warns about an unsigned download, verify the file came
from the official GitHub repository before deciding whether to run it.
