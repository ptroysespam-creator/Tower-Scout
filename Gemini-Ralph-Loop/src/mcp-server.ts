#!/usr/bin/env node

/**
 * Ralph Loop MCP Server
 * 
 * Provides state management tools for the Ralph Loop extension.
 * Handles loop lifecycle, iteration tracking, checkpoints, and diagnostics.
 * 
 * @author kranthik123
 * @repository https://github.com/kranthik123/Gemini-Ralph-Loop
 * @license MIT
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

// ============================================================================
// Configuration
// ============================================================================

const STATE_DIR = process.env.RALPH_STATE_DIR || ".ralph-state";
const WORKSPACE = process.env.RALPH_WORKSPACE || process.cwd();
const EXTENSION_PATH = process.env.RALPH_EXTENSION_PATH || "";

// Settings with defaults
const DEFAULT_MAX_ITERATIONS = parseInt(process.env.RALPH_DEFAULT_MAX_ITERATIONS || "100");
const DEFAULT_COMPLETION_PROMISE = process.env.RALPH_DEFAULT_COMPLETION_PROMISE || "COMPLETE";
const ITERATION_DELAY = parseInt(process.env.RALPH_ITERATION_DELAY || "2");
const AUTO_COMMIT = process.env.RALPH_AUTO_COMMIT === "true";
const AUTO_CHECKPOINT_INTERVAL = parseInt(process.env.RALPH_AUTO_CHECKPOINT_INTERVAL || "10");
const MAX_LOG_SIZE_KB = parseInt(process.env.RALPH_MAX_LOG_SIZE_KB || "100");

// ============================================================================
// Types
// ============================================================================

type LoopStatus =
    | "idle"
    | "running"
    | "paused"
    | "completed"
    | "cancelled"
    | "max_iterations"
    | "error";

interface IterationRecord {
    iteration: number;
    timestamp: number;
    durationMs: number;
    notes?: string;
    filesModified?: string[];
    gitCommit?: string;
    outputFile?: string;
    status: "success" | "error" | "retry";
}

interface LoopState {
    loopId: string;
    status: LoopStatus;
    prompt: string;
    iteration: number;
    maxIterations: number;
    completionPromise: string;
    startTime: number;
    lastActivity: number;
    pausedAt?: number;
    endTime?: number;
    totalPausedTime: number;
    retryCount: number;
    iterationHistory: IterationRecord[];
    error?: string;
    metadata: {
        workspace: string;
        autoCommit: boolean;
        iterationDelay: number;
        autoCheckpointInterval: number;
    };
}

interface Checkpoint {
    name: string;
    loopId: string;
    iteration: number;
    timestamp: number;
    description?: string;
    gitCommit?: string;
    stateSnapshot: LoopState;
}

interface MonitorState {
    isMonitoring: boolean;
    startedAt?: number;
    lastUpdate?: number;
}

interface DiagnosticResult {
    status: "healthy" | "warning" | "stuck" | "error";
    issues: string[];
    recommendations: string[];
    metrics: {
        avgIterationTime: number;
        progressRate: number;
        errorRate: number;
        lastModifiedFiles: number;
    };
}

// ============================================================================
// Utility Functions - File System
// ============================================================================

function getFullStatePath(): string {
    return path.isAbsolute(STATE_DIR) ? STATE_DIR : path.join(WORKSPACE, STATE_DIR);
}

function ensureStateDir(): void {
    const fullPath = getFullStatePath();
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
}

function getStateFilePath(): string {
    return path.join(getFullStatePath(), "loop-state.json");
}

function getMonitorFilePath(): string {
    return path.join(getFullStatePath(), "monitor-state.json");
}

function getIterationsDir(): string {
    return path.join(getFullStatePath(), "iterations");
}

function getCheckpointsDir(): string {
    return path.join(getFullStatePath(), "checkpoints");
}

function getReportsDir(): string {
    return path.join(getFullStatePath(), "reports");
}

function getLogsDir(): string {
    return path.join(getFullStatePath(), "logs");
}

// ============================================================================
// Utility Functions - State Management
// ============================================================================

function loadState(): LoopState | null {
    const stateFile = getStateFilePath();
    if (fs.existsSync(stateFile)) {
        try {
            const content = fs.readFileSync(stateFile, "utf-8");
            return JSON.parse(content) as LoopState;
        } catch {
            return null;
        }
    }
    return null;
}

function saveState(state: LoopState): void {
    ensureStateDir();
    const stateFile = getStateFilePath();
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));

    // Also save to history
    const historyFile = path.join(getFullStatePath(), "state-history.jsonl");
    fs.appendFileSync(historyFile, JSON.stringify({
        timestamp: Date.now(),
        state: {
            loopId: state.loopId,
            status: state.status,
            iteration: state.iteration,
        }
    }) + "\n");
}

function loadMonitorState(): MonitorState {
    const monitorFile = getMonitorFilePath();
    if (fs.existsSync(monitorFile)) {
        try {
            const content = fs.readFileSync(monitorFile, "utf-8");
            return JSON.parse(content) as MonitorState;
        } catch {
            return { isMonitoring: false };
        }
    }
    return { isMonitoring: false };
}

function saveMonitorState(state: MonitorState): void {
    ensureStateDir();
    const monitorFile = getMonitorFilePath();
    fs.writeFileSync(monitorFile, JSON.stringify(state, null, 2));
}

function clearAllState(): void {
    const statePath = getFullStatePath();
    if (fs.existsSync(statePath)) {
        fs.rmSync(statePath, { recursive: true, force: true });
    }
}

// ============================================================================
// Utility Functions - Helpers
// ============================================================================

function generateLoopId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const random = Math.random().toString(36).substring(2, 8);
    return `ralph-${timestamp}-${random}`;
}

function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

function formatTimestamp(ts: number): string {
    return new Date(ts).toISOString().replace("T", " ").substring(0, 19);
}

function getStatusEmoji(status: LoopStatus): string {
    const emojis: Record<LoopStatus, string> = {
        idle: "💤",
        running: "🔄",
        paused: "⏸️",
        completed: "✅",
        cancelled: "🛑",
        max_iterations: "⚠️",
        error: "❌",
    };
    return emojis[status] || "❓";
}

function checkCompletionFile(): boolean {
    const completionFile = path.join(WORKSPACE, ".ralph-complete");
    return fs.existsSync(completionFile);
}

function checkCompletionPatterns(output: string, promise: string): boolean {
    const patterns = [
        `<done>${promise}</done>`,
        `<complete>${promise}</complete>`,
        `[DONE] ${promise}`,
        `[COMPLETE] ${promise}`,
        `**DONE**: ${promise}`,
        `✅ ${promise}`,
    ];

    const lowerOutput = output.toLowerCase();
    return patterns.some(p => lowerOutput.includes(p.toLowerCase()));
}

// ============================================================================
// Utility Functions - Git
// ============================================================================

function getModifiedFiles(): string[] {
    try {
        const result = execSync("git status --short", {
            cwd: WORKSPACE,
            encoding: "utf-8",
            timeout: 5000,
        });
        return result
            .split("\n")
            .filter((line: string) => line.trim())
            .map((line: string) => line.substring(3).trim());
    } catch {
        return [];
    }
}

function getGitHead(): string | undefined {
    try {
        return execSync("git rev-parse HEAD", {
            cwd: WORKSPACE,
            encoding: "utf-8",
            timeout: 5000,
        }).trim();
    } catch {
        return undefined;
    }
}

function autoCommitChanges(iteration: number, message?: string): string | undefined {
    if (!AUTO_COMMIT) return undefined;

    try {
        execSync("git add -A", { cwd: WORKSPACE, timeout: 10000 });
        const commitMessage = message || `[ralph] Iteration ${iteration} - ${new Date().toISOString()}`;
        execSync(`git commit -m "${commitMessage}"`, { cwd: WORKSPACE, timeout: 10000 });
        return getGitHead();
    } catch {
        return undefined;
    }
}

function getRecentCommits(count: number = 5): string[] {
    try {
        const result = execSync(`git log --oneline -${count}`, {
            cwd: WORKSPACE,
            encoding: "utf-8",
            timeout: 5000,
        });
        return result.split("\n").filter(line => line.trim());
    } catch {
        return [];
    }
}

// ============================================================================
// Utility Functions - Checkpoints
// ============================================================================

function saveCheckpoint(name: string, state: LoopState, description?: string): Checkpoint {
    const checkpointsDir = getCheckpointsDir();
    if (!fs.existsSync(checkpointsDir)) {
        fs.mkdirSync(checkpointsDir, { recursive: true });
    }

    const checkpoint: Checkpoint = {
        name,
        loopId: state.loopId,
        iteration: state.iteration,
        timestamp: Date.now(),
        description,
        gitCommit: getGitHead(),
        stateSnapshot: { ...state },
    };

    const checkpointFile = path.join(checkpointsDir, `${name}.json`);
    fs.writeFileSync(checkpointFile, JSON.stringify(checkpoint, null, 2));

    return checkpoint;
}

function loadCheckpoint(name: string): Checkpoint | null {
    const checkpointFile = path.join(getCheckpointsDir(), `${name}.json`);
    if (fs.existsSync(checkpointFile)) {
        try {
            const content = fs.readFileSync(checkpointFile, "utf-8");
            return JSON.parse(content) as Checkpoint;
        } catch {
            return null;
        }
    }
    return null;
}

function listCheckpoints(): Checkpoint[] {
    const checkpointsDir = getCheckpointsDir();
    if (!fs.existsSync(checkpointsDir)) {
        return [];
    }

    const files = fs.readdirSync(checkpointsDir).filter(f => f.endsWith(".json"));
    const checkpoints: Checkpoint[] = [];

    for (const file of files) {
        try {
            const content = fs.readFileSync(path.join(checkpointsDir, file), "utf-8");
            checkpoints.push(JSON.parse(content) as Checkpoint);
        } catch {
            // Skip invalid files
        }
    }

    return checkpoints.sort((a, b) => b.timestamp - a.timestamp);
}

function deleteCheckpoint(name: string): boolean {
    const checkpointFile = path.join(getCheckpointsDir(), `${name}.json`);
    if (fs.existsSync(checkpointFile)) {
        fs.unlinkSync(checkpointFile);
        return true;
    }
    return false;
}

// ============================================================================
// Utility Functions - Diagnostics
// ============================================================================

function diagnoseLoop(state: LoopState): DiagnosticResult {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Calculate metrics
    const history = state.iterationHistory;
    const avgIterationTime = history.length > 0
        ? history.reduce((sum, i) => sum + i.durationMs, 0) / history.length
        : 0;

    const errorCount = history.filter(i => i.status === "error").length;
    const errorRate = history.length > 0 ? errorCount / history.length : 0;

    const recentHistory = history.slice(-5);
    const recentFilesModified = recentHistory.reduce(
        (sum, i) => sum + (i.filesModified?.length || 0), 0
    );

    // Check for issues

    // 1. No progress (no files modified recently)
    if (state.iteration > 3 && recentFilesModified === 0) {
        issues.push("No files modified in recent iterations");
        recommendations.push("The task may be stuck - try rephrasing requirements");
        recommendations.push("Check if there are permission issues in the workspace");
    }

    // 2. High error rate
    if (errorRate > 0.3) {
        issues.push(`High error rate: ${(errorRate * 100).toFixed(1)}%`);
        recommendations.push("Review error logs with /ralph:logs");
        recommendations.push("Consider simplifying the task");
    }

    // 3. Many retries
    if (state.retryCount > 5) {
        issues.push(`High retry count: ${state.retryCount}`);
        recommendations.push("Persistent errors indicate a fundamental issue");
        recommendations.push("Try a different approach to the task");
    }

    // 4. Approaching max iterations
    const remaining = state.maxIterations - state.iteration;
    if (remaining < state.maxIterations * 0.2) {
        issues.push(`Only ${remaining} iterations remaining`);
        recommendations.push("Consider increasing max iterations with /ralph:adjust");
        recommendations.push("Or focus on completing critical requirements first");
    }

    // 5. Same files being modified repeatedly
    const fileModCounts: Record<string, number> = {};
    for (const iter of history) {
        for (const file of iter.filesModified || []) {
            fileModCounts[file] = (fileModCounts[file] || 0) + 1;
        }
    }
    const repeatedFiles = Object.entries(fileModCounts)
        .filter(([_, count]) => count > 5)
        .map(([file]) => file);

    if (repeatedFiles.length > 0) {
        issues.push(`Files modified repeatedly: ${repeatedFiles.join(", ")}`);
        recommendations.push("May be stuck in a fix-break cycle");
        recommendations.push("Consider using /ralph:checkpoint before major changes");
    }

    // 6. Long iteration times
    if (avgIterationTime > 5 * 60 * 1000) { // > 5 minutes
        issues.push("Iterations are taking very long");
        recommendations.push("Task may be too complex for single iterations");
        recommendations.push("Consider breaking into smaller sub-tasks");
    }

    // 7. Stalled (no activity for a while)
    const sinceActivity = Date.now() - state.lastActivity;
    if (state.status === "running" && sinceActivity > 10 * 60 * 1000) { // > 10 minutes
        issues.push("No activity for over 10 minutes");
        recommendations.push("Loop may be waiting for input or stuck");
        recommendations.push("Check if Gemini CLI is still responsive");
    }

    // Determine overall status
    let status: DiagnosticResult["status"] = "healthy";
    if (issues.length > 0) {
        if (issues.length >= 3 || recentFilesModified === 0) {
            status = "stuck";
        } else if (errorRate > 0.5) {
            status = "error";
        } else {
            status = "warning";
        }
    }

    return {
        status,
        issues,
        recommendations,
        metrics: {
            avgIterationTime,
            progressRate: recentFilesModified / 5,
            errorRate,
            lastModifiedFiles: recentFilesModified,
        },
    };
}

// ============================================================================
// Utility Functions - Reports
// ============================================================================

function generateReport(state: LoopState, format: "markdown" | "json" | "text"): string {
    const duration = (state.endTime || Date.now()) - state.startTime - state.totalPausedTime;
    const avgIterTime = state.iterationHistory.length > 0
        ? state.iterationHistory.reduce((s, i) => s + i.durationMs, 0) / state.iterationHistory.length
        : 0;

    // Collect all modified files
    const allFiles = new Set<string>();
    for (const iter of state.iterationHistory) {
        for (const file of iter.filesModified || []) {
            allFiles.add(file);
        }
    }

    if (format === "json") {
        return JSON.stringify({
            loopId: state.loopId,
            status: state.status,
            prompt: state.prompt,
            iterations: {
                completed: state.iteration,
                max: state.maxIterations,
            },
            timing: {
                startTime: formatTimestamp(state.startTime),
                endTime: state.endTime ? formatTimestamp(state.endTime) : null,
                duration: formatDuration(duration),
                avgIterationTime: formatDuration(avgIterTime),
                totalPausedTime: formatDuration(state.totalPausedTime),
            },
            filesModified: Array.from(allFiles),
            iterationHistory: state.iterationHistory,
        }, null, 2);
    }

    if (format === "text") {
        return `
RALPH LOOP REPORT
=================

Loop ID: ${state.loopId}
Status: ${state.status}
Iterations: ${state.iteration} / ${state.maxIterations}
Duration: ${formatDuration(duration)}

Task:
${state.prompt}

Files Modified (${allFiles.size}):
${Array.from(allFiles).map(f => `  - ${f}`).join("\n")}
    `.trim();
    }

    // Default: markdown
    return `# Ralph Loop Report

## Summary

| Property | Value |
|----------|-------|
| **Loop ID** | \`${state.loopId}\` |
| **Status** | ${getStatusEmoji(state.status)} ${state.status} |
| **Iterations** | ${state.iteration} / ${state.maxIterations} |
| **Duration** | ${formatDuration(duration)} |
| **Avg Iteration** | ${formatDuration(avgIterTime)} |
| **Started** | ${formatTimestamp(state.startTime)} |
| **Ended** | ${state.endTime ? formatTimestamp(state.endTime) : "In progress"} |

## Task

\`\`\`
${state.prompt}
\`\`\`

## Files Modified (${allFiles.size})

${Array.from(allFiles).map(f => `- \`${f}\``).join("\n") || "No files modified"}

## Iteration Timeline

| # | Time | Duration | Files | Status | Notes |
|---|------|----------|-------|--------|-------|
${state.iterationHistory.map(i =>
        `| ${i.iteration} | ${formatTimestamp(i.timestamp)} | ${formatDuration(i.durationMs)} | ${i.filesModified?.length || 0} | ${i.status} | ${i.notes?.substring(0, 30) || "-"} |`
    ).join("\n")}

## Configuration

- **Completion Promise**: \`${state.completionPromise}\`
- **Auto Commit**: ${state.metadata.autoCommit}
- **Iteration Delay**: ${state.metadata.iterationDelay}s
- **Workspace**: \`${state.metadata.workspace}\`

---

*Report generated at ${formatTimestamp(Date.now())}*
`;
}

// ============================================================================
// MCP Server Setup
// ============================================================================

const server = new McpServer({
    name: "ralph-state-server",
    version: "1.0.0",
});

// ============================================================================
// Tool: ralph_init_loop
// ============================================================================

server.registerTool(
    "ralph_init_loop",
    {
        description: "Initialize a new Ralph Loop with the given configuration. Returns error if a loop is already running.",
        inputSchema: z.object({
            prompt: z.string().describe("The task prompt for the loop"),
            maxIterations: z.number().optional().describe("Maximum iterations (default: 100)"),
            completionPromise: z.string().optional().describe("Text that signals completion (default: COMPLETE)"),
        }).shape,
    },
    async (args) => {
        const existingState = loadState();

        if (existingState && (existingState.status === "running" || existingState.status === "paused")) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: `A Ralph Loop is already ${existingState.status}`,
                        existingLoop: {
                            loopId: existingState.loopId,
                            status: existingState.status,
                            iteration: existingState.iteration,
                            maxIterations: existingState.maxIterations,
                        },
                        hint: "Use /ralph:cancel to stop it, or /ralph:status to check progress",
                    }, null, 2),
                }],
            };
        }

        const now = Date.now();
        const state: LoopState = {
            loopId: generateLoopId(),
            status: "running",
            prompt: args.prompt as string,
            iteration: 1,
            maxIterations: (args.maxIterations as number) || DEFAULT_MAX_ITERATIONS,
            completionPromise: (args.completionPromise as string) || DEFAULT_COMPLETION_PROMISE,
            startTime: now,
            lastActivity: now,
            totalPausedTime: 0,
            retryCount: 0,
            iterationHistory: [],
            metadata: {
                workspace: WORKSPACE,
                autoCommit: AUTO_COMMIT,
                iterationDelay: ITERATION_DELAY,
                autoCheckpointInterval: AUTO_CHECKPOINT_INTERVAL,
            },
        };

        // Create directories
        ensureStateDir();
        const dirs = [getIterationsDir(), getCheckpointsDir(), getReportsDir(), getLogsDir()];
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }

        saveState(state);

        // Create initial checkpoint
        saveCheckpoint("initial", state, "Auto-created at loop start");

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    success: true,
                    message: "🔄 Ralph Loop initialized successfully!",
                    loop: {
                        loopId: state.loopId,
                        status: state.status,
                        iteration: state.iteration,
                        maxIterations: state.maxIterations,
                        completionPromise: state.completionPromise,
                    },
                    instructions: [
                        "Loop is now RUNNING",
                        "Your changes will persist between iterations",
                        `Signal completion with: <done>${state.completionPromise}</done>`,
                        "Use /ralph:status to check progress anytime",
                        "Use /ralph:monitor to watch in real-time",
                        "Use /ralph:checkpoint <name> to save state",
                    ],
                }, null, 2),
            }],
        };
    }
);

// ============================================================================
// Tool: ralph_get_state
// ============================================================================

server.registerTool(
    "ralph_get_state",
    {
        description: "Get the current state of the Ralph Loop including progress, timing, and status",
        inputSchema: z.object({}).shape,
    },
    async () => {
        const state = loadState();
        const monitorState = loadMonitorState();

        if (!state) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        active: false,
                        status: "idle",
                        emoji: "💤",
                        message: "No Ralph Loop is currently active",
                        hint: "Use /ralph:start-loop to begin a new loop",
                    }, null, 2),
                }],
            };
        }

        const now = Date.now();
        const elapsed = now - state.startTime - state.totalPausedTime;
        const sinceActivity = now - state.lastActivity;
        const progress = Math.round((state.iteration / state.maxIterations) * 100);
        const remaining = state.maxIterations - state.iteration;

        // Calculate metrics
        let avgIterationTime = 0;
        let estimatedRemaining = 0;
        if (state.iterationHistory.length > 0) {
            const totalTime = state.iterationHistory.reduce((sum, iter) => sum + iter.durationMs, 0);
            avgIterationTime = Math.round(totalTime / state.iterationHistory.length);
            estimatedRemaining = avgIterationTime * remaining;
        }

        // Build progress bar
        const barWidth = 30;
        const filled = Math.round((progress / 100) * barWidth);
        const progressBar = "█".repeat(filled) + "░".repeat(barWidth - filled);

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    active: state.status === "running" || state.status === "paused",
                    loopId: state.loopId,
                    status: state.status,
                    emoji: getStatusEmoji(state.status),
                    iteration: {
                        current: state.iteration,
                        max: state.maxIterations,
                        remaining: remaining,
                        progress: `${progress}%`,
                        progressBar: `[${progressBar}]`,
                    },
                    timing: {
                        elapsed: formatDuration(elapsed),
                        sinceLastActivity: formatDuration(sinceActivity),
                        avgIterationTime: avgIterationTime > 0 ? formatDuration(avgIterationTime) : "N/A",
                        estimatedRemaining: estimatedRemaining > 0 ? formatDuration(estimatedRemaining) : "N/A",
                        totalPausedTime: formatDuration(state.totalPausedTime),
                    },
                    completionPromise: state.completionPromise,
                    prompt: state.prompt.length > 300
                        ? state.prompt.substring(0, 300) + "..."
                        : state.prompt,
                    monitoring: monitorState.isMonitoring,
                    retryCount: state.retryCount,
                    workspace: state.metadata.workspace,
                    recentIterations: state.iterationHistory.slice(-3).map(i => ({
                        iteration: i.iteration,
                        duration: formatDuration(i.durationMs),
                        files: i.filesModified?.length || 0,
                        status: i.status,
                    })),
                }, null, 2),
            }],
        };
    }
);

// ============================================================================
// Tool: ralph_increment_iteration
// ============================================================================

server.registerTool(
    "ralph_increment_iteration",
    {
        description: "Move to the next iteration. Records timing and optional notes. Checks for completion.",
        inputSchema: z.object({
            notes: z.string().optional().describe("Notes about what was accomplished"),
            output: z.string().optional().describe("Output to check for completion signal"),
        }).shape,
    },
    async (args) => {
        const state = loadState();

        if (!state) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: "No active Ralph Loop",
                        hint: "Use /ralph:start-loop to begin a new loop",
                    }, null, 2),
                }],
            };
        }

        if (state.status === "paused") {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: "Loop is paused",
                        hint: "Use /ralph:resume to continue",
                    }, null, 2),
                }],
            };
        }

        if (state.status !== "running") {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: `Loop is not running (status: ${state.status})`,
                    }, null, 2),
                }],
            };
        }

        // Check for completion
        const output = args.output as string | undefined;
        if (output) {
            const isComplete = checkCompletionPatterns(output, state.completionPromise) || checkCompletionFile();

            if (isComplete) {
                state.status = "completed";
                state.endTime = Date.now();
                saveState(state);

                // Generate final report
                const report = generateReport(state, "markdown");
                const reportFile = path.join(getReportsDir(), `final-report-${state.loopId}.md`);
                fs.writeFileSync(reportFile, report);

                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            completed: true,
                            message: "🎉 Ralph Loop COMPLETED successfully!",
                            summary: {
                                loopId: state.loopId,
                                totalIterations: state.iteration,
                                duration: formatDuration(Date.now() - state.startTime - state.totalPausedTime),
                            },
                            reportFile,
                        }, null, 2),
                    }],
                };
            }
        }

        // Check max iterations
        if (state.iteration >= state.maxIterations) {
            state.status = "max_iterations";
            state.endTime = Date.now();
            saveState(state);

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        completed: false,
                        error: "Max iterations reached",
                        summary: {
                            loopId: state.loopId,
                            finalIteration: state.iteration,
                            maxIterations: state.maxIterations,
                            duration: formatDuration(Date.now() - state.startTime - state.totalPausedTime),
                        },
                        hint: "Use /ralph:adjust --max-iterations to increase limit, or /ralph:diagnose to analyze",
                    }, null, 2),
                }],
            };
        }

        const now = Date.now();
        const iterationDuration = now - state.lastActivity;

        // Record iteration
        const iterationRecord: IterationRecord = {
            iteration: state.iteration,
            timestamp: now,
            durationMs: iterationDuration,
            notes: args.notes as string | undefined,
            filesModified: getModifiedFiles(),
            status: "success",
        };

        // Auto-commit if enabled
        if (AUTO_COMMIT) {
            iterationRecord.gitCommit = autoCommitChanges(state.iteration, args.notes as string);
        }

        state.iterationHistory.push(iterationRecord);

        // Save iteration details
        const iterDir = getIterationsDir();
        const iterFile = path.join(iterDir, `iteration-${state.iteration}.json`);
        fs.writeFileSync(iterFile, JSON.stringify(iterationRecord, null, 2));

        // Auto-checkpoint if interval reached
        if (AUTO_CHECKPOINT_INTERVAL > 0 && state.iteration % AUTO_CHECKPOINT_INTERVAL === 0) {
            saveCheckpoint(`auto-iter-${state.iteration}`, state, `Auto-checkpoint at iteration ${state.iteration}`);
        }

        // Increment
        state.iteration++;
        state.lastActivity = now;
        state.retryCount = 0; // Reset retry count on successful increment
        saveState(state);

        // Calculate warning
        const remaining = state.maxIterations - state.iteration;
        const warningThreshold = Math.floor(state.maxIterations * 0.25);
        const warning = remaining <= warningThreshold
            ? `⚠️ Only ${remaining} iterations remaining!`
            : null;

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    success: true,
                    iteration: {
                        current: state.iteration,
                        max: state.maxIterations,
                        remaining: remaining,
                        progress: `${Math.round((state.iteration / state.maxIterations) * 100)}%`,
                    },
                    lastIterationDuration: formatDuration(iterationDuration),
                    filesModified: iterationRecord.filesModified?.length || 0,
                    warning: warning,
                    instructions: `Continue working. Signal completion with: <done>${state.completionPromise}</done>`,
                }, null, 2),
            }],
        };
    }
);

// ============================================================================
// Tool: ralph_check_completion
// ============================================================================

server.registerTool(
    "ralph_check_completion",
    {
        description: "Check if completion criteria have been met in the given output",
        inputSchema: z.object({
            output: z.string().describe("The output text to check for completion signal"),
        }).shape,
    },
    async (args) => {
        const state = loadState();
        const output = args.output as string;

        if (!state) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        isComplete: false,
                        reason: "No active loop",
                    }, null, 2),
                }],
            };
        }

        const stringMatch = checkCompletionPatterns(output, state.completionPromise);
        const fileMatch = checkCompletionFile();
        const isComplete = stringMatch || fileMatch;

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    isComplete,
                    matchedBy: stringMatch ? "string_pattern" : fileMatch ? "completion_file" : null,
                    completionPromise: state.completionPromise,
                    expectedPatterns: [
                        `<done>${state.completionPromise}</done>`,
                        `<complete>${state.completionPromise}</complete>`,
                    ],
                    hint: isComplete
                        ? "Completion detected! The loop will end."
                        : `Output completion signal: <done>${state.completionPromise}</done>`,
                }, null, 2),
            }],
        };
    }
);

// ============================================================================
// Tool: ralph_retry_iteration
// ============================================================================

server.registerTool(
    "ralph_retry_iteration",
    {
        description: "Retry the current iteration without incrementing the counter",
        inputSchema: z.object({
            reason: z.string().optional().describe("Reason for retry"),
        }).shape,
    },
    async (args) => {
        const state = loadState();

        if (!state) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: "No active Ralph Loop",
                    }, null, 2),
                }],
            };
        }

        if (state.status !== "running" && state.status !== "paused") {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: `Cannot retry - loop status is: ${state.status}`,
                    }, null, 2),
                }],
            };
        }

        state.retryCount++;
        state.lastActivity = Date.now();

        // Record retry in history
        if (state.iterationHistory.length > 0) {
            const lastIter = state.iterationHistory[state.iterationHistory.length - 1];
            if (lastIter.iteration === state.iteration) {
                lastIter.status = "retry";
                lastIter.notes = (lastIter.notes || "") + ` | Retry: ${args.reason || "No reason given"}`;
            }
        }

        saveState(state);

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    success: true,
                    message: "🔄 Retrying current iteration",
                    iteration: state.iteration,
                    retryCount: state.retryCount,
                    reason: args.reason || "No reason provided",
                    hint: "Try a different approach this time. Check existing files first.",
                    warning: state.retryCount > 3 ? "Multiple retries - consider using /ralph:diagnose" : null,
                }, null, 2),
            }],
        };
    }
);

// ============================================================================
// Tool: ralph_pause_loop
// ============================================================================

server.registerTool(
    "ralph_pause_loop",
    {
        description: "Pause the active Ralph Loop. Can be resumed later.",
        inputSchema: z.object({
            reason: z.string().optional().describe("Reason for pausing"),
        }).shape,
    },
    async (args) => {
        const state = loadState();

        if (!state) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: "No active Ralph Loop to pause",
                    }, null, 2),
                }],
            };
        }

        if (state.status !== "running") {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: `Cannot pause - status is: ${state.status}`,
                        hint: state.status === "paused" ? "Loop is already paused" : "Loop is not running",
                    }, null, 2),
                }],
            };
        }

        state.status = "paused";
        state.pausedAt = Date.now();
        state.lastActivity = Date.now();
        saveState(state);

        // Stop monitoring
        saveMonitorState({ isMonitoring: false });

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    success: true,
                    message: "⏸️ Ralph Loop PAUSED",
                    loop: {
                        loopId: state.loopId,
                        iteration: state.iteration,
                        maxIterations: state.maxIterations,
                    },
                    reason: args.reason || "User requested pause",
                    hints: [
                        "Use /ralph:resume to continue",
                        "Use /ralph:status to check state",
                        "Use /ralph:cancel to stop completely",
                    ],
                }, null, 2),
            }],
        };
    }
);

// ============================================================================
// Tool: ralph_resume_loop
// ============================================================================

server.registerTool(
    "ralph_resume_loop",
    {
        description: "Resume a paused Ralph Loop",
        inputSchema: z.object({}).shape,
    },
    async () => {
        const state = loadState();

        if (!state) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: "No Ralph Loop to resume",
                        hint: "Use /ralph:start-loop to begin a new loop",
                    }, null, 2),
                }],
            };
        }

        if (state.status !== "paused") {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: `Cannot resume - status is: ${state.status}`,
                        hint: state.status === "running" ? "Loop is already running" : "Loop has ended",
                    }, null, 2),
                }],
            };
        }

        const now = Date.now();
        const pauseDuration = state.pausedAt ? now - state.pausedAt : 0;

        state.status = "running";
        state.totalPausedTime += pauseDuration;
        state.pausedAt = undefined;
        state.lastActivity = now;
        saveState(state);

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    success: true,
                    message: "▶️ Ralph Loop RESUMED",
                    loop: {
                        loopId: state.loopId,
                        status: state.status,
                        iteration: state.iteration,
                        maxIterations: state.maxIterations,
                        remaining: state.maxIterations - state.iteration,
                    },
                    pauseDuration: formatDuration(pauseDuration),
                    instructions: `Continue working. Signal completion with: <done>${state.completionPromise}</done>`,
                }, null, 2),
            }],
        };
    }
);

// ============================================================================
// Tool: ralph_complete_loop
// ============================================================================

server.registerTool(
    "ralph_complete_loop",
    {
        description: "Mark the Ralph Loop as successfully completed",
        inputSchema: z.object({
            summary: z.string().optional().describe("Summary of what was accomplished"),
        }).shape,
    },
    async (args) => {
        const state = loadState();

        if (!state) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: "No Ralph Loop to complete",
                    }, null, 2),
                }],
            };
        }

        if (state.status !== "running" && state.status !== "paused") {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: `Cannot complete - status is: ${state.status}`,
                    }, null, 2),
                }],
            };
        }

        const now = Date.now();
        state.status = "completed";
        state.endTime = now;
        state.lastActivity = now;
        saveState(state);

        // Stop monitoring
        saveMonitorState({ isMonitoring: false });

        // Generate report
        const report = generateReport(state, "markdown");
        const reportFile = path.join(getReportsDir(), `final-report-${state.loopId}.md`);
        fs.writeFileSync(reportFile, report);

        // Save completion summary
        const summaryFile = path.join(getFullStatePath(), "completion-summary.md");
        fs.writeFileSync(summaryFile, `# Completion Summary

**Loop ID**: ${state.loopId}
**Completed**: ${formatTimestamp(now)}
**Iterations**: ${state.iteration}
**Duration**: ${formatDuration(now - state.startTime - state.totalPausedTime)}

## Summary
${args.summary || "No summary provided"}

## Original Task
${state.prompt}
`);

        const duration = now - state.startTime - state.totalPausedTime;

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    success: true,
                    message: "🎉 Ralph Loop COMPLETED successfully!",
                    summary: {
                        loopId: state.loopId,
                        totalIterations: state.iteration,
                        duration: formatDuration(duration),
                        avgIterationTime: state.iterationHistory.length > 0
                            ? formatDuration(
                                state.iterationHistory.reduce((s, i) => s + i.durationMs, 0) /
                                state.iterationHistory.length
                            )
                            : "N/A",
                    },
                    files: {
                        report: reportFile,
                        summary: summaryFile,
                    },
                }, null, 2),
            }],
        };
    }
);

// ============================================================================
// Tool: ralph_cancel_loop
// ============================================================================

server.registerTool(
    "ralph_cancel_loop",
    {
        description: "Cancel and stop the active Ralph Loop",
        inputSchema: z.object({
            reason: z.string().optional().describe("Reason for cancellation"),
        }).shape,
    },
    async (args) => {
        const state = loadState();

        if (!state) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: "No Ralph Loop to cancel",
                    }, null, 2),
                }],
            };
        }

        if (state.status !== "running" && state.status !== "paused") {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: `Cannot cancel - status is: ${state.status}`,
                        hint: "Loop has already ended",
                    }, null, 2),
                }],
            };
        }

        const now = Date.now();
        state.status = "cancelled";
        state.endTime = now;
        state.error = args.reason as string || "Cancelled by user";
        state.lastActivity = now;
        saveState(state);

        // Stop monitoring
        saveMonitorState({ isMonitoring: false });

        const duration = now - state.startTime - state.totalPausedTime;

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    success: true,
                    message: "🛑 Ralph Loop CANCELLED",
                    summary: {
                        loopId: state.loopId,
                        iterationsCompleted: state.iteration,
                        duration: formatDuration(duration),
                        reason: state.error,
                    },
                    hint: "Your files are preserved. Use /ralph:start-loop to begin a new loop.",
                }, null, 2),
            }],
        };
    }
);

// ============================================================================
// Tool: ralph_get_history
// ============================================================================

server.registerTool(
    "ralph_get_history",
    {
        description: "Get the iteration history for the current or last Ralph Loop",
        inputSchema: z.object({
            limit: z.number().optional().describe("Maximum iterations to return (default: 10)"),
            full: z.boolean().optional().describe("Include full details"),
        }).shape,
    },
    async (args) => {
        const state = loadState();

        if (!state) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: "No Ralph Loop history available",
                    }, null, 2),
                }],
            };
        }

        const limit = (args.limit as number) || 10;
        const full = (args.full as boolean) || false;
        const history = state.iterationHistory.slice(-limit);

        const formattedHistory = history.map(iter => {
            const base = {
                iteration: iter.iteration,
                timestamp: formatTimestamp(iter.timestamp),
                duration: formatDuration(iter.durationMs),
                filesModified: iter.filesModified?.length || 0,
                status: iter.status,
                gitCommit: iter.gitCommit?.substring(0, 7),
            };

            if (full) {
                return {
                    ...base,
                    notes: iter.notes,
                    files: iter.filesModified,
                };
            }

            return base;
        });

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    loopId: state.loopId,
                    status: state.status,
                    totalIterations: state.iterationHistory.length,
                    showing: history.length,
                    history: formattedHistory,
                }, null, 2),
            }],
        };
    }
);

// ============================================================================
// Tool: ralph_get_iteration_logs
// ============================================================================

server.registerTool(
    "ralph_get_iteration_logs",
    {
        description: "Get detailed logs for a specific iteration or the latest",
        inputSchema: z.object({
            iteration: z.number().optional().describe("Iteration number (default: latest)"),
        }).shape,
    },
    async (args) => {
        const state = loadState();

        if (!state) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: "No Ralph Loop state available",
                    }, null, 2),
                }],
            };
        }

        const iterNum = (args.iteration as number) || state.iteration;
        const iterDir = getIterationsDir();
        const iterFile = path.join(iterDir, `iteration-${iterNum}.json`);
        const outputFile = path.join(iterDir, `iteration-${iterNum}-output.txt`);

        let iterData = null;
        let outputData = null;

        if (fs.existsSync(iterFile)) {
            try {
                iterData = JSON.parse(fs.readFileSync(iterFile, "utf-8"));
            } catch {
                // Ignore parse errors
            }
        }

        if (fs.existsSync(outputFile)) {
            try {
                outputData = fs.readFileSync(outputFile, "utf-8");
                // Truncate if too long
                if (outputData.length > MAX_LOG_SIZE_KB * 1024) {
                    outputData = outputData.substring(0, MAX_LOG_SIZE_KB * 1024) + "\n\n[TRUNCATED]";
                }
            } catch {
                // Ignore read errors
            }
        }

        // Get from history if file not found
        if (!iterData && state.iterationHistory.length > 0) {
            iterData = state.iterationHistory.find(i => i.iteration === iterNum);
        }

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    iteration: iterNum,
                    found: !!iterData,
                    data: iterData ? {
                        timestamp: formatTimestamp(iterData.timestamp),
                        duration: formatDuration(iterData.durationMs),
                        status: iterData.status,
                        notes: iterData.notes,
                        filesModified: iterData.filesModified,
                        gitCommit: iterData.gitCommit,
                    } : null,
                    output: outputData ? {
                        length: outputData.length,
                        preview: outputData.substring(0, 500),
                    } : null,
                }, null, 2),
            }],
        };
    }
);

// ============================================================================
// Tool: ralph_save_iteration_output
// ============================================================================

server.registerTool(
    "ralph_save_iteration_output",
    {
        description: "Save the output from the current iteration for logging",
        inputSchema: z.object({
            output: z.string().describe("The output to save"),
        }).shape,
    },
    async (args) => {
        const state = loadState();

        if (!state) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: "No active Ralph Loop",
                    }, null, 2),
                }],
            };
        }

        const output = args.output as string;
        const maxSize = MAX_LOG_SIZE_KB * 1024;

        const iterDir = getIterationsDir();
        if (!fs.existsSync(iterDir)) {
            fs.mkdirSync(iterDir, { recursive: true });
        }

        const outputFile = path.join(iterDir, `iteration-${state.iteration}-output.txt`);
        const savedOutput = output.length > maxSize
            ? output.substring(0, maxSize) + "\n\n[TRUNCATED]"
            : output;

        fs.writeFileSync(outputFile, savedOutput);

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    success: true,
                    iteration: state.iteration,
                    outputLength: output.length,
                    truncated: output.length > maxSize,
                    savedTo: outputFile,
                }, null, 2),
            }],
        };
    }
);

// ============================================================================
// Tool: ralph_reset_state
// ============================================================================

server.registerTool(
    "ralph_reset_state",
    {
        description: "Clear all Ralph Loop state. This cannot be undone!",
        inputSchema: z.object({
            confirm: z.boolean().describe("Must be true to confirm reset"),
        }).shape,
    },
    async (args) => {
        if (args.confirm !== true) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: "Reset not confirmed",
                        hint: "Set confirm: true to proceed with reset",
                        warning: "This will delete ALL loop state, history, checkpoints, and logs!",
                    }, null, 2),
                }],
            };
        }

        const state = loadState();
        const stateInfo = state ? {
            loopId: state.loopId,
            iterations: state.iteration,
            status: state.status,
        } : null;

        clearAllState();

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    success: true,
                    message: "🗑️ All Ralph Loop state has been cleared",
                    deleted: stateInfo,
                    hint: "Use /ralph:start-loop to begin a new loop",
                }, null, 2),
            }],
        };
    }
);

// ============================================================================
// Tool: ralph_create_checkpoint
// ============================================================================

server.registerTool(
    "ralph_create_checkpoint",
    {
        description: "Create a named checkpoint/save point",
        inputSchema: z.object({
            name: z.string().describe("Name for the checkpoint"),
            description: z.string().optional().describe("Description of this checkpoint"),
        }).shape,
    },
    async (args) => {
        const state = loadState();

        if (!state) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: "No active Ralph Loop",
                    }, null, 2),
                }],
            };
        }

        const name = (args.name as string).replace(/[^a-zA-Z0-9-_]/g, "-");
        const description = args.description as string | undefined;

        // Check if checkpoint already exists
        const existing = loadCheckpoint(name);
        if (existing) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: `Checkpoint '${name}' already exists`,
                        existing: {
                            iteration: existing.iteration,
                            timestamp: formatTimestamp(existing.timestamp),
                        },
                        hint: "Use a different name or delete the existing checkpoint",
                    }, null, 2),
                }],
            };
        }

        const checkpoint = saveCheckpoint(name, state, description);

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    success: true,
                    message: `💾 Checkpoint '${name}' created`,
                    checkpoint: {
                        name: checkpoint.name,
                        iteration: checkpoint.iteration,
                        timestamp: formatTimestamp(checkpoint.timestamp),
                        gitCommit: checkpoint.gitCommit?.substring(0, 7),
                        description: checkpoint.description,
                    },
                    hint: `Restore with: /ralph:restore ${name}`,
                }, null, 2),
            }],
        };
    }
);

// ============================================================================
// Tool: ralph_restore_checkpoint
// ============================================================================

server.registerTool(
    "ralph_restore_checkpoint",
    {
        description: "Restore the loop state from a checkpoint",
        inputSchema: z.object({
            name: z.string().describe("Name of checkpoint to restore"),
        }).shape,
    },
    async (args) => {
        const name = args.name as string;
        const checkpoint = loadCheckpoint(name);

        if (!checkpoint) {
            const available = listCheckpoints();
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: `Checkpoint '${name}' not found`,
                        availableCheckpoints: available.map(c => ({
                            name: c.name,
                            iteration: c.iteration,
                            timestamp: formatTimestamp(c.timestamp),
                        })),
                    }, null, 2),
                }],
            };
        }

        // Restore state from checkpoint
        const restoredState = { ...checkpoint.stateSnapshot };
        restoredState.status = "paused"; // Set to paused so user must explicitly resume
        restoredState.lastActivity = Date.now();

        // Trim history to checkpoint iteration
        restoredState.iterationHistory = restoredState.iterationHistory.filter(
            i => i.iteration <= checkpoint.iteration
        );

        saveState(restoredState);

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    success: true,
                    message: `⏪ Restored to checkpoint '${name}'`,
                    restored: {
                        loopId: restoredState.loopId,
                        iteration: restoredState.iteration,
                        status: restoredState.status,
                        checkpointTimestamp: formatTimestamp(checkpoint.timestamp),
                    },
                    hint: "Use /ralph:resume to continue from this point",
                    warning: "Iterations after this checkpoint are no longer tracked (files remain unchanged)",
                }, null, 2),
            }],
        };
    }
);

// ============================================================================
// Tool: ralph_list_checkpoints
// ============================================================================

server.registerTool(
    "ralph_list_checkpoints",
    {
        description: "List all available checkpoints",
        inputSchema: z.object({}).shape,
    },
    async () => {
        const checkpoints = listCheckpoints();
        const state = loadState();

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    currentLoop: state ? {
                        loopId: state.loopId,
                        iteration: state.iteration,
                    } : null,
                    checkpointCount: checkpoints.length,
                    checkpoints: checkpoints.map(c => ({
                        name: c.name,
                        loopId: c.loopId,
                        iteration: c.iteration,
                        timestamp: formatTimestamp(c.timestamp),
                        description: c.description,
                        gitCommit: c.gitCommit?.substring(0, 7),
                    })),
                    hint: checkpoints.length > 0
                        ? "Use /ralph:restore <name> to restore a checkpoint"
                        : "Use /ralph:checkpoint <name> to create one",
                }, null, 2),
            }],
        };
    }
);

// ============================================================================
// Tool: ralph_delete_checkpoint
// ============================================================================

server.registerTool(
    "ralph_delete_checkpoint",
    {
        description: "Delete a checkpoint by name",
        inputSchema: z.object({
            name: z.string().describe("Name of checkpoint to delete"),
        }).shape,
    },
    async (args) => {
        const name = args.name as string;
        const checkpoint = loadCheckpoint(name);

        if (!checkpoint) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: `Checkpoint '${name}' not found`,
                        availableCheckpoints: listCheckpoints().map(c => c.name),
                    }, null, 2),
                }],
            };
        }

        const deleted = deleteCheckpoint(name);

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    success: deleted,
                    message: deleted
                        ? `Checkpoint '${name}' deleted`
                        : `Failed to delete checkpoint '${name}'`,
                    deletedCheckpoint: {
                        name: checkpoint.name,
                        iteration: checkpoint.iteration,
                        timestamp: formatTimestamp(checkpoint.timestamp),
                    },
                }, null, 2),
            }],
        };
    }
);

// ============================================================================
// Tool: ralph_rollback_iterations
// ============================================================================

server.registerTool(
    "ralph_rollback_iterations",
    {
        description: "Rollback to a previous iteration",
        inputSchema: z.object({
            steps: z.number().optional().describe("Number of iterations to rollback (default: 1)"),
            toIteration: z.number().optional().describe("Specific iteration to rollback to"),
        }).shape,
    },
    async (args) => {
        const state = loadState();

        if (!state) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: "No Ralph Loop state to rollback",
                    }, null, 2),
                }],
            };
        }

        let targetIteration: number;

        if (args.toIteration !== undefined) {
            targetIteration = args.toIteration as number;
        } else {
            const steps = (args.steps as number) || 1;
            targetIteration = state.iteration - steps;
        }

        if (targetIteration < 1) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: "Cannot rollback before iteration 1",
                        currentIteration: state.iteration,
                    }, null, 2),
                }],
            };
        }

        if (targetIteration >= state.iteration) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: "Target iteration must be less than current",
                        currentIteration: state.iteration,
                        targetIteration,
                    }, null, 2),
                }],
            };
        }

        const rolledBackIterations = state.iteration - targetIteration;

        // Update state
        state.iteration = targetIteration;
        state.iterationHistory = state.iterationHistory.filter(i => i.iteration < targetIteration);
        state.lastActivity = Date.now();
        state.status = state.status === "running" || state.status === "paused" ? state.status : "paused";

        saveState(state);

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    success: true,
                    message: `⏮️ Rolled back ${rolledBackIterations} iteration(s)`,
                    rollback: {
                        from: targetIteration + rolledBackIterations,
                        to: targetIteration,
                        iterationsRemoved: rolledBackIterations,
                    },
                    currentState: {
                        iteration: state.iteration,
                        status: state.status,
                    },
                    hint: state.status === "paused" ? "Use /ralph:resume to continue" : "Continue working",
                    warning: "Iteration history after rollback point has been removed",
                }, null, 2),
            }],
        };
    }
);

// ============================================================================
// Tool: ralph_diagnose_loop
// ============================================================================

server.registerTool(
    "ralph_diagnose_loop",
    {
        description: "Analyze the loop to diagnose issues or stuck state",
        inputSchema: z.object({}).shape,
    },
    async () => {
        const state = loadState();

        if (!state) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: "No Ralph Loop to diagnose",
                    }, null, 2),
                }],
            };
        }

        const diagnosis = diagnoseLoop(state);
        const recentCommits = getRecentCommits(5);  // <-- USE THE FUNCTION HERE
        const statusEmoji = {
            healthy: "✅",
            warning: "⚠️",
            stuck: "🔴",
            error: "❌",
        }[diagnosis.status];

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    loopId: state.loopId,
                    currentIteration: state.iteration,
                    overallStatus: `${statusEmoji} ${diagnosis.status.toUpperCase()}`,
                    issues: diagnosis.issues.length > 0 ? diagnosis.issues : ["No issues detected"],
                    recommendations: diagnosis.recommendations.length > 0
                        ? diagnosis.recommendations
                        : ["Continue working on the task"],
                    metrics: {
                        avgIterationTime: formatDuration(diagnosis.metrics.avgIterationTime),
                        progressRate: `${diagnosis.metrics.progressRate.toFixed(1)} files/iteration`,
                        errorRate: `${(diagnosis.metrics.errorRate * 100).toFixed(1)}%`,
                        recentFilesModified: diagnosis.metrics.lastModifiedFiles,
                    },
                    recentGitCommits: recentCommits,  // <-- ADD THIS LINE
                    quickActions: {
                        retry: "/ralph:retry",
                        rollback: "/ralph:rollback",
                        checkpoint: "/ralph:checkpoint stable",
                        adjust: "/ralph:adjust --max-iterations 150",
                    },
                }, null, 2),
            }],
        };
    }
);

// ============================================================================
// Tool: ralph_adjust_parameters
// ============================================================================

server.registerTool(
    "ralph_adjust_parameters",
    {
        description: "Adjust loop parameters without restarting",
        inputSchema: z.object({
            maxIterations: z.number().optional().describe("New max iterations"),
            completionPromise: z.string().optional().describe("New completion promise"),
        }).shape,
    },
    async (args) => {
        const state = loadState();

        if (!state) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: "No active Ralph Loop to adjust",
                    }, null, 2),
                }],
            };
        }

        if (state.status !== "running" && state.status !== "paused") {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: `Cannot adjust - loop status is: ${state.status}`,
                    }, null, 2),
                }],
            };
        }

        const changes: string[] = [];
        const before = {
            maxIterations: state.maxIterations,
            completionPromise: state.completionPromise,
        };

        if (args.maxIterations !== undefined) {
            const newMax = args.maxIterations as number;
            if (newMax <= state.iteration) {
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            success: false,
                            error: "Max iterations must be greater than current iteration",
                            currentIteration: state.iteration,
                            requestedMax: newMax,
                        }, null, 2),
                    }],
                };
            }
            state.maxIterations = newMax;
            changes.push(`maxIterations: ${before.maxIterations} → ${newMax}`);
        }

        if (args.completionPromise !== undefined) {
            const newPromise = args.completionPromise as string;
            state.completionPromise = newPromise;
            changes.push(`completionPromise: "${before.completionPromise}" → "${newPromise}"`);
        }

        if (changes.length === 0) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: "No parameters specified to adjust",
                        currentSettings: before,
                    }, null, 2),
                }],
            };
        }

        state.lastActivity = Date.now();
        saveState(state);

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    success: true,
                    message: "🔧 Parameters adjusted",
                    changes,
                    currentSettings: {
                        maxIterations: state.maxIterations,
                        completionPromise: state.completionPromise,
                        iteration: state.iteration,
                        remaining: state.maxIterations - state.iteration,
                    },
                }, null, 2),
            }],
        };
    }
);

// ============================================================================
// Tool: ralph_generate_report
// ============================================================================

server.registerTool(
    "ralph_generate_report",
    {
        description: "Generate a summary report of the loop",
        inputSchema: z.object({
            format: z.enum(["markdown", "json", "text"]).optional().describe("Report format"),
        }).shape,
    },
    async (args) => {
        const state = loadState();

        if (!state) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: "No Ralph Loop to report on",
                    }, null, 2),
                }],
            };
        }

        const format = (args.format as "markdown" | "json" | "text") || "markdown";
        const report = generateReport(state, format);

        // Save report to file
        const ext = format === "json" ? "json" : format === "text" ? "txt" : "md";
        const reportFile = path.join(getReportsDir(), `report-${state.loopId}-${Date.now()}.${ext}`);

        const reportsDir = getReportsDir();
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        fs.writeFileSync(reportFile, report);

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    success: true,
                    message: "📊 Report generated",
                    format,
                    savedTo: reportFile,
                    preview: report.substring(0, 1000) + (report.length > 1000 ? "\n\n[TRUNCATED - See full file]" : ""),
                }, null, 2),
            }],
        };
    }
);

// ============================================================================
// Tool: ralph_get_config
// ============================================================================

server.registerTool(
    "ralph_get_config",
    {
        description: "Get current configuration settings",
        inputSchema: z.object({}).shape,
    },
    async () => {
        const state = loadState();

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    globalSettings: {
                        defaultMaxIterations: DEFAULT_MAX_ITERATIONS,
                        defaultCompletionPromise: DEFAULT_COMPLETION_PROMISE,
                        iterationDelay: ITERATION_DELAY,
                        autoCommit: AUTO_COMMIT,
                        autoCheckpointInterval: AUTO_CHECKPOINT_INTERVAL,
                        maxLogSizeKB: MAX_LOG_SIZE_KB,
                    },
                    paths: {
                        workspace: WORKSPACE,
                        stateDir: getFullStatePath(),
                        extensionPath: EXTENSION_PATH,
                    },
                    currentLoop: state ? {
                        maxIterations: state.maxIterations,
                        completionPromise: state.completionPromise,
                        autoCommit: state.metadata.autoCommit,
                        iterationDelay: state.metadata.iterationDelay,
                    } : null,
                    howToChange: "Use: gemini extensions settings set gemini-ralph-loop <setting-name>",
                }, null, 2),
            }],
        };
    }
);

// ============================================================================
// Tool: ralph_start_monitor
// ============================================================================

server.registerTool(
    "ralph_start_monitor",
    {
        description: "Start real-time monitoring of the Ralph Loop",
        inputSchema: z.object({}).shape,
    },
    async () => {
        const state = loadState();

        if (!state || (state.status !== "running" && state.status !== "paused")) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: "No active Ralph Loop to monitor",
                        hint: "Start a loop with /ralph:start-loop first",
                    }, null, 2),
                }],
            };
        }

        const now = Date.now();
        saveMonitorState({
            isMonitoring: true,
            startedAt: now,
            lastUpdate: now,
        });

        const elapsed = now - state.startTime - state.totalPausedTime;
        const progress = Math.round((state.iteration / state.maxIterations) * 100);
        const barWidth = 30;
        const filled = Math.round((progress / 100) * barWidth);
        const progressBar = "█".repeat(filled) + "░".repeat(barWidth - filled);

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    success: true,
                    monitoring: true,
                    message: "👁️ Monitoring started",
                    display: {
                        status: `${getStatusEmoji(state.status)} ${state.status.toUpperCase()}`,
                        loopId: state.loopId,
                        progressBar: `[${progressBar}] ${progress}%`,
                        iteration: `${state.iteration} / ${state.maxIterations}`,
                        elapsed: formatDuration(elapsed),
                        lastActivity: formatDuration(now - state.lastActivity) + " ago",
                    },
                    recentActivity: state.iterationHistory.slice(-5).map(i => ({
                        iteration: i.iteration,
                        time: formatTimestamp(i.timestamp),
                        duration: formatDuration(i.durationMs),
                        files: i.filesModified?.length || 0,
                    })),
                    controls: {
                        exit: "Ctrl+C or /ralph:stop-monitor",
                        pause: "/ralph:pause",
                        cancel: "/ralph:cancel",
                    },
                }, null, 2),
            }],
        };
    }
);

// ============================================================================
// Tool: ralph_stop_monitor
// ============================================================================

server.registerTool(
    "ralph_stop_monitor",
    {
        description: "Stop real-time monitoring. Loop continues in background.",
        inputSchema: z.object({}).shape,
    },
    async () => {
        const monitorState = loadMonitorState();

        if (!monitorState.isMonitoring) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        message: "Monitoring was not active",
                    }, null, 2),
                }],
            };
        }

        const duration = monitorState.startedAt
            ? Date.now() - monitorState.startedAt
            : 0;

        saveMonitorState({ isMonitoring: false });

        const state = loadState();

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    success: true,
                    message: "👁️ Monitoring stopped",
                    monitoringDuration: formatDuration(duration),
                    loopStatus: state ? `${getStatusEmoji(state.status)} ${state.status}` : "unknown",
                    loopContinues: state?.status === "running",
                    hint: "Use /ralph:status to check progress",
                }, null, 2),
            }],
        };
    }
);

// ============================================================================
// Tool: ralph_get_monitor_data
// ============================================================================

server.registerTool(
    "ralph_get_monitor_data",
    {
        description: "Get current monitor display data for real-time updates",
        inputSchema: z.object({}).shape,
    },
    async () => {
        const state = loadState();
        const monitorState = loadMonitorState();

        if (!state) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        active: false,
                        message: "No active loop",
                    }, null, 2),
                }],
            };
        }

        const now = Date.now();
        const elapsed = now - state.startTime - state.totalPausedTime;
        const progress = Math.round((state.iteration / state.maxIterations) * 100);
        const barWidth = 40;
        const filled = Math.round((progress / 100) * barWidth);
        const progressBar = "█".repeat(filled) + "░".repeat(barWidth - filled);

        // Update monitor state
        if (monitorState.isMonitoring) {
            monitorState.lastUpdate = now;
            saveMonitorState(monitorState);
        }

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    active: true,
                    isMonitoring: monitorState.isMonitoring,
                    display: {
                        header: "👁️ RALPH LOOP MONITOR",
                        status: `${getStatusEmoji(state.status)} ${state.status.toUpperCase()}`,
                        loopId: state.loopId,
                        progressBar: `[${progressBar}] ${progress}%`,
                        iteration: state.iteration,
                        maxIterations: state.maxIterations,
                        remaining: state.maxIterations - state.iteration,
                        elapsed: formatDuration(elapsed),
                        sinceActivity: formatDuration(now - state.lastActivity),
                    },
                    recentActivity: state.iterationHistory.slice(-5).reverse().map(i => ({
                        iteration: i.iteration,
                        time: formatTimestamp(i.timestamp).substring(11), // Just time
                        files: i.filesModified?.length || 0,
                        status: i.status,
                    })),
                }, null, 2),
            }],
        };
    }
);

// ============================================================================
// Start Server
// ============================================================================

const transport = new StdioServerTransport();
await server.connect(transport);

// Log startup (to stderr so it doesn't interfere with MCP protocol)
console.error(`Ralph Loop MCP Server v1.0.0 started`);
console.error(`Workspace: ${WORKSPACE}`);
console.error(`State Dir: ${getFullStatePath()}`);