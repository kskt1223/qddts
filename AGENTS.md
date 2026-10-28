# Repository Guidelines

This directory has no application files, build configuration, tests, or Git metadata yet. Use these guidelines as a starting point and update them when the project adopts specific tools.

## Project Structure & Module Organization

When adding the initial implementation, organize application code under `src/`, automated tests under `tests/`, and static resources under `assets/` where appropriate. Place supporting documentation in `docs/`. Keep configuration files at the root and document any framework-specific layout in `README.md`.

## Build, Test, and Development Commands

No installation, build, development, lint, or test commands are configured. When introducing a toolchain:

- Document exact setup and execution commands in `README.md`.
- Provide repeatable commands for local development, builds, and tests.
- Commit the dependency manifest and applicable lockfile.
- Update this guide with verified commands; do not assume `npm test` or `make build` exists.

## Coding Style & Naming Conventions

Follow the conventions of the selected language and framework. Use consistent indentation within each file and descriptive names that reflect responsibility. Prefer small, focused modules. Add formatter and linter configuration when tooling is introduced, and run those checks before requesting review.

## Testing Guidelines

No testing framework or coverage threshold is established. Introduce tests alongside behavior changes and bug fixes. Use descriptive test names that explain the expected behavior, and follow the selected framework’s file naming conventions. Document how to run individual tests and the full suite.

## Commit & Pull Request Guidelines

Git history is unavailable, so no existing commit convention can be inferred. Use concise, imperative commit subjects, such as `Add initial project configuration`. Keep commits focused.

Pull requests should explain the purpose, summarize changes, link relevant issues, and list validation performed. Include screenshots for visible interface changes and identify any required configuration steps.

## Security & Configuration

Keep credentials and local configuration out of version control. Provide placeholder values in an example configuration file and document required environment variables. Exclude generated artifacts and dependency directories through `.gitignore` when applicable.
