# Gemini-Ralph-Loop

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Gemini CLI Extension](https://img.shields.io/badge/Gemini%20CLI-Extension-4285F4.svg)](https://geminicli.com/extensions)
[![GitHub release](https://img.shields.io/github/v/release/kranthik123/Gemini-Ralph-Loop)](https://github.com/kranthik123/Gemini-Ralph-Loop/releases)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg)](https://nodejs.org/)

**Self-referential iterative development loops for Gemini CLI** - Based on the Ralph Wiggum technique by Geoffrey Huntley.

<p align="center">
  <img src="https://img.shields.io/badge/Iterations-∞-blue" alt="Iterations">
  <img src="https://img.shields.io/badge/Persistence-100%25-green" alt="Persistence">
  <img src="https://img.shields.io/badge/Ralph%20Approved-Yes-orange" alt="Ralph Approved">
</p>

---

## 🎯 What is Ralph Loop?

Ralph Loop is a development methodology where:

1. You give an AI agent a task **once**
2. The agent works on the task, creating/modifying files
3. Your changes **persist** in the workspace
4. The loop continues, with the AI seeing its previous work
5. Loop continues until **completion** or **max iterations**

### Key Insight

> The prompt never changes, but the **context** does. Each iteration, the AI sees the files it created/modified, learns from its mistakes, and improves.

### Real-World Results

- ✅ **6 repositories** generated overnight at Y Combinator hackathon
- ✅ **$50k contract** completed for $297 in API costs
- ✅ **Entire programming language** created over 3 months

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔄 **Self-referential loops** | AI builds on its own work across iterations |
| 👁️ **Real-time monitoring** | Watch progress with `/ralph:monitor` |
| ⏸️ **Pause/Resume** | Take breaks without losing progress |
| 💾 **Checkpoints** | Save and restore loop state |
| ⏮️ **Rollback** | Undo iterations when things go wrong |
| 📊 **Progress tracking** | Iteration counts, timing, estimates |
| 🔍 **Completion detection** | String patterns and file signals |
| 🛡️ **Safety limits** | Max iterations prevent runaway loops |
| 📝 **Full history** | Track every iteration with logs |
| 🔧 **Diagnostics** | Analyze stuck loops |
| 📋 **Reports** | Generate summary documentation |

---

## 📁 Project Structure

```
Gemini-Ralph-Loop/
├── src/
│   └── mcp-server.ts          # MCP server implementation (2400+ lines)
├── commands/
│   └── ralph/                 # 19 slash command definitions
│       ├── start-loop.toml    # Start a new development loop
│       ├── status.toml        # Check current loop status
│       ├── monitor.toml       # Real-time progress monitoring
│       ├── pause.toml         # Pause the running loop
│       ├── resume.toml        # Resume a paused loop
│       ├── complete.toml      # Mark loop as completed
│       ├── cancel.toml        # Cancel the current loop
│       ├── checkpoint.toml    # Create a checkpoint
│       ├── restore.toml       # Restore from checkpoint
│       ├── rollback.toml      # Rollback iterations
│       ├── history.toml       # View iteration history
│       ├── diagnose.toml      # Diagnose stuck loops
│       ├── report.toml        # Generate reports
│       ├── config.toml        # View/modify configuration
│       ├── adjust.toml        # Adjust settings mid-run
│       ├── iterate.toml       # Manual iteration control
│       ├── retry.toml         # Retry failed iteration
│       ├── reset.toml         # Clear all state
│       └── help.toml          # Show help information
├── dist/                      # Compiled JavaScript output
├── gemini-extension.json      # Extension manifest
├── GEMINI.md                  # Context file for Gemini CLI
├── package.json               # Node.js package configuration
├── tsconfig.json              # TypeScript configuration
└── LICENSE                    # MIT License
```

---

## 📦 Installation

### From GitHub (Recommended)

```bash
# Install the extension
gemini extensions install https://github.com/kranthik123/Gemini-Ralph-Loop

# Enable auto-updates (recommended)
gemini extensions install https://github.com/kranthik123/Gemini-Ralph-Loop --auto-update
```

### For Development

```bash
# Clone the repository
git clone https://github.com/kranthik123/Gemini-Ralph-Loop.git
cd Gemini-Ralph-Loop

# Install dependencies
npm install

# Build the MCP server
npm run build

# Link for development (changes reflect immediately)
gemini extensions link .
```

### Verify Installation

```bash
# List installed extensions
gemini extensions list

# Start Gemini CLI and check commands
gemini
/ralph:help
```

---

## 🚀 Quick Start

### Basic Usage

```bash
# Start Gemini CLI
gemini

# Start a Ralph Loop
/ralph:start-loop "Build a REST API for todos with CRUD operations and tests" --max-iterations 25

# Monitor progress in real-time
/ralph:monitor

# Check status anytime
/ralph:status
```

### Complete Workflow Example

```bash
# 1. Start a loop with clear requirements
/ralph:start-loop "Create a Node.js CLI calculator.
Requirements:
- Support +, -, *, / operations
- Handle invalid input gracefully
- Include --help flag
- Write tests with Jest

When complete: <done>DONE</done>" -m 20 -c "DONE"

# 2. Monitor progress
/ralph:monitor

# 3. Create checkpoint before risky changes
/ralph:checkpoint "stable-v1"

# 4. If something goes wrong, rollback
/ralph:rollback

# 5. Or restore from checkpoint
/ralph:restore "stable-v1"

# 6. Check what happened
/ralph:history

# 7. Generate final report
/ralph:report
```

---

## 📖 Commands Reference

### Core Loop Control (7 commands)

| Command | Description | Example |
|---------|-------------|---------|
| `/ralph:start-loop` | Start a new loop | `/ralph:start-loop "task" -m 30` |
| `/ralph:status` | Check current status | `/ralph:status` |
| `/ralph:monitor` | Real-time monitoring | `/ralph:monitor` |
| `/ralph:pause` | Pause the loop | `/ralph:pause` |
| `/ralph:resume` | Resume paused loop | `/ralph:resume` |
| `/ralph:complete` | Mark as completed | `/ralph:complete -s "Built API"` |
| `/ralph:cancel` | Cancel the loop | `/ralph:cancel -r "Wrong approach"` |

### Iteration Control (2 commands)

| Command | Description | Example |
|---------|-------------|---------|
| `/ralph:iterate` | Manual iteration control | `/ralph:iterate` |
| `/ralph:retry` | Retry current iteration | `/ralph:retry` |

### History & Debugging (3 commands)

| Command | Description | Example |
|---------|-------------|---------|
| `/ralph:history` | View iteration history | `/ralph:history -n 20` |
| `/ralph:diagnose` | Analyze stuck loops | `/ralph:diagnose` |
| `/ralph:report` | Generate summary report | `/ralph:report -f markdown` |

### State Management (4 commands)

| Command | Description | Example |
|---------|-------------|---------|
| `/ralph:reset` | Clear all state | `/ralph:reset --confirm` |
| `/ralph:checkpoint` | Create save point | `/ralph:checkpoint "v1"` |
| `/ralph:restore` | Restore checkpoint | `/ralph:restore "v1"` |
| `/ralph:rollback` | Undo iterations | `/ralph:rollback -s 2` |

### Configuration (3 commands)

| Command | Description | Example |
|---------|-------------|---------|
| `/ralph:config` | View/modify settings | `/ralph:config` |
| `/ralph:adjust` | Modify mid-run | `/ralph:adjust -m 50` |
| `/ralph:help` | Show help | `/ralph:help checkpoint` |

---

## ⚙️ Configuration

### Extension Settings

Configure after installation:

```bash
# Set default max iterations
gemini extensions settings set gemini-ralph-loop "Default Max Iterations"

# Set default completion promise
gemini extensions settings set gemini-ralph-loop "Default Completion Promise"

# Set iteration delay (helps with rate limiting)
gemini extensions settings set gemini-ralph-loop "Iteration Delay Seconds"

# Enable auto-commit (commits after each iteration)
gemini extensions settings set gemini-ralph-loop "Auto Commit"
```

### Available Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Default Max Iterations | 100 | Maximum iterations before stopping |
| Default Completion Promise | COMPLETE | Text that signals completion |
| Iteration Delay Seconds | 2 | Delay between iterations |
| Auto Commit | false | Git commit after each iteration |
| Auto Checkpoint Interval | 10 | Auto-checkpoint every N iterations |
| Max Log Size KB | 100 | Maximum iteration log size |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `RALPH_WORKSPACE` | Working directory for the loop |
| `RALPH_AUTO_COMMIT` | Enable automatic git commits |
| `RALPH_AUTO_CHECKPOINT_INTERVAL` | Checkpoint interval (iterations) |
| `RALPH_MAX_LOG_SIZE_KB` | Maximum log file size |

---

## 📝 Writing Good Prompts

### ✅ Good Example

```text
/ralph:start-loop "Build a Node.js REST API for user management.

## Requirements
- Express.js framework with TypeScript
- CRUD endpoints: GET/POST/PUT/DELETE /api/users
- Input validation with express-validator
- JWT authentication middleware
- MongoDB with Mongoose ODM
- Jest tests with >80% coverage
- Error handling middleware
- API documentation in README.md

## Project Structure
src/
├── index.ts
├── routes/users.ts
├── middleware/auth.ts
├── models/User.ts
└── tests/users.test.ts

## Verification Steps
1. npm run build - compiles without errors
2. npm test - all tests pass
3. npm start - server starts on port 3000
4. All endpoints return correct status codes

## Completion
When ALL of the above requirements are implemented and verified:
<done>COMPLETE</done>" --max-iterations 30 --completion-promise "COMPLETE"
```

### ❌ Bad Example

```text
/ralph:start-loop "Make a good user API"
```

### Prompt Tips

1. **Be specific** - List exact requirements
2. **Include verification** - How to check if it works
3. **Define structure** - What files/folders to create
4. **Set completion criteria** - When is "done" really done
5. **Use phases** - Break complex tasks into steps

---

## 🔍 Monitoring

The `/ralph:monitor` command provides a real-time dashboard:

```
╔══════════════════════════════════════════════════════════════╗
║  👁️ RALPH LOOP MONITOR                                       ║
╠══════════════════════════════════════════════════════════════╣
║  Status: 🔄 RUNNING                  Loop: ralph-2024-01-15  ║
╠══════════════════════════════════════════════════════════════╣
║  Progress: [████████████░░░░░░░░░░░░░░░░░░] 40%              ║
║  Iteration: 8 / 20         Remaining: 12                     ║
║  Elapsed: 5m 23s           Est. Left: 8m 12s                 ║
╠══════════════════════════════════════════════════════════════╣
║  Recent Activity:                                            ║
║  • [14:32] Iter 8: Created src/routes/users.ts               ║
║  • [14:30] Iter 7: Added validation middleware               ║
║  • [14:28] Iter 6: Fixed test failures                       ║
╠══════════════════════════════════════════════════════════════╣
║  Controls: Ctrl+C to exit | /ralph:pause | /ralph:cancel     ║
╚══════════════════════════════════════════════════════════════╝
```

**Exit**: Use `Ctrl+C` - the loop continues in background.

---

## 📊 Use Cases

### ✅ Ideal For

| Use Case | Why It Works |
|----------|--------------|
| **Greenfield projects** | Build from scratch, iterate until complete |
| **Test-driven development** | Write test → implement → repeat |
| **Code generation** | Generate boilerplate, refine iteratively |
| **Bug fixing** | Iterate until all tests pass |
| **Refactoring** | Gradual improvements with test verification |
| **Documentation** | Generate and refine docs |
| **API development** | Build endpoints incrementally |

### ❌ Not Ideal For

| Use Case | Why It Doesn't Work |
|----------|---------------------|
| **Subjective tasks** | "Make it look good" has no clear completion |
| **One-shot operations** | No benefit from iteration |
| **Production debugging** | Needs human judgment |
| **Security-critical code** | Requires human review |
| **Unclear requirements** | Loop can't clarify with you |

---

## 🔧 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Loop exits immediately | Check Gemini CLI auth, run `/ralph:diagnose` |
| Loop never completes | Verify completion promise matches, check `/ralph:history` |
| Same output repeating | Run `/ralph:diagnose`, improve prompt specificity |
| Rate limiting | Increase iteration delay in settings |
| State corrupted | Run `/ralph:reset --confirm` |

### Debug Commands

```bash
# Check what's happening
/ralph:status
/ralph:history --limit 20

# Diagnose issues
/ralph:diagnose

# View detailed logs (check .ralph-state/ directory)
ls .ralph-state/

# Reset if needed
/ralph:reset --confirm
```

### State Files

Ralph Loop stores state in the `.ralph-state/` directory:

```
.ralph-state/
├── state.json           # Current loop state
├── history.json         # Iteration history
├── monitor.json         # Monitor state
├── checkpoints/         # Saved checkpoints
├── iterations/          # Iteration logs
├── logs/                # Detailed logs
└── reports/             # Generated reports
```

---

## 🛠️ Development

### Available Scripts

```bash
npm run build      # Compile TypeScript to JavaScript
npm run watch      # Watch mode for development
npm run clean      # Remove dist directory
npm run rebuild    # Clean and rebuild
npm run lint       # Run ESLint
npm run typecheck  # Type check without emitting
npm run test       # Run tests
```

### Tech Stack

- **TypeScript** - Type-safe development
- **MCP SDK** - Model Context Protocol integration
- **Zod** - Runtime type validation
- **Node.js 18+** - Runtime environment

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 🙏 Acknowledgments

- **Geoffrey Huntley** - Original Ralph technique ([ghuntley.com/ralph](https://ghuntley.com/ralph))
- **Anthropic** - Claude Code Ralph Wiggum plugin inspiration
- **Google** - Gemini CLI and extension system
- **The Simpsons** - Ralph Wiggum character

---

## 📚 Resources

- [Original Ralph Technique](https://ghuntley.com/ralph/)
- [Gemini CLI Documentation](https://geminicli.com/)
- [MCP Protocol](https://modelcontextprotocol.io/)

---

## 📜 License

MIT License - see [LICENSE](LICENSE) file.

---

<p align="center">
  <i>"Me fail English? That's unpossible!"</i> - Ralph Wiggum
</p>

<p align="center">
  Made with ❤️ by <a href="https://github.com/kranthik123">kranthik123</a>
</p>
