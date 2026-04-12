# Implementation Plan: Gradle Build Error Remediation (BUG-009)

## Context
The IDE reports a critical error during Gradle phased build actions:
`The specified initialization script '.../globalStorage/redhat.java/1.12.0/.../init.gradle' does not exist.`

This error is caused by a stale reference in the **Language Support for Java (by Red Hat)** extension following an update. The extension attempt to use paths from an outdated version (`1.12.0`) instead of the current version (`1.53.0`).

## Proposed Changes

### 1. Force Reset of Java Language Server Cache
To resolve the stale path reference, we must clear the project-specific cache that holds these hardcoded paths.

- **Storage Location**: `C:\Users\Administrator\AppData\Roaming\Antigravity\User\workspaceStorage\9358ea47cc5f12d59f5e5a00a4acfa03\redhat.java`
- **Action**: Delete the version-specific subdirectories and indices.
- **Dependency**: Requires terminating all active `java.exe` processes associated with the extension.

### 2. Cleanup of Global Storage
- Delete the legacy version folder `C:\Users\Administrator\AppData\Roaming\Antigravity\User\globalStorage\redhat.java\1.12.0` if it contains incomplete or manual overrides.

## Execution Order
1. Terminate locking Java processes via PowerShell.
2. Remove the `1.12.0` global storage folder.
3. Remove the `redhat.java` folder in `workspaceStorage`.
4. Restart Cursor/IDE.

## Verification Plan
- Successful execution of `./gradlew clean` in the terminal.
- Absence of the initialization script error in the IDE Problems panel.
- Successful project import and indexing by the Java Language Server.
