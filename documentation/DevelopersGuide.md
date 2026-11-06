# VideoPrompter — Developer Guide

**Current implementation:** .NET 10 · Blazor Interactive Server · JavaScript Web Speech API · Windows x64 release

## 1. Prerequisites and Tools

| Tool | Purpose |
| --- | --- |
| Visual Studio 2026 | Primary C# / Blazor development and debugging |
| .NET 10 SDK | Restore, build, run, publish |
| Edge or Chrome | Browser UI, speech recognition, microphone, folder access |
| Arduino IDE | **Not required** for this repository |
| VS Code | Markdown editing and preview |
| Git / GitHub Desktop | Source control |
| GitHub Actions | Automated Windows package build and release |
| OBS or another recorder | Optional end-to-end recording and caption tests |

Use the installed .NET 10 SDK and a compatible modern browser. Windows is the **packaged and tested** environment. ASP.NET Core itself is cross-platform, but this repository's launcher/release workflow targets Windows x64; Linux and macOS deployments are not verified here.

## 2. Dependencies

`source/VideoPrompter/VideoPrompter.csproj` targets `net10.0` and uses `Microsoft.NET.Sdk.Web`. There are **no explicit third-party NuGet package references** in the current project file. ASP.NET Core / Blazor come from the .NET web SDK/shared framework.

Browser dependencies: `SpeechRecognition` / `webkitSpeechRecognition`, JavaScript interop, File System Access API for folder selection, IndexedDB for directory handles, and `localStorage` for speech source preference.

**Not installed:** Moonshine, ONNX Runtime, Silero VAD, and a local speech engine. These are potential future options, not current dependencies.

## 3. Repository Layout

| Path | Contents |
| --- | --- |
| `README.md` | End-user description, installation, quick start |
| `source/VideoPrompter/VideoPrompter.csproj` | .NET target and project definition |
| `source/VideoPrompter/Program.cs` | Service registration and HTTP pipeline |
| `source/VideoPrompter/Components/App.razor` | HTML document and browser script/style loading |
| `source/VideoPrompter/Components/Pages/Home.razor` | Main UI, state, interop callbacks |
| `source/VideoPrompter/Services/ScriptTracker.cs` | C# fuzzy word matcher |
| `source/VideoPrompter/wwwroot/prompter.js` | Recognition, scrolling, folder selection, captions |
| `source/VideoPrompter/wwwroot/app.css` | UI styling |
| `packaging/Start-VideoPrompter.cmd` | Windows launcher |
| `packaging/README-Windows.txt` | Packaged user instructions |
| `.github/workflows/windows-download.yml` | CI publish, ZIP artifact, tagged release |
| `LICENSE`, `NOTICE` | Apache 2.0 license and attribution |
| `documentation/` | Overview, architecture, developer docs, and images |

## 4. Settings and Configuration

Unlike CasterFrameworkUi, **VideoPrompter has no database connection string** and no checked-in `appsettings.json` at `source/VideoPrompter/appsettings.json` in the inspected revision.

| Setting | Source / behavior |
| --- | --- |
| Server address | ASP.NET Core configuration or `--urls` argument; Windows launcher uses `http://127.0.0.1:5088` |
| Text folder | Browser directory picker; handle stored in IndexedDB |
| SRT folder | Browser directory picker; defaults to Text Folder when unset, otherwise browser download |
| Speech source | Browser `localStorage` key `VideoPrompterSpeechEngine` |
| Script, font size, mirror, session state | In-memory Razor component state; not persisted across sessions |
| Recognition language | `recognition.lang = 'en-US'` in `prompter.js` |
| SRT cue grouping/timing | JavaScript `recordScriptCaption` in `prompter.js` |

Directory handles are **browser permissions**, not server filesystem paths. A server-side `File.ReadAllText` call cannot use those browser handles. The folder picker requires a secure context (localhost or HTTPS) and supported browser APIs. Persisted handles may need reauthorization.

For future ASP.NET Core settings, prefer normal .NET configuration providers (`appsettings.json`, environment variables, user secrets for development). Do not store secrets in `wwwroot` or browser storage.

## 5. Build and Run

From the repository root:

```powershell
dotnet restore source/VideoPrompter/VideoPrompter.csproj
dotnet build source/VideoPrompter/VideoPrompter.csproj
dotnet run --project source/VideoPrompter/VideoPrompter.csproj --urls http://127.0.0.1:5088
```

Open `http://127.0.0.1:5088` in Edge or Chrome, allow microphone permission, load a script, and test Start/Stop and tracking. If the port is occupied, choose another local port. The browser handles the actual microphone and speech recognition.

In Visual Studio 2026, open `source/VideoPrompter/VideoPrompter.csproj` and run/debug the web project. Check the actual listening URL in the console when using the IDE.

## 6. Application Startup and Runtime

