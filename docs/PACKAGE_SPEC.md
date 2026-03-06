# Filename: PACKAGE_SPEC.md

# vidbreak — Package Specification

> npm package configuration, dependencies, build setup, and publishing strategy

---

## package.json

```json
{
  "name": "vidbreak",
  "version": "0.1.0",
  "description": "The modern, lightweight, drop-in replacement for fluent-ffmpeg",
  "keywords": [
    "ffmpeg", "video", "transcoding", "hls", "adaptive-streaming",
    "mp4", "webm", "av1", "video-processing", "typescript"
  ],
  "homepage": "https://github.com/vidbreak/vidbreak",
  "repository": {
    "type": "git",
    "url": "https://github.com/vidbreak/vidbreak.git"
  },
  "bugs": {
    "url": "https://github.com/vidbreak/vidbreak/issues"
  },
  "license": "MIT",
  "author": "vidbreak contributors",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.cjs",
      "types": "./dist/types/index.d.ts"
    },
    "./utils": {
      "import": "./dist/esm/utils/index.js",
      "require": "./dist/cjs/utils/index.cjs",
      "types": "./dist/types/utils/index.d.ts"
    },
    "./errors": {
      "import": "./dist/esm/errors/index.js",
      "require": "./dist/cjs/errors/index.cjs",
      "types": "./dist/types/errors/index.d.ts"
    }
  },
  "main": "./dist/cjs/index.cjs",
  "module": "./dist/esm/index.js",
  "types": "./dist/types/index.d.ts",
  "bin": {
    "vidbreak": "./dist/esm/cli/index.js"
  },
  "files": [
    "dist/",
    "README.md",
    "LICENSE",
    "CHANGELOG.md"
  ],
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "build": "tsup",
    "build:watch": "tsup --watch",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "prepublishOnly": "npm run build && npm run typecheck && npm run test",
    "release": "release-it"
  },
  "dependencies": {
    "p-limit": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "eslint": "^8.0.0",
    "release-it": "^17.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.4.0",
    "vitest": "^1.0.0"
  },
  "peerDependencies": {
    "ffmpeg-static": ">=5.0.0"
  },
  "peerDependenciesMeta": {
    "ffmpeg-static": {
      "optional": true
    }
  }
}
```

---

## TypeScript Configuration

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist/types",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

---

## Build System: tsup

### `tsup.config.ts`

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'utils/index': 'src/utils/index.ts',
    'errors/index': 'src/errors/index.ts',
    'cli/index': 'src/cli/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  target: 'node18',
  outDir: 'dist',
  outExtension: ({ format }) => ({
    js: format === 'cjs' ? '.cjs' : '.js',
  }),
  banner: {
    js: '// vidbreak — https://github.com/vidbreak/vidbreak',
  },
});
```

---

## Directory Structure

```
vidbreak/
├── src/
│   ├── index.ts
│   ├── vidbreak.ts
│   ├── builder/
│   ├── planner/
│   ├── scheduler/
│   ├── runner/
│   ├── encoders/
│   ├── presets/
│   ├── types/
│   ├── utils/
│   ├── errors/
│   └── cli/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│       └── sample.mp4          ← Short test video (< 5 seconds)
├── dist/                        ← Generated, git-ignored
├── docs/                        ← TypeDoc output
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── .eslintrc.json
├── .gitignore
├── .npmignore
├── CHANGELOG.md
├── LICENSE
└── README.md
```

---

## Dependencies Rationale

### Runtime Dependencies (kept minimal by design)

| Package | Purpose | Size |
|---------|---------|------|
| `p-limit` | Concurrency queue for FFmpeg jobs | ~2KB |

**Total runtime dependencies: 1**

This is intentional. vidbreak should be usable in any Node.js project without dependency bloat. All other functionality uses Node.js built-ins (`child_process`, `fs/promises`, `path`, `events`, `readline`).

### Peer Dependencies

| Package | Purpose |
|---------|---------|
| `ffmpeg-static` | Optional bundled FFmpeg binary. Detected automatically. |

### Dev Dependencies

| Package | Purpose |
|---------|---------|
| `typescript` | Language compiler |
| `tsup` | Fast bundler (wraps esbuild), dual ESM+CJS output |
| `vitest` | Test runner (fast, native ESM) |
| `@vitest/coverage-v8` | Coverage via V8 |
| `eslint` + `@typescript-eslint/*` | Linting |
| `release-it` | Automated releases with changelog generation |

---

## Linting Configuration

### `.eslintrc.json`

```json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/strict-type-checked"
  ],
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/consistent-type-imports": "warn",
    "no-console": "warn"
  }
}
```

---

## .npmignore

```
src/
tests/
docs/
.github/
*.config.ts
tsconfig.json
.eslintrc.json
vitest.config.ts
```

---

## CI/CD Pipeline

### `.github/workflows/ci.yml` (overview)

Triggers on: `push` to `main`, all `pull_request`s

Steps:
1. Checkout code
2. Setup Node.js 18 + 20 (matrix)
3. `npm ci`
4. `npm run typecheck`
5. `npm run lint`
6. `npm run build`
7. `npm run test:coverage`
8. Upload coverage to Codecov

### `.github/workflows/release.yml` (overview)

Triggers on: push to `main` with version tag (`v*.*.*`)

Steps:
1. Run full CI checks
2. `npm publish --access public`
3. Create GitHub release with auto-generated changelog

---

## Versioning & Release Strategy

- **Conventional Commits** enforced via commitlint
- **`release-it`** handles version bumps, changelog, and npm publish
- Release channels:
  - `next` → `-beta.x` pre-releases from `develop` branch
  - `latest` → stable from `main` branch
- Minimum supported Node.js: **18 LTS** (for `fs/promises` stability and native ESM)
