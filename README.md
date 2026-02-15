# ForgeAI Design Bot - Guide & Command Reference

This bot supports normal chat (mention the bot), model controls, agentic project workflows, and a GUI-driven queue system that generates website builds using Ollama.

## Quick Start
1. Install dependencies:
   - `python -m pip install -r requirements.txt`
2. Configure `.env` (or use the GUI):
   - `DISCORD_TOKEN` (required)
   - `OWNER_USER_ID` or `OWNER_USER_IDS`
   - `OLLAMA_HOST` (default: `http://127.0.0.1:11434`)
3. Start the GUI:
   - `Start GUI.bat`
4. Click **Start Bot** in the GUI.

## GUI Overview
The GUI lets you configure and run everything without editing `.env` directly:
- Set Ollama host, default model, planner model, executor model
- Configure allowed guild/channel IDs and owners
- Set project base folder (where outputs are written)
- Manage the **Agentic Developer Manager** (add jobs, attach media, run/pause/resume)
- Import research files (JSON/CSV/DOCX)

### Queue Workflow (GUI)
1. Open **Agentic Developer Manager**
2. Add a project and choose **Build Type** (`website` or `software`)
3. Click **Run Queue**
4. The runner:
   - Website jobs: create premium website plans/build outputs
   - Software jobs: create software plan/build outputs in `software/`
   - Website jobs run a critic pass (rubric scoring + targeted patch pass)
   - Auto-heals bad completions (empty/missing `created_files`) by re-queueing/rebuilding tiers
   - Writes `tier_complete.json` when a tier finishes

### Lightweight Web IDE (Targeted Edits)
For website projects, you can launch a lightweight local IDE from Queue Manager:
1. Select a website job in **Agentic Developer Manager**
2. Click **Open Web IDE**
3. In the IDE:
   - Pick a project
   - If dropdown is empty, click **Open Folder...**, pick your parent folder (for example `Projects`), then choose a child folder and click **Use Selected Project**
   - Choose a model from the **Model** dropdown (or type a custom model override)
   - Click **Pick Element**, then click an element in the preview
   - Enter your edit request
   - Click **Apply Targeted Edit**
   - Use **Project CLI (PowerShell)** to run project-scoped terminal commands with live output
4. The IDE updates only the selected element (plus optional CSS append), then reloads preview.

Files:
- `web_ide.py` local IDE server
- Preview source is served from `<project>/premium/`

### Media Support
When adding a queue item, you can attach images/videos:
- These are copied into the project `media/` folder
- The model receives the media filenames in the job payload

### Research Import
You can import research files to auto-add queue entries:
- JSON, CSV, and DOCX are supported
- DOCX can be parsed by a smaller model (see `DOCX_PARSE_MODEL`)

### Agent Tasks (Autonomous Scheduler)
You can create recurring model tasks that run on a schedule and retain behavior memory:
1. Open **Agent Tasks -> Open Task Manager** (or sidebar **Task Manager**).
2. Define a task prompt, model, and schedule (`manual`, `interval`, `daily`, or `once`).
3. Set reasoning effort (`low`, `medium`, `high`) for models that support it.
4. Optionally set behavior preferences and long-term memory notes.
5. Save the task and click **Start Scheduler**.
6. Use **Run Now** to execute a selected task immediately.

Task chaining and result posting:
- Use `Depends On` with task IDs (comma-separated) to build chained workflows.
- Dependent tasks receive recent upstream output snippets in their prompt context.
- Enable `Post result to webhook` to send task completion summaries to a webhook.
- Webhook URL can be task-specific or inherited from `AGENT_TASK_WEBHOOK` / `DISCORD_QUEUE_WEBHOOK`.
- You can create tasks from Discord with `/task_add` and list them with `/tasks`.
- If no webhook is configured, task completion reports (and TTS when enabled) are forwarded to the bot's allowed Discord channel via local outbox relay.

Scheduler artifacts:
- `agent_tasks.json` task definitions
- `agent_scheduler.py` recurring runner
- `agent_scheduler.log` scheduler events/errors
- `agent_runs/<task-id>/...` output files for each run
- `agent_memory/<task-id>.json` memory snippets fed into future runs

## Chat (mention)
- `@HeyCoach <prompt>` ? Ask a question or request code using the current default model.

## TTS (Voice)
- `/tts <personality> <text>` ? Generate a voice clip from text using a built-in voice personality.
- `/tts_model <name?>` ? Show or set the active TTS model.

## Models
- `/models` ? List models available from the Ollama/OpenAI-compatible host.
- `/model` ? Show the current default model and the available allowlist.
- `/model <name>` ? Set the default model by name.
- `/model <number>` ? Set the default model by its number in the allowlist (if set).
- `/models_stop_all` ? Unload all running Ollama models from memory.

