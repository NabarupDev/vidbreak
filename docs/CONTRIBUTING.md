# Filename: CONTRIBUTING.md

# Contributing to vidbreak

Thank you for your interest in making vidbreak better. This guide covers everything you need to set up a dev environment, write code that passes CI, and get your pull request merged.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Commit Convention](#commit-convention)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

---

## Code of Conduct

We follow the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/) v2.1. Short version: be kind, be professional, assume good intent.

---

## Ways to Contribute

- **Bug reports** — Open an issue with a minimal reproduction
- **Feature requests** — Open an issue with the use case and proposed API
- **Bug fixes** — Submit a PR with a failing test that your fix makes pass
- **New presets** — Add a preset with documented flag rationale
- **Docs improvements** — Fix typos, add examples, improve clarity
- **Performance benchmarks** — Run and submit benchmark results on your hardware

---

## Development Setup

### Requirements

- Node.js ≥ 18 LTS
- FFmpeg ≥ 5.0 installed on system (for integration tests)
- Git

### Steps

```bash
# 1. Fork the repo, then clone your fork
git clone https://github.com/YOUR_USERNAME/vidbreak.git
cd vidbreak

# 2. Install dependencies
npm ci

# 3. Build the project
npm run build

# 4. Run unit tests (no FFmpeg required)
npm test

# 5. Run integration tests (requires FFmpeg)
npm run test:integration

# 6. Start watch mode for development
npm run build:watch
```

### Verify Your Setup

```bash
npm run typecheck   # Should emit zero errors
npm run lint        # Should emit zero warnings
npm test            # Should pass all unit tests
```

---

## Project Structure

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full module map. Key areas:

| Path | What it contains |
|------|-----------------|
| `src/encoders/` | One file per output type (video, audio, HLS, thumbnail) |
| `src/presets/` | Encoding preset definitions (flag sets) |
| `src/runner/` | FFmpeg process spawning and stderr parsing |
| `src/planner/` | Converts user options into a flat job list |
| `src/types/` | All TypeScript interfaces (no logic here) |
| `tests/unit/` | Pure logic tests — no FFmpeg |
| `tests/integration/` | Real FFmpeg tests against fixture video |

---

## Coding Standards

### TypeScript

- **Strict mode always on** — `"strict": true` plus `noUncheckedIndexedAccess`
- **No `any`** — Use `unknown` with narrowing, or explicit generics
- **Explicit return types** on all exported functions
- **Const assertions** for literal types
- **Type imports** — use `import type { ... }` for type-only imports

### Style

- **2-space indentation**
- **Single quotes** for strings
- **Trailing commas** in multiline objects and arrays
- **No semicolons** (handled by ESLint)
- **120-character line limit**

### Patterns

- **Async/await** everywhere — no raw Promise chains or callbacks
- **Errors as values** — functions that can fail should return `Result<T, E>` or include errors in their return type; only throw for truly unrecoverable states
- **Immutable options** — never mutate the `options` object passed by the user
- **Named exports** only — no default exports except in `index.ts`

### FFmpeg Flags

- Every non-obvious FFmpeg flag must have a comment explaining why it's there
- Prefer documented flag rationale in `FFMPEG_STRATEGY.md` for preset flags

---

## Commit Convention

vidbreak uses [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

### Types

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `test` | Adding or fixing tests |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `chore` | Build process, dependency updates |
| `ci` | CI/CD changes |

### Scopes

`runner`, `planner`, `encoders`, `presets`, `types`, `cli`, `utils`, `errors`, `hls`, `audio`, `thumbnails`

### Examples

```
feat(encoders): add AV1 SVT encoder auto-detection
fix(runner): handle FFmpeg processes that exit before writing stderr
docs(readme): add migration guide from fluent-ffmpeg
test(planner): add coverage for portrait video resolution filtering
```

---

## Testing Requirements

All PRs must:

1. **Pass all existing tests** — `npm test` must exit 0
2. **Include tests for new behaviour** — any new feature needs unit tests
3. **Not decrease coverage below thresholds** — run `npm run test:coverage` and check
4. **Include integration tests for new encoders** — if you add a new format/codec

See [TESTING_PLAN.md](./TESTING_PLAN.md) for the full testing strategy.

---

## Pull Request Process

### Before Opening a PR

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes (zero warnings)
- [ ] `npm test` passes
- [ ] New code has tests
- [ ] You've updated relevant docs (README, API_DESIGN.md, etc.)

### PR Title

Use the same format as commit messages: `feat(scope): description`

### PR Body Template

```markdown
## What does this PR do?
<!-- Short description -->

## Why is this change needed?
<!-- Link to issue or explain the problem -->

## How was it tested?
<!-- Unit tests, integration tests, manual testing steps -->

## Breaking changes?
<!-- List any breaking changes to the public API -->
```

### Review Process

- All PRs require at least 1 approving review
- Maintainers aim to review within 3 business days
- Address all review comments before requesting re-review
- Squash merge preferred for feature PRs; merge commit for releases

---

## Adding a New Preset

1. Create `src/presets/YOURNAME.preset.ts`
2. Export a `PresetDefinition` object (see existing presets for the interface)
3. Add the preset name to the `PresetName` union in `src/types/options.types.ts`
4. Register it in `src/presets/index.ts`
5. Document every non-obvious flag with a comment
6. Add the rationale to `FFMPEG_STRATEGY.md`
7. Add a unit test in `tests/unit/presets/`

---

## Release Process

Releases are done by maintainers only:

```bash
# Bump version, update CHANGELOG, create git tag, publish to npm
npm run release
```

`release-it` handles:
- Version bump (prompted)
- `CHANGELOG.md` update from conventional commits
- `git tag vX.Y.Z`
- `npm publish`
- GitHub release creation

---

## Getting Help

- **Questions about the codebase** → [GitHub Discussions](https://github.com/vidbreak/vidbreak/discussions)
- **Bug reports** → [GitHub Issues](https://github.com/vidbreak/vidbreak/issues)
- **Security vulnerabilities** → security@vidbreak.dev (do not open public issues)
