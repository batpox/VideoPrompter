# VideoPrompter Documentation

This folder contains the standard project documentation set.

| Document | Purpose |
| --- | --- |
| [Overview](Overview.md) | Purpose, features, workflows, scope, and limitations |
| [Architecture](Architecture.md) | Components, data flows, state ownership, speech tracking, and SRT export |
| [Developer Guide](DevelopersGuide.md) | Tools, dependencies, repository layout, configuration, development environment, build, packaging, and maintenance |

Images and screenshots belong in [images/](images/). Reference them from Markdown using relative paths such as `![Prompter screen](images/PrompterScreen.png)`. Do not add broken image references before the corresponding images exist.

For installation instructions and releases, see the [repository README](../README.md).

## Documentation Standard

For other projects, use the same structure: `documentation/README.md`, `Overview.md`, `Architecture.md`, `DevelopersGuide.md`, and `images/`. Document the **actual implementation** separately from future plans. Keep all links relative, edit in VS Code, and commit Markdown/images with the source. No Visual Studio project or solution changes are necessary.
