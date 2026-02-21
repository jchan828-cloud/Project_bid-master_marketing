#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Bid-Master v4 — Sequential Agent Pipeline (Subscription-Based)

    Runs Phase 2a (Implementation) then Phase 3 (Merge Gate) using
    claude -p headless mode. No API key required — uses your
    Claude Pro/Max/Team subscription.

.PARAMETER ContractPath
    Path to the task contract markdown file (required)

.PARAMETER RepoRoot
    Repository root directory (defaults to current directory)

.PARAMETER MaxTurns
    Maximum agentic turns per phase (default: 80)

.PARAMETER PhaseOnly
    Run only "2a" or "3" (default: both)

.PARAMETER Model
    Claude model to use: opus, sonnet, haiku (default: opus)

.EXAMPLE
    .\agents\pipeline.ps1 -ContractPath "tasks\sprint-s3\S3-003-documents-list.md"

.EXAMPLE
    .\agents\pipeline.ps1 -ContractPath "tasks\sprint-s3\S3-003-documents-list.md" -PhaseOnly "2a"

.EXAMPLE
    .\agents\pipeline.ps1 -ContractPath "tasks\sprint-s3\S3-003-documents-list.md" -Model sonnet
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$ContractPath,

    [string]$RepoRoot = (Get-Location).Path,

    [int]$MaxTurns = 80,

    [ValidateSet("both", "2a", "3")]
    [string]$PhaseOnly = "both",

    [ValidateSet("opus", "sonnet", "haiku")]
    [string]$Model = "opus"
)

# ─── Resolve Paths ────────────────────────────────────────────────

$ContractPath = Resolve-Path $ContractPath -ErrorAction Stop
$RepoRoot = Resolve-Path $RepoRoot -ErrorAction Stop

# Extract task ID from filename (e.g., "S3-003-documents-list.md" → "S3-003")
$contractFilename = [System.IO.Path]::GetFileNameWithoutExtension($ContractPath)
if ($contractFilename -match '^(S\d+-\d+)') {
    $taskId = $Matches[1].ToUpper()
} else {
    $taskId = $contractFilename
}

# Extract sprint phase (e.g., "S3-003" → "s3")
if ($taskId -match '^S(\d+)') {
    $sprintPhase = "s$($Matches[1])"
} else {
    $sprintPhase = "s0"
}

# ─── Load Prompts ─────────────────────────────────────────────────

$phase2aPromptFile = Join-Path $PSScriptRoot "prompts" "phase2a-implementation.md"
$phase3PromptFile  = Join-Path $PSScriptRoot "prompts" "phase3-merge-gate.md"

if (-not (Test-Path $phase2aPromptFile)) {
    Write-Error "Phase 2a prompt not found: $phase2aPromptFile"
    exit 1
}
if (-not (Test-Path $phase3PromptFile)) {
    Write-Error "Phase 3 prompt not found: $phase3PromptFile"
    exit 1
}

$contractContent = Get-Content $ContractPath -Raw

# ─── Banner ───────────────────────────────────────────────────────

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  BID-MASTER v4 — AGENT PIPELINE                  ║" -ForegroundColor Cyan
Write-Host "╠══════════════════════════════════════════════════╣" -ForegroundColor Cyan
Write-Host "║  Contract : $($contractFilename.PadRight(37))║" -ForegroundColor Cyan
Write-Host "║  Task ID  : $($taskId.PadRight(37))║" -ForegroundColor Cyan
Write-Host "║  Sprint   : $($sprintPhase.PadRight(37))║" -ForegroundColor Cyan
Write-Host "║  Model    : $($Model.PadRight(37))║" -ForegroundColor Cyan
Write-Host "║  Repo     : $($RepoRoot.Substring([Math]::Max(0,$RepoRoot.Length-37)).PadRight(37))║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ─── Phase 2a: Implementation Agent ──────────────────────────────

