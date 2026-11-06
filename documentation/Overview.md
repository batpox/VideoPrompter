# VideoPrompter — Project Overview

**Platform:** .NET 10 · ASP.NET Core Blazor Interactive Server · Browser Web Speech API

## Purpose

VideoPrompter is a standalone browser-based teleprompter intended for recording videos with OBS or another recording tool. The speaker can paste a script or load a `.txt` / `.md` file, then speak while the application highlights and scrolls to the corresponding words.

The Windows distribution starts a local ASP.NET Core server and opens the UI in a browser; it is **not** a native desktop UI. The program is free/open source under Apache License 2.0.

## Main Capabilities

- Paste/edit and load scripts; click a word to seek.
- Follow spoken words with browser speech recognition, including interim results.
- Highlight current/past words, auto-scroll, reset, resize text, and mirror display.
- Choose a script folder and optional SRT output folder in supported browsers.
- Export approximate SRT captions using **original script text** rather than the recognized transcript.
- Run in a narrow browser window beside OBS.

## Typical Workflow

1. Start VideoPrompter and open its local web page.
2. Paste a script or choose a folder containing `.txt` / `.md` scripts.
3. Load the script; adjust font size and mirror mode.
4. Start recognition and grant microphone permission.
5. Speak while the highlighted position follows the script.
6. Stop and export SRT captions if needed.

## Current Limitations

- Browser speech recognition is the **only implemented** speech engine. The selectable local engine is a placeholder and disables Start.
- Browser speech recognition may use a cloud service. **Do not assume microphone audio stays local.**
- Speech recognition requires browser support; Edge is the tested development browser, Chrome is a practical alternative, and Firefox is not recommended for recognition.
- SRT timing is **estimated** from final recognition-result arrival times, not exact per-word audio timestamps. Review cues in the video editor.
- Script matching is heuristic; skipped passages, improvisation, and repeated phrases may affect tracking.
- Folder access relies on the browser File System Access API and may require renewed permissions.
- The current packaged release targets Windows x64; other runtime targets require separate validation and packaging.

## Related Documents

- [Architecture](Architecture.md) — system boundaries and recognition/caption flows
- [Developer Guide](DevelopersGuide.md) — source layout, tools, configuration, build, and deployment
- [Documentation Index](README.md)
- [Repository README](../README.md) — user installation and release instructions
