## Linear Integration - In-Progress Issues Script

This implementation provides a script to fetch and display in-progress Linear issues that meet the specified criteria.

### Files Created

1. **`scripts/fetch-linear-issues.js`** - Main JavaScript implementation
2. **`scripts/fetch-linear-issues.ts`** - TypeScript implementation with type safety
3. **`scripts/README-linear-issues.md`** - Documentation for usage

### Implementation Details

#### Key Features
- **API Integration**: Uses `@linear/sdk` package for Linear API interaction
- **Filtering**: Queries issues where `state.type = "started"` (in-progress)
- **Sorting**: Orders by `UPDATED_AT` in descending order (newest first)
- **Output Fields**: Returns identifier, title, assignee name, and updatedAt timestamp
- **Error Handling**: Proper error handling with process exit codes
- **Environment Security**: Uses environment variables for API key management

#### Usage

```bash
# Set your Linear API key
export LINEAR_API_KEY="YOUR_LINEAR_API_KEY"

# Run the script
npm run fetch:linear:issues
```

#### Output Format

```
=== In-Progress Issues (Started) ===

ID: LIN-123 | Title: Fix authentication bug | Assignee: John Doe | Updated: 4/17/2026, 10:30:00 AM
ID: LIN-124 | Title: Update documentation | Assignee: Unassigned | Updated: 4/16/2026, 3:45:00 PM

Total: 2 in-progress issues found.
```

### Integration with Existing Codebase

- **Package.json**: Added `@linear/sdk` dependency (v0.8.0) and script commands
- **Kilo Configuration**: Uses existing `LINEAR_API_KEY` from `kilo.json`
- **Project Patterns**: Follows ES modules, proper error handling, and utility script conventions
- **TypeScript Support**: Includes both JavaScript and TypeScript versions for flexibility