function Invoke-Phase2a {
    Write-Host "═══════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host "  PHASE 2a: IMPLEMENTATION AGENT" -ForegroundColor Yellow
    Write-Host "  Task: $taskId" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host ""

    # Build the full prompt: system directive + task contract
    $fullPrompt = @"
$(Get-Content $phase2aPromptFile -Raw)

═══════════════════════════════════════════════
TASK CONTRACT
═══════════════════════════════════════════════

$contractContent
"@

    # Write prompt to temp file (avoids PowerShell escaping issues)
    $tempPrompt = [System.IO.Path]::GetTempFileName()
    Set-Content -Path $tempPrompt -Value $fullPrompt -Encoding UTF8

    Write-Host "  Starting implementation agent..." -ForegroundColor Gray
    Write-Host ""

    # Run claude -p with the prompt piped from file
    $result = Get-Content $tempPrompt -Raw | claude -p `
        --allowedTools "Read,Edit,Write,Bash,Glob,Grep" `
        --model $Model `
        --max-turns $MaxTurns `
        --cwd $RepoRoot `
        --output-format json `
        --append-system-prompt "You are a contract-bound implementation agent for bid-master-v4. Repository: $RepoRoot. Branch: main. Task: $taskId." `
        2>&1

    Remove-Item $tempPrompt -ErrorAction SilentlyContinue

    # Parse JSON output
    try {
        $parsed = $result | ConvertFrom-Json
        $script:phase2aSessionId = $parsed.session_id

        Write-Host ""
        Write-Host "  ─── Phase 2a Complete ───" -ForegroundColor Green
        Write-Host "  Session ID : $($parsed.session_id)" -ForegroundColor Gray
        if ($parsed.cost_usd) {
            Write-Host "  Cost       : `$$($parsed.cost_usd)" -ForegroundColor Gray
        }
        if ($parsed.usage) {
            Write-Host "  Tokens     : $($parsed.usage.input_tokens) in / $($parsed.usage.output_tokens) out" -ForegroundColor Gray
        }
        Write-Host ""

        # Show result summary (first 500 chars)
        $resultText = $parsed.result
        if ($resultText.Length -gt 500) {
            Write-Host $resultText.Substring(0, 500) -ForegroundColor White
            Write-Host "  ... (truncated)" -ForegroundColor DarkGray
        } else {
            Write-Host $resultText -ForegroundColor White
        }

        return $true
    }
    catch {
        Write-Host "  Phase 2a output (raw):" -ForegroundColor Red
        Write-Host $result
        $script:phase2aSessionId = $null
        return $false
    }
}

# ─── Phase 3: Merge Gate Validator ────────────────────────────────

