# VideoPrompter

A compact, independently runnable **.NET 10 Blazor Server** teleprompter designed to share a monitor with OBS or other video-recording software. VideoPrompter follows your spoken script, highlights its current position, and scrolls as you speak.

## What Is VideoPrompter?

VideoPrompter is a free, open-source teleprompter for recording presentations, tutorials, and demonstrations. Put the prompter beside OBS or another recording window, paste your script, and speak naturally. It highlights and scrolls through the script as speech is recognized, so you can keep your place without a fixed scrolling speed.

**Features:** adjustable text size, mirrored display, editable scripts, click-to-seek, script files from a chosen folder, and SRT subtitle export using the **original script wording**. Subtitle timing is estimated and may need adjustment.

**How it works:** The Windows executable runs a small local .NET web server; the prompter opens in Edge or Chrome. It does **not** install a traditional desktop app. Browser speech recognition may use an online service, so microphone audio is **not guaranteed to remain on your PC**. Offline speech recognition is a planned option, not yet available.

## Download for Windows

**[Get the latest release](https://github.com/batpox/VideoPrompter/releases/latest)** — when a versioned release is published, download `VideoPrompter-Windows-x64.zip` from its **Assets** section. If there is no release yet, see [Actions → Windows Download](https://github.com/batpox/VideoPrompter/actions/workflows/windows-download.yml) for a successful build's artifact (GitHub sign-in may be required).

1. Download `VideoPrompter-Windows-x64.zip` and **extract all files** into a folder.
2. Double-click **`Start-VideoPrompter.cmd`**. It starts the EXE and opens `http://127.0.0.1:5088` in your browser.
3. Allow microphone access when prompted, select **Script**, paste or edit your text, then select **Load Script**.
4. Select **Start**, speak naturally, and select **Stop** when finished. Use **Export SRT** for approximate subtitles.
5. Close the **VideoPrompter Server** console window to shut down the app.

This Windows x64 package is self-contained; **no separate .NET runtime installation is needed**. The executable is currently unsigned, so Windows SmartScreen may display a warning. Verify the download is from this repository before running it. If port 5088 is already in use, close the conflicting app or run the EXE manually with a different `--urls` value.

**For developers:** See [Run Locally](#run-locally) below to run from source with .NET 10.

## Video Demonstration

A YouTube walkthrough is coming soon. This section will link to it once the video is ready.

## Current Status

Working prototype. The application supports a narrow browser window, script editing, word-by-word highlighting and scrolling, click-to-seek, reset, adjustable text size, mirrored display, and SRT subtitle export. Speech following uses interim recognition results for responsive tracking.

This is **not** a complete conversion of Lars Baunwall's PromptMe-AI recognition pipeline.

## Architecture

| Component | Current implementation | Responsibility |
| --- | --- | --- |
| Host and UI | ASP.NET Core / .NET 10 Blazor Server | Runs the application independently and renders the interactive teleprompter |
| Speech-to-text | Browser Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) | Converts microphone audio into interim and final transcripts |
| Script tracking | C# `ScriptTracker` service | Tokenizes the script and uses fuzzy matching to locate the spoken words |
| Browser integration | `wwwroot/prompter.js` | Starts/stops recognition and scrolls the active word into view |
| Presentation | Razor components and `wwwroot/app.css` | Compact layout, highlighting, font sizing, and mirror mode |

### Recognition Flow

1. The browser requests microphone permission and starts its speech-recognition implementation.
2. Interim and final transcript text is passed from JavaScript to the Blazor Server component through JS interop.
3. The C# `ScriptTracker` matches the transcript against the script and advances the active word.
4. Blazor updates the highlighted text; JavaScript scrolls the current word into view.

**Privacy and connectivity:** VideoPrompter's C# matcher is our code, but the browser controls speech recognition. Depending on the browser and its speech backend, audio may be processed by an online service. Do **not** assume recognition is offline or that microphone audio stays on the computer. Because this is Blazor Server, interactive application state and transcript callbacks also communicate with the local ASP.NET Core server over its Blazor connection.

## Browser Support

VideoPrompter does **not** require Microsoft Edge. The Blazor UI can run in modern browsers, but **speech following requires a browser that exposes the Web Speech recognition API**.

| Browser | Practical expectation |
| --- | --- |
| Microsoft Edge | Tested in our current development setup; working |
| Google Chrome | Generally supports browser speech recognition; verify microphone behavior on your machine |
| Safari | Speech recognition support varies by platform/version; not tested here |
| Firefox | Speech recognition is not reliably available; not recommended for the current implementation |

Recognition availability, network requirements, accuracy, and privacy behavior are determined by the browser and may change with browser versions.

## Run Locally

Requires the **.NET 10 SDK** and a browser with compatible speech recognition.

1. Open `source/VideoPrompter/VideoPrompter.csproj` in Visual Studio 2026, or run `dotnet run` from `source/VideoPrompter`.
2. Open the local URL shown by ASP.NET Core in Edge or Chrome.
3. Grant microphone access when prompted.
4. Select **Script** to edit or paste your text, then **Load Script**.
5. Select **Start** and speak naturally. Resize the browser beside OBS. **Stop** ends recognition; **Reset** returns to the beginning.
6. Select **Export SRT** to save subtitles using the original script words aligned against finalized speech-recognition results. Export after stopping or during the session; starting a new session clears the previous captions.

### SRT Timing Limitations

The browser Web Speech API does not supply reliable per-word audio timestamps. VideoPrompter therefore estimates each subtitle cue's start and end from recognition-result arrival time and spoken word count. Captions use **the original script's spelling, capitalization and punctuation**, not the browser's transcript. The final recognized speech is used only to match script position and estimate timing. Cues are grouped into approximately eight script words. If a match jumps too far (for example, because a sentence was skipped), the intervening words are not emitted. Unmatched speech or improvisation is not added. Timing and match boundaries may still need adjustment in your video editor. Start recognition when you start recording in OBS if you want their timelines to align; otherwise offset the captions in post-production. **Export SRT** needs finalized recognition results; merely pasting a script does not produce timed captions.

The application runs as its own ASP.NET Core process; it does **not** require another application to host it. It still needs a browser for the user interface.

## Potential Future Speech Engine: Moonshine

[Moonshine](https://github.com/usefulsensors/moonshine) is a local speech-to-text model designed for efficient transcription. Lars's PromptMe-AI combines local Moonshine inference with Silero voice activity detection (VAD) and an audio-processing pipeline.

**Moonshine is not currently installed or used by VideoPrompter.** An optional Moonshine/ONNX-based engine could eventually offer local/offline recognition, more control over transcription timing, and reduced dependence on browser speech services. It would also add model distribution, audio capture, inference, and performance complexity. Better speed or accuracy is **not guaranteed**; these should be measured against the working browser engine before switching. A .NET ONNX Runtime integration is a possible design, not an implemented feature.

The near-term approach is to retain the current browser engine as a working baseline and improve the UI, script persistence, and diagnostics before evaluating an alternative.

## Attribution and License

Inspired by [Lars Baunwall's PromptMe-AI](https://github.com/larsbaunwall/promptme-ai), licensed under Apache 2.0. VideoPrompter is also licensed under **Apache 2.0**; see [LICENSE](LICENSE) and [NOTICE](NOTICE).

No source code from Lars's recognition workers is included in this prototype.

## Folder Settings

Open **Settings** to choose a Text Folder and optionally an SRT Folder. The Text Folder lists .txt and .md files; select one and click **Load Text File**. You can still paste scripts through **Script**.

**Export SRT** writes to the selected SRT Folder, or to the Text Folder if the SRT Folder is blank. With neither selected, the browser downloads the file normally. **Use Text Folder** clears the separate SRT destination.

Folder selection requires the File System Access API (desktop Edge or Chrome, on localhost or HTTPS). The browser stores folder handles for later sessions but may request permission again. The UI displays folder names rather than full Windows paths.

## Speech Source Selection

**Settings → Speech Source** offers **Browser Speech Recognition (Edge / Chrome)** and **Local Speech Engine (planned)**. The selection is saved in this browser's local storage and restored on reload. Browser recognition is the only operational engine today; selecting Local disables Start and clearly indicates that local recognition has not been implemented. Switching sources is disabled while recognition is running. This is a future integration point, not a claim that offline recognition is already available.

The speech source is passed to the JavaScript recognition entry point. Transcript matching and SRT generation remain independent of which recognition backend is eventually implemented.

## Support VideoPrompter

VideoPrompter is free and open source. If you find it useful and would like to support its development, you're welcome to [leave a tip via PayPal](https://paypal.me/metalBlender). Donations are entirely optional.
