# VideoPrompter

A compact, independently runnable **.NET 10 Blazor Server** teleprompter designed to share a monitor with OBS or other video-recording software. VideoPrompter follows your spoken script, highlights its current position, and scrolls as you speak.

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
6. Select **Export SRT** to download subtitles generated from finalized speech-recognition results. Export after stopping or during the session; starting a new session clears the previous captions.

### SRT Timing Limitations

The browser Web Speech API does not supply reliable per-word audio timestamps. VideoPrompter therefore estimates each subtitle cue's start and end from recognition-result arrival time and spoken word count. Captions contain the **recognized speech**, which may differ from the pasted script, and may need timing/text adjustments in your video editor. Start recognition when you start recording in OBS if you want their timelines to align; otherwise offset the captions in post-production. **Export SRT** needs finalized recognition results; merely pasting a script does not produce timed captions.

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