`Program.cs` registers `AddRazorComponents().AddInteractiveServerComponents()`, serves static files, enables antiforgery, and maps the Blazor app with `AddInteractiveServerRenderMode()`.

The Blazor component runs in the server process, maintaining per-circuit state. Browser events and speech transcripts arrive via Blazor/JavaScript interop. The application does not need IIS, SQL Server, a separate backend, or an OBS plugin. OBS is a separate recording application.

The Windows launcher starts `VideoPrompter.exe --urls http://127.0.0.1:5088` and opens the browser. Closing the server console stops the application.

## 7. Architecture and Code Navigation

Start at `Home.razor` for UI behavior. It creates two `ScriptTracker` instances (live following and caption matching), stores the script/session state, and exposes JS callbacks such as `OnTranscript`, `OnFinalCaption`, and folder notifications.

Start at `prompter.js` for speech API behavior, recognition events, folder access, storage, scrolling, caption cue timing, and SRT export.

Start at `ScriptTracker.cs` to tune normalization, candidate search, edit distance, and position advancement. Changes here can affect both the live highlight and captions.

Read [Architecture](Architecture.md) for a flow diagram and ownership boundaries.

## 8. Build, Packaging, and Release

The GitHub Actions workflow `.github/workflows/windows-download.yml` runs on pushes to `main`, version tags `v*`, and manual dispatch. It:

1. Checks out the repository and installs .NET 10.
2. Publishes a **self-contained** `win-x64` single-file application.
3. Copies the Windows launcher and packaged instructions.
4. Creates `VideoPrompter-Windows-x64.zip` and uploads a workflow artifact.
5. Creates a GitHub Release when triggered by a `v*` tag.

Equivalent publish command:

```powershell
dotnet publish source/VideoPrompter/VideoPrompter.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:EnableCompressionInSingleFile=true -o publish
```

The Windows ZIP includes the self-contained runtime. The executable is currently unsigned; SmartScreen warnings are possible. Releases and artifacts are available through the repository's [Actions](https://github.com/batpox/VideoPrompter/actions/workflows/windows-download.yml) and [Releases](https://github.com/batpox/VideoPrompter/releases) pages.

## 9. Testing and Troubleshooting

**Smoke-test checklist:**

- Build succeeds and local URL opens.
- Paste/load a script; words render and are clickable.
- Start/Stop recognition and microphone permission work in Edge.
- Interim recognition advances the highlight without unwanted reset.
- Pause speaking; scrolling should not run ahead on its own.
- Reset and click-to-seek work.
- Font size and mirror mode work in a narrow window.
- Text-folder selection lists `.txt` / `.md`; reauthorization works.
- SRT export uses original script words and approximate cue times.
- Speech Source = Local disables Start and explains that it is not implemented.
- Close/reopen to check browser-stored speech preference and folder handles.

**Common failures:**

| Symptom | Check |
| --- | --- |
| Browser page unavailable | Server process, `--urls`, port conflict, console errors |
| Start reports unsupported recognition | Use Edge/Chrome; verify Web Speech API support |
| Microphone unavailable | Browser permission, OS microphone access, device selection |
| Folder picker unavailable | Edge/Chrome and localhost/HTTPS secure context |
| Folder no longer accessible | Browser may require renewed permission |
| SRT empty | Requires **final** recognition results, not merely a pasted script |
| Caption timing differs from recording | Recognition arrival times are approximate; align in video editor |
| Blazor disconnects | Server process and browser-server connection |

No automated test suite was verified in the inspected files; do not treat this checklist as executed test results.

## 10. Security, Privacy, and Limitations

- Browser recognition may send microphone audio to a remote service. Do not describe the current application as fully offline.
- The local launcher binds to loopback; exposing the server to a LAN or Internet requires a deliberate security design, TLS, and access controls.
- The Blazor circuit carries transcript text and interactive state to the ASP.NET Core process.
- Browser-selected files are accessed through browser APIs and user-granted permissions, not through unrestricted server filesystem access.
- Do not claim exact word-level SRT timestamps.

## 11. Maintenance and Documentation Conventions

- Keep C# script matching separate from browser-specific recognition and file APIs.
- Distinguish implemented features from planned features in code, UI, and documentation.
- Update both recognition and caption paths when modifying transcript matching.
- Validate browser permissions, error handling, and interop cleanup for new JS features.
- Put project documentation in `documentation/`; screenshots in `documentation/images/`; link images relatively.
- Edit Markdown in VS Code. No Visual Studio solution/project entries are required.
- Commit documentation alongside related changes to `main`.

## 12. References

- [Documentation Index](README.md)
- [Project Overview](Overview.md)
- [Architecture](Architecture.md)
- [Repository README](../README.md)
- [License](../LICENSE) and [Attribution](../NOTICE)
