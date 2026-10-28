# VideoPrompter

Compact, side-by-side teleprompter for recording with OBS or other video software.

## Status
**First Blazor port / prototype.** .NET 10 Blazor Server UI, responsive narrow window, script editing, clickable word seeking, mirrored display, and C# fuzzy position matching.

**Important limitation:** This prototype currently uses the browser SpeechRecognition API. It is **not** a complete port of Lars's offline Moonshine/Silero inference pipeline; browser speech services may require network access and may send audio to a provider. Do not assume offline/private speech processing yet. A full equivalent requires migrating the AudioWorklet, VAD and ONNX workers and testing interoperability.

## Run
From `source/VideoPrompter` run `dotnet run`, then open the localhost URL in Edge or Chrome. Grant microphone access. Resize the window beside OBS. Import/paste your script using **Script**.

## Acknowledgment
Inspired by [PromptMe-AI](https://github.com/larsbaunwall/promptme-ai), copyright its respective contributors, licensed Apache-2.0. New VideoPrompter code is Apache-2.0. See LICENSE and NOTICE.

No source code from Lars's workers is included in this prototype.