# MobiRides 🚗

MobiRides is a modern car rental platform built with React, TypeScript, and Supabase. It enables users to rent vehicles, manage bookings, handle insurance claims, and more — all through a clean, responsive web interface.

## Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 19, TypeScript |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions) |
| UI | Radix UI, Tailwind CSS, shadcn/ui |
| Mobile | Capacitor (Android) |
| Forms | React Hook Form + Zod |
| State | TanStack Query |
| Maps | Mapbox GL |

## Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm
- Supabase CLI (for local development)
- Android Studio (for mobile builds)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd mobirides-app

# Install dependencies
npm install
```

### Environment Setup

Create a `.env` file in the project root with the following variables:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> See [docs/README.md](./docs/README.md) for additional configuration details.

## Running the App

### Development

```bash
npm run dev
```

### API Server

```bash
npm run api
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

### Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Mobile Development (Android)

This project uses Capacitor for building Android apps.

```bash
# Open Android Studio
npm run android

# Run on connected device/emulator
npm run android:run

# Sync web build to Android
npm run android:sync
```

See [capacitor.config.ts](./capacitor.config.ts) for configuration.

## Project Structure

```
mobirides-app/
├── src/                    # Main source code
├── docs/                   # Documentation (Roadmaps, PRDs, Plans)
├── logs/                   # Build, lint, and runtime logs (Ignored by Git)
├── scripts/                # Build & utility scripts
│   └── tests/              # Ad-hoc test scripts
├── supabase/               # Supabase config & migrations
│   └── dumps/              # Database schema and data backups
├── scratch/                # Temporary artifacts and backups (Ignored by Git)
├── android/                # Android native project project
├── api/                    # Express backend (Serverless/API)
├── public/                 # Static assets
└── __tests__/              # Core test files
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run api` | Run Express API server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm test` | Run Jest tests |
| `npm run android` | Open Android project |
| `npm run android:run` | Run on Android device |
| `npm run gen:types` | Generate Supabase TypeScript types |

## Documentation

- [Project Overview](./docs/README.md)
- [Authentication](./docs/security/auth.md)
- [Supabase Setup](./supabase/MIGRATION_GUIDE.md)
- [Sprint Planning](./docs/Product%20Status/SPRINT_12_APRIL_2026_JIRA_EXECUTION_PLAN.md)

## License

See [LICENSE](./LICENSE) for details.