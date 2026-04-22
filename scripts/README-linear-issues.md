# Linear Integration - In-Progress Issues

This script fetches and displays in-progress Linear issues filtered by state "started", sorted by `updatedAt` descending.

## Prerequisites

1. Set your Linear API key as an environment variable:
   ```bash
   export LINEAR_API_KEY="YOUR_LINEAR_API_KEY"
   ```

## Usage

Run the script:
```bash
npm run fetch:linear:issues
```

## Output Format

The script displays:
- Issue identifier (e.g., `LIN-123`)
- Issue title
- Assignee name (or "Unassigned" if not assigned)
- Last updated timestamp

## Implementation Details

- Uses the `@linear/sdk` package for Linear API integration
- Filters issues where `state.type = "started"` (in-progress)
- Sorts results by `UPDATED_AT` in descending order
- Returns up to 50 issues per request (pagination can be added if needed)
- Handles missing assignee gracefully
- Uses environment variable for API key security

## Integration Points

The script follows the existing project patterns:
- Located in `scripts/` directory alongside other utility scripts
- Uses `dotenv` for environment variable management
- Compatible with the existing `LINEAR_API_KEY` configuration in `kilo.json`
- Uses ES modules (`import`/`export`) syntax consistent with the codebase