# Lec Vid Generator (LectureAI)

A standalone React + Vite app that turns uploaded lecture notes into cinematic, scene-based lesson reels.

This version is fully local-first:
- No external app backend is required.
- No external entity/auth provider is required.
- Data is stored in browser localStorage.
- Lesson generation uses an in-app mock pipeline that creates structured scenes, images, and video placeholders.

## What the app does

1. Upload lecture content from the Home page.
2. Create a project and track progress (extracting -> generating -> ready).
3. Auto-generate scenes containing:
	 - title
	 - narration
	 - formula
	 - derivation steps
	 - key points
	 - image prompt
4. Render visual assets for each scene (local SVG data URLs).
5. Browse all projects in Dashboard.
6. Open a project page to replay scenes and regenerate/restyle content.

## Tech stack

- React 18
- Vite 6
- React Router 6
- TanStack Query 5
- Tailwind CSS
- Framer Motion
- Radix UI components

## Project routes

- / -> Home
- /dashboard -> Project library
- /project/:id -> Scene player and generation workflow

## Local data model

The local client is in src/api/standaloneClient.js and persists data using these keys:

- lectureai_projects_v1
- lectureai_uploads_v1
- lectureai_user_v1

On first run, a seeded sample project is created so the dashboard is not empty.

## Getting started

### Prerequisites

- Node.js 18+ recommended
- npm

### Install

```bash
npm install
```

### Run development server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Available scripts

- npm run dev -> start local dev server
- npm run build -> create production bundle
- npm run preview -> preview built app
- npm run lint -> run ESLint
- npm run lint:fix -> auto-fix lint issues
- npm run typecheck -> TypeScript/JS config type checks

## Notes and current behavior

- Upload handling:
	- Text-like files are read locally.
	- Other file types still work, but content extraction falls back to generated summaries.
- Scene image/video generation is currently local placeholder generation (not external AI APIs).
- Projects are browser-local. Clearing browser storage will remove project history.

## Recommended next improvements

- Add real AI provider integrations behind an environment-based adapter.
- Add export/share pipeline for generated reels.
- Add tests for the standalone client generation pipeline.
- Add migration/versioning for localStorage schemas.

## Repository structure (high level)

- src/pages -> Home, Dashboard, ProjectPage
- src/components -> UI and cinematic player components
- src/api/standaloneClient.js -> local data + mock generation pipeline
- src/lib -> auth wrapper, query client, utilities