## Agentic Projects
- `/project help` ? Show project command help.
- `/project new <name?>` ? Create a new folder in the project base folder (asks for name if omitted).
- `/project list` ? List existing folders in the project base folder.
- `/project use <name|path>` ? Set the active project to an existing folder (Desktop name or full path).
- `/project pwd` ? Show the current project folder.
- `/project ls` ? List files in the current project folder.
- `/project run <command>` ? Run a shell command in the current project folder (asks for confirmation, then streams live CLI output in Discord).
- `/project build <prompt>` ? Generate project files from a prompt (asks for confirmation before writing).
- `/project build-html <prompt>` ? Generate a single index.html (asks for confirmation).

## Confirmations
- `/confirm yes` ? Approve a pending action (project creation, command execution, or file writes).
- `/confirm no` ? Cancel a pending action.

## Owner Management
- `/menu` ? Show the command menu/help.
- `/readme` ? Post quick-start operator help and attach this README in Discord.
- `/owners list` ? List allowed owner user IDs.
- `/owners add <user_id>` ? Add a new owner user ID.
- `/owners remove <user_id>` ? Remove an owner user ID.

## Slash Commands (Discord)
- `/queue_add_website <company_name> <category> <prompt> [services_csv] [phone] [address]` ? Add a website job to the queue directly from Discord.
- `/queue_add_app <project_name> <prompt> [project_type] [platform] [stack] [features]` ? Add a software/app job to the queue directly from Discord.
- `/queue_list` ? List recent queue jobs and statuses.
- `/queue_status` ? Show current queue status.
- `/queue_watch [seconds]` ? Live-tail `queue.log` into the current Discord channel (15-600s).
- `/queue_run` ? Start the queue runner now.
- `/queue_pause` ? Pause the queue runner.
- `/queue_resume` ? Resume the queue runner.
- `/queue_reset_running` ? Reset stuck jobs back to queued.
- `/queue_clear_lock` ? Remove `queue_runner.lock` if a stale lock blocks new runs.
- `/queue_planner_model <model>` ? Set planner model used by the queue.
- `/queue_executor_model <model>` ? Set executor model used by the queue.
- `/tasks` ? List scheduled tasks.
- `/task_add ...` ? Create a scheduled task directly from Discord.

## Queue Output
Each job writes to a project folder inside your project base directory:
- `media/` (copied images/videos)
- `premium/`
  - `plan-<tier>.md`
  - `plan.json`
  - `brief.md`
  - `critique_report.json`
  - `assets/asset_metadata.json` (when stock images are pulled)
  - `tier_complete.json`
- `software/` (for software build jobs)
  - `brief.md`
  - `plan.json`
  - generated source files
  - `tier_complete.json`

## Notes
- The bot only responds to allowed users (owners) and optionally an allowed guild/channel if set in `.env`.
- Command execution always requires confirmation.
- The GUI can be used to set host, model allowlist, owners, IDs, and the project base folder without editing `.env` directly.
- Set `PROJECT_BASE_DIR` in `.env` to choose where projects are created (defaults to Desktop).
- Set `WEB_IDE_HOST` and `WEB_IDE_PORT` in `.env` to control Web IDE binding (for Tailscale access use `WEB_IDE_HOST=0.0.0.0` and open the same port on the tailnet only).
- Set `DISCORD_QUEUE_WEBHOOK` in `.env` to receive queue progress updates in a Discord channel via webhook.
- Set `DOCX_PARSE_MODEL` in `.env` to let the GUI parse .docx research files via Ollama (default: qwen3:4b).
- Set `ENABLE_OSS20B_HIGH_EFFORT=1` to apply higher-effort request settings when using `gpt-oss:20b`.
- `/tts` automatically splits long text into multiple audio chunks.
- Set `TTS_MAX_TEXT_CHARS` to control per-chunk text size for `/tts` (default: `5000`).
- Set `TTS_MAX_INPUT_CHARS` to control total text size allowed for one `/tts` request (default: `120000`).
- Set `TTS_MAX_CHUNKS` to cap how many chunks a single `/tts` request can create (default: `40`).
- Set `ENABLE_WEB_TOOLS=1` to allow model tool-calls to the built-in `web_search` helper.
- Set `ENABLE_STOCK_IMAGE_TOOL=1` to let the model call `pull_stock_images` and save images under `assets/images/` (`STOCK_IMAGE_SOURCE=auto|pexels|loremflickr|unsplash|picsum`).
- Set `PEXELS_API_KEY` (optional) for more reliable query-matched stock images when `STOCK_IMAGE_SOURCE=auto` or `pexels`.
- Set `ENABLE_CRITIC_PASS=1` to enable rubric scoring and patching (`CRITIC_MODEL`, `CRITIC_MAX_PATCH_ROUNDS`, `CRITIC_TARGET_SCORE`). Default is off.
- Set `CRITIC_TIMEOUT` (seconds) to cap how long critique/patch calls can block tier completion.
- Set `QUEUE_PREMIUM_ONLY=1` (default) to generate only premium tier outputs.
- Add `AGENTS.md` in the project root to define website quality/style guidance used by planner, builder, and critic prompts.
- The generator supports static and framework outputs (TypeScript/JavaScript, React, Next.js, Remix, Astro, Tailwind CSS, Framer Motion, Three.js, and CSS animations) when appropriate.
- The bot remembers the last active project per user (saved to `state.json`).