function Invoke-Phase3 {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════" -ForegroundColor Magenta
    Write-Host "  PHASE 3: MERGE GATE VALIDATOR" -ForegroundColor Magenta
    Write-Host "  Validating: $taskId" -ForegroundColor Magenta
    Write-Host "═══════════════════════════════════════════════" -ForegroundColor Magenta
    Write-Host ""

    # Ensure gate-reports directory exists
    $gateReportsDir = Join-Path $RepoRoot "tasks" "sprint-$sprintPhase" "gate-reports"
    if (-not (Test-Path $gateReportsDir)) {
        New-Item -ItemType Directory -Path $gateReportsDir -Force | Out-Null
        Write-Host "  Created: $gateReportsDir" -ForegroundColor Gray
    }

    # Read Phase 3 prompt template and substitute variables
    $phase3Template = Get-Content $phase3PromptFile -Raw
    $phase3Prompt = $phase3Template `
        -replace '\$\{TASK_ID\}', $taskId `
        -replace '\$\{CONTRACT_PATH\}', $ContractPath `
        -replace '\$\{SPRINT_PHASE\}', $sprintPhase `
        -replace '\$\{REPO_ROOT\}', $RepoRoot

    # Write prompt to temp file
    $tempPrompt = [System.IO.Path]::GetTempFileName()
    Set-Content -Path $tempPrompt -Value $phase3Prompt -Encoding UTF8

    Write-Host "  Starting merge gate validator..." -ForegroundColor Gray
    Write-Host ""

    # Decide whether to continue the Phase 2a session or start fresh
    $claudeArgs = @(
        "-p"
        "--allowedTools", "Read,Glob,Grep,Bash,Write"
        "--model", $Model
        "--max-turns", $MaxTurns
        "--cwd", $RepoRoot
        "--output-format", "json"
        "--append-system-prompt", "You are a merge gate validator for bid-master-v4. Read-only analysis except for writing the gate report. Repository: $RepoRoot."
    )

    # If we have a Phase 2a session, continue it for full context
    if ($script:phase2aSessionId) {
        $claudeArgs += "--resume"
        $claudeArgs += $script:phase2aSessionId
        Write-Host "  Resuming session: $($script:phase2aSessionId)" -ForegroundColor Gray
    }

    $result = Get-Content $tempPrompt -Raw | claude @claudeArgs 2>&1

    Remove-Item $tempPrompt -ErrorAction SilentlyContinue

    # Parse JSON output
    try {
        $parsed = $result | ConvertFrom-Json
        $resultText = $parsed.result

        # Determine pass/fail from the result text
        $passed = ($resultText -match "PASS") -and (-not ($resultText -match "FAIL"))
        $status = if ($resultText -match "PASS WITH NOTES") { "PASS WITH NOTES" }
                  elseif ($resultText -match "FAIL") { "FAIL" }
                  else { "PASS" }

        Write-Host ""
        Write-Host "  ─── Phase 3 Complete ───" -ForegroundColor Green
        Write-Host "  Status     : $status" -ForegroundColor $(if ($passed) { "Green" } else { "Red" })
        if ($parsed.cost_usd) {
            Write-Host "  Cost       : `$$($parsed.cost_usd)" -ForegroundColor Gray
        }

        $expectedReport = Join-Path $gateReportsDir "$taskId-gate.md"
        if (Test-Path $expectedReport) {
            Write-Host "  Report     : $expectedReport" -ForegroundColor Gray
        }
        Write-Host ""

        return @{ Passed = $passed; Status = $status; ReportPath = $expectedReport }
    }
    catch {
        Write-Host "  Phase 3 output (raw):" -ForegroundColor Red
        Write-Host $result
        return @{ Passed = $false; Status = "ERROR"; ReportPath = "" }
    }
}

# ─── Execute Pipeline ─────────────────────────────────────────────

$startTime = Get-Date

if ($PhaseOnly -eq "both" -or $PhaseOnly -eq "2a") {
    $implResult = Invoke-Phase2a
    if (-not $implResult) {
        Write-Host "  Phase 2a failed. Aborting pipeline." -ForegroundColor Red
        exit 1
    }
}

if ($PhaseOnly -eq "2a") {
    Write-Host ""
    Write-Host "  Phase 2a complete. Run with -PhaseOnly '3' to validate." -ForegroundColor Yellow
    exit 0
}

if ($PhaseOnly -eq "both" -or $PhaseOnly -eq "3") {
    $gateResult = Invoke-Phase3
}

# ─── Pipeline Summary ─────────────────────────────────────────────

$elapsed = (Get-Date) - $startTime

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  PIPELINE SUMMARY                                ║" -ForegroundColor Cyan
Write-Host "╠══════════════════════════════════════════════════╣" -ForegroundColor Cyan
if ($PhaseOnly -ne "3") {
    Write-Host "║  Phase 2a : COMPLETE                             ║" -ForegroundColor Cyan
}
if ($gateResult) {
    $statusPad = $gateResult.Status.PadRight(37)
    Write-Host "║  Phase 3  : $statusPad║" -ForegroundColor $(if ($gateResult.Passed) { "Green" } else { "Red" })
}
Write-Host "║  Elapsed  : $("$($elapsed.Minutes)m $($elapsed.Seconds)s".PadRight(37))║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan

if ($gateResult -and -not $gateResult.Passed) {
    Write-Host ""
    Write-Host "  Gate FAILED. Review the report:" -ForegroundColor Red
    Write-Host "  Get-Content '$($gateResult.ReportPath)'" -ForegroundColor Yellow
    exit 1
}

exit 0
