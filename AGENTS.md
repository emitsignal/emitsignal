# Agent Instructions

This is a React Native monorepo with a mobile app built with Expo.

## Project Structure

```
/                          # Root
├── index.ts               # Root Bun entry point
├── package.json           # Root package (Bun-based)
├── tsconfig.json          # Root TypeScript config
└── apps/mobile/           # Mobile app (Expo/React Native)
    ├── app/               # Expo Router file-based routing
    │   ├── _layout.tsx    # Root layout
    │   ├── (tabs)/        # Tab group
    │   │   ├── _layout.tsx
    │   │   ├── index.tsx  # Home screen
    │   │   └── explore.tsx
    │   └── modal.tsx
    ├── components/        # Reusable components
    │   ├── themed-*.tsx   # Theme-aware components
    │   └── ui/            # UI primitive components
    ├── hooks/             # Custom React hooks
    ├── constants/         # Constants (theme, colors)
    └── package.json       # Mobile app dependencies
```

## Build/Lint/Test Commands

**Root package (Bun):**

- `bun index.ts` - Run root script
- `bun test` - Run tests with Bun test runner
- `bun test <file>` - Run single test file
- `bun build <file>` - Build with Bun bundler

**Mobile app (Expo):**

```bash
cd apps/mobile

# Development
bunx expo start          # Start Expo dev server
bunx expo start --ios    # Start iOS simulator
bunx expo start --android # Start Android emulator
bunx expo start --web    # Start web

# Linting
bunx expo lint           # Run ESLint

# Reset
bun run reset-project    # Reset project to starter state
```

**Important:** Always use `bun` instead of `npm`, `yarn`, `pnpm`, or `node`.

## Code Style Guidelines

### Imports & Module System

- Use ES modules (`import`/`export`)
- Use path alias `@/` for internal imports (e.g., `@/components/themed-text`)
- Group imports: external libraries first, then internal aliases, then relative
- Use `type` keyword for type-only imports: `import type { Foo } from 'bar'`

### TypeScript

- Strict mode enabled
- Target: ESNext
- JSX: `react-jsx` (no need to import React)
- Use explicit return types on exported functions
- Prefer `interface` over `type` for object shapes
- Use `keyof typeof` for accessing object keys safely

### Naming Conventions

- Components: PascalCase (e.g., `ThemedText`, `HomeScreen`)
- Hooks: camelCase starting with `use` (e.g., `useThemeColor`)
- Files: kebab-case (e.g., `use-theme-color.ts`, `themed-text.tsx`)
- Types/Interfaces: PascalCase with descriptive names
- Constants: UPPER_SNAKE_CASE for true constants

### React Components

- Use function components with default exports for screens
- Destructure props in component parameters
- Spread rest props appropriately: `{...rest}`
- Use React Native components from `react-native` (not web elements)

### Styling

- Use `StyleSheet.create()` for component styles
- Use theme-aware colors via `useThemeColor()` hook
- Support light/dark mode via `useColorScheme()`
- Define colors in `constants/theme.ts`

### Error Handling

- Use TypeScript strict mode to catch errors at compile time
- Prefer early returns over nested conditionals
- Use optional chaining (`?.`) and nullish coalescing (`??`)

### File Organization

- Co-locate related files (component + styles + types)
- Use platform-specific extensions when needed (`.ios.tsx`, `.web.ts`)
- Keep components in `components/`, hooks in `hooks/`, screens in `app/`

### Testing

- Use Bun's built-in test runner
- Import from `bun:test`: `import { test, expect } from "bun:test"`
- Run single test: `bun test path/to/file.test.ts`

## Cursor Rules

See `.cursor/rules/use-bun-instead-of-node-vite-npm-pnpm.mdc`:

- Always use Bun over Node.js/npm/pnpm
- Use `bun test` instead of Jest/Vitest
- Use `bun build` instead of webpack/esbuild
- Use `bunx` instead of `npx`
- Bun auto-loads `.env` - don't use dotenv
- Prefer Bun APIs: `Bun.serve()`, `bun:sqlite`, `Bun.file`, `Bun.$`

## Technology Stack

- **Runtime:** Bun
- **Mobile Framework:** Expo (SDK ~54.0.33)
- **Routing:** Expo Router v6 (file-based)
- **UI:** React Native 0.81.5, React 19.1.0
- **Styling:** React Native StyleSheet
- **Linting:** ESLint with expo-config
- **TypeScript:** 5.9.2 (strict mode)
- **Testing:** Bun test runner

## Expo Router Conventions

- Files in `app/` become routes automatically
- Use `(group)` for route groups without URL segment
- Use `[param]` for dynamic routes
- `_layout.tsx` defines layout for directory
- `+not-found.tsx` for 404 pages

## Commit Rules

Use [Conventional Commits](https://www.conventionalcommits.org/) format: `<prefix>: <description>`.

Avoid using `body` and `footer` in commits; prefer self-descriptive titles.

Only add a `body` to a commit if the change made could have an impact, especially in refactorings that cause breaking changes.

### Prefixes

| Prefix     | Use when                                                  |
| ---------- | --------------------------------------------------------- |
| `feat`     | New feature or user-facing functionality                  |
| `fix`      | Bug fix                                                   |
| `refactor` | Code change that neither fixes a bug nor adds a feature   |
| `style`    | Formatting, whitespace, semicolons (no code logic change) |
| `docs`     | Documentation only                                        |
| `test`     | Adding or updating tests                                  |
| `chore`    | Maintenance, dependencies, tooling, source formatting     |
| `perf`     | Performance improvement                                   |
| `ci`       | CI/CD pipeline changes                                    |
| `build`    | Build system or external dependency changes               |

### Commit Splitting

- Split changes into one or more commits by area, context, or logical grouping
- Do not add hard rules by commit type — use your judgment
- Keep each commit focused on a single concern

### Co-Author Trailer

- Never add `Co-authored-by:` for the agent under any circumstances

### Formatting Workflow

1. Before committing, run `bun format` at the project root
2. If `prettier` modified any files, stage those changes and add a final commit:
    ```
    chore: Source Format
    ```
3. This formatting commit must be the last in the sequence
