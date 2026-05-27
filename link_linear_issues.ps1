# PowerShell script to create Linear issues for commits without a Linear reference
# Save this as link_linear_issues.ps1 in the repository root

# Path to a file that stores the last processed commit SHA
$trackingFile = Join-Path $PSScriptRoot ".linear_last_processed"

# Retrieve the last processed commit SHA (if any)
if (Test-Path $trackingFile) {
    $lastProcessed = Get-Content $trackingFile -ErrorAction SilentlyContinue
} else {
    $lastProcessed = ""
}

# 1. Load .env file if it exists in the script directory
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object {
        $name, $value = $_ -split '=', 2
        $name = $name.Trim()
        $value = $value.Trim()
        # Remove surrounding quotes from value if present
        $value = $value -replace "^['`"]|['`"]$"
        # Set environment variable in Process scope
        [System.Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

# 2. Resolve the Linear API token from environment variable or mcp-config.json
$apiToken = $env:LINEAR_API_TOKEN
if (-not $apiToken) {
    $apiToken = $env:LINEAR_API_KEY
}
if (-not $apiToken) {
    $configFile = Join-Path $PSScriptRoot "mcp-config.json"
    if (Test-Path $configFile) {
        $config = Get-Content $configFile -Raw | ConvertFrom-Json
        $apiToken = $config.mcpServers.linear.env.LINEAR_API_KEY
    }
}

if (-not $apiToken) {
    Write-Error "Could not retrieve Linear API token from environment variables, .env, or mcp-config.json. Exiting."
    exit 1
}

# Get the list of new commits (newest first). If no prior SHA, get all commits.
if ($lastProcessed) {
    $commitRange = "$lastProcessed..HEAD"
} else {
    $commitRange = "HEAD"
}

$rawCommits = git log --pretty=format:"%H %s" $commitRange

# Process each commit line
foreach ($line in $rawCommits) {
    $sha, $subject = $line -split " ", 2
    # Skip if the subject already contains a Linear issue key (e.g., MOB-123)
    if ($subject -notmatch "MOB-\d+") {
        # Build issue details using GraphQL variables to prevent quote escaping and JSON syntax issues
        $query = @"
mutation CreateIssue(`$input: IssueCreateInput!) {
  issueCreate(input: `$input) {
    success
    issue { id identifier url }
  }
}
"@

        $variables = @{
            input = @{
                title       = "Unlinked commit: $subject"
                description = "Commit SHA: $sha`nMessage: $subject`n`nThis commit was detected without a Linear issue reference. Please review and associate the appropriate Linear issue."
                teamId      = "e7e6f28c-64d2-4bbc-9939-d5ca7820e470"
                assigneeId  = "4439b440-4c63-4914-b31b-a6b4828ace64"
            }
        }

        $requestBody = @{
            query     = $query
            variables = $variables
        } | ConvertTo-Json -Depth 10
        
        # Prepare headers: Linear API keys starting with "lin_api_" do not use the "Bearer " prefix
        $headers = @{
            "Authorization" = $apiToken
            "Content-Type"  = "application/json"
        }
        
        $response = Invoke-RestMethod -Method Post -Uri "https://api.linear.app/graphql" -Headers $headers -Body $requestBody
        if ($response.data.issueCreate.success) {
            Write-Host "Created Linear issue $($response.data.issueCreate.issue.identifier) for commit ${sha}"
        } else {
            Write-Error "Failed to create Linear issue for commit ${sha}: $($response)"
        }
    }
}

# Update the tracking file with the latest processed commit SHA
$latestSha = git rev-parse HEAD
Set-Content -Path $trackingFile -Value $latestSha -NoNewline

Write-Host "Linking workflow completed. Last processed commit: $latestSha"
