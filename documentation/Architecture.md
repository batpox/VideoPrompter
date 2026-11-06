# VideoPrompter — Architecture

## Architectural Summary

VideoPrompter is a **single ASP.NET Core .NET 10 Blazor Interactive Server** application. Its Razor component and C# script matching execute on the server; microphone access, speech recognition, folder handles, browser storage, scrolling, and SRT file writing execute in the browser.

```text
                    Browser (Edge / Chrome)
  ┌───────────────────────────────────────────────────────┐
  │ Prompter UI / rendered script                         │
  │ Web Speech API → interim/final transcript             │
  │ wwwroot/prompter.js                                   │
  │   ├─ scroll/highlight interop                         │
  │   ├─ SRT timing, cue collection, export               │
  │   ├─ File System Access API → .txt/.md, .srt           │
  │   ├─ IndexedDB → folder handles                       │
  │   └─ localStorage → speech-engine preference          │
  └───────────────────────┬───────────────────────────────┘
                          │ Blazor circuit / JS interop
  ┌───────────────────────▼───────────────────────────────┐
  │ ASP.NET Core / Kestrel (.NET 10)                      │
  │ Components/Pages/Home.razor                           │
  │   ├─ page and session state                           │
  │   ├─ JSInvokable transcript/folder callbacks          │
  │   └─ Services/ScriptTracker.cs                        │
  │        └─ tokenization and fuzzy script matching      │
  └───────────────────────────────────────────────────────┘
```

## Source Components

| Component | File | Responsibility |
| --- | --- | --- |
| Host | `source/VideoPrompter/Program.cs` | Registers Razor/Interactive Server and ASP.NET Core pipeline |
| HTML shell | `source/VideoPrompter/Components/App.razor` | Loads CSS, Blazor runtime, and `prompter.js` |
| UI/controller | `source/VideoPrompter/Components/Pages/Home.razor` | Script editing, buttons, session state, interop callbacks |
| Matcher | `source/VideoPrompter/Services/ScriptTracker.cs` | Word indexing, fuzzy matching, current script position |
| Browser bridge | `source/VideoPrompter/wwwroot/prompter.js` | Recognition, scrolling, folder APIs, caption assembly/export |
| Styles | `source/VideoPrompter/wwwroot/app.css` | Prompter presentation, highlighting, mirror mode |

## Speech Recognition and Tracking

1. `Home.razor` invokes `videoPrompter.start` through JS interop.
2. JavaScript instantiates `SpeechRecognition` or `webkitSpeechRecognition` in the browser, enabling continuous and interim results.
3. Browser recognition events invoke `Home.OnTranscript(text, isFinal)`.
4. The C# `ScriptTracker` tokenizes text, normalizes a few equivalent word forms, evaluates candidate positions with edit distance and a forward-position bias, and updates the script position.
5. Blazor rerenders word classes (`past`, `current`); JavaScript scrolls the current word into view.

`Home.razor` keeps a second `ScriptTracker` for finalized-caption matching. This separates responsive interim UI tracking from SRT cue generation.

**Important:** The browser owns the microphone and recognition backend. The C# server does not capture raw microphone audio in the current implementation. The browser's recognition service may process audio remotely.

## SRT Caption Flow

- A **final** recognition result invokes `Home.OnFinalCaption` to identify the corresponding original-script words.
- `prompter.js` queues caption operations, estimates cue time from elapsed browser session time, and groups original words into approximately eight-word cues.
- `Export SRT` writes a timestamped `.srt` file to the chosen browser-accessible folder, or triggers a browser download.
- Recognition results do not provide reliable word timestamps; these are **estimates**, not a precise transcript alignment.
- Starting a new recognition session clears prior captions; export before starting again.

## Settings and Persistence Boundaries

| Data | Location | Persistence |
| --- | --- | --- |
| Active script, tracking position, UI state, font size, mirror | Blazor component | In-memory session/circuit state |
| Speech source selection | Browser `localStorage` key `VideoPrompterSpeechEngine` | Persists in that browser |
| Selected folder handles | Browser IndexedDB `VideoPrompterFolders`, `handles` store | Persists subject to browser permissions |
| SRT captions | Browser JS memory until exported | Exported file or browser download |
| Server URL | ASP.NET Core hosting/launcher arguments | Per launch |
| Recognition backend | Browser Web Speech API | Browser/platform dependent |

The selected `local` speech engine is **not implemented**. It is an extension point, not an offline mode.

## Runtime and Trust Boundaries

The default Windows launcher binds to **127.0.0.1:5088**, so the web application is intended for local access. The Blazor Server circuit sends interactive state/transcript callbacks to the local server. If hosting on a network, use deliberate binding, TLS, access controls, and review microphone and folder API behavior; the current prototype is not designed as a multiuser hosted service.

There is no SQL database or EF Core layer in the current project.

## Extension Guidance

- Keep recognition transport/browser-specific logic behind the JS bridge or a deliberate abstraction; keep `ScriptTracker` independent of the engine.
- Maintain the separation between interim word-following and finalized caption generation.
- Release speech recognition and JS/.NET callback references on shutdown/disposal.
- Validate folder permissions before reading or writing; never assume persisted handles remain authorized.
- Test recognition accuracy and SRT timing against actual recordings before claiming precision.

See [Developer Guide](DevelopersGuide.md) and [Project Overview](Overview.md).
