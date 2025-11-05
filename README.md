# QueueCTL - Background Job Queue System

A robust CLI-based background job queue system built with Node.js. Manages background jobs with worker processes, handles retries using exponential backoff, and maintains a Dead Letter Queue (DLQ) for permanently failed jobs.

## Features

- ✨ File-based persistent job storage
- 👷 Multiple worker processes support
- 🔄 Automatic retries with exponential backoff
- ⚰️ Dead Letter Queue (DLQ) for failed jobs
- ⏱️ Job timeout handling
- 📝 Detailed job output logging
- 🔒 Job locking to prevent duplicate processing
- ⚙️ Configurable retry and backoff settings

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/queuectl.git
cd queuectl

# Install dependencies
npm install

# Make CLI globally available (optional)
npm link
```

## Usage

### Help to get the Commands 
```bash
   # To display all the Commands
   node bin/queuectl.js --help 
```

### 1. Enqueue a Job

```bash
# Add a simple job
node bin/queuectl.js enqueue '{\"command\": \"echo Hello World\"}'

# Add job with custom retries
node bin/queuectl.js enqueue '{\"command\": \"echo Retry Demo\",\ "max_retries\": 5}'

# Add job with timeout
node bin/queuectl.js enqueue '{\"command\": \"long-task\", "timeout": 5000}'
```

### 2. Manage Workers

```bash
# Start 3 worker processes
node bin/queuectl.js worker start --count 3

# Stop all workers gracefully
node bin/queuectl.js worker stop
```

### 3. Monitor Jobs

```bash
# Show overall status
node bin/queuectl.js status

# List pending jobs
node bin/queuectl.js list --state pending

# List failed jobs
node bin/queuectl.js list --state failed
```

### 4. Handle Failed Jobs (DLQ)

```bash
# List jobs in Dead Letter Queue
node bin/queuectl.js dlq list

# Retry a specific job from DLQ
node bin/queuectl.js dlq retry <job-id>
```

### 5. Configure System

```bash
# Set max retries
node bin/queuectl.js config set max-retries 3

# Set backoff base
node bin/queuectl.js config set backoff-base 2

# Update retry limit
node bin/queuectl.js config set max_retries 5
```

## Job States

- **pending**: Waiting to be picked up by a worker
- **processing**: Currently being executed
- **completed**: Successfully executed
- **failed**: Failed but will be retried
- **dead**: Permanently failed (moved to DLQ)

## Architecture

### Key Components

1. **CLI Layer** (`src/cli/`)
   - Handles user commands and options

2. **Job Repository** (`src/repositories/`)
   - Manages JSON persistence and atomic file updates

3. **Worker System** (`src/workers/`)
   - Executes and supervises background jobs

4. **Executor** (`src/executor/`)
   - Runs system commands and captures output

5. **Services** (`src/services/`)
   - Handles retry scheduling and DLQ management

6. **Utils** (`src/utils/`)
   - Provides helper functions (IDs, time, logging)

### Data Storage

Jobs are stored in `persisted/jobs.json` with the following structure:

\`\`\`json
{
  "id": "job_uuid",
  "command": "echo 'Hello'",
  "state": "pending",
  "attempts": 0,
  "max_retries": 3,
  "created_at": "2025-11-05T08:00:00Z",
  "updated_at": "2025-11-05T08:00:00Z",
  "last_error": null,
  "timeout": 30000
}
\`\`\`

### Retry Mechanism

- Failed jobs are retried automatically
- Exponential backoff: delay = base ^ attempts
- After max retries, jobs move to DLQ
- Backoff and retry limits are configurable

## Development

### Run Tests

```bash
# Run unit tests
npm test

# Run demo scenario
node scripts/demo-seed.js
```

### Project Structure

```
queuectl/
├── bin/
│   └── queuectl.js       # CLI entry point
├── src/
│   ├── cli/             # CLI commands
│   ├── repositories/    # Job storage
│   ├── workers/         # Job processing
│   ├── executor/        # Command execution
│   ├── services/        # Business logic
│   └── utils/           # Helpers
├── persisted/           # Data storage
└── scripts/            # Utility scripts
```

## Assumptions & Trade-offs

1. **File-based Storage**
   - Pro: Simple, self-contained, no external dependencies
   - Con: May not scale well for very high volumes

2. **Process-based Workers**
   - Pro: Good isolation, reliable execution
   - Con: Higher resource usage than threads

3. **Command Execution**
   - Pro: Can run any shell command
   - Con: Security implications for untrusted commands

## Example Workflow
```bash
# 1️⃣ Enqueue jobs
node bin/queuectl.js enqueue '{\"command\": \"echo Hello from QueueCTL\"}'
node bin/queuectl.js enqueue '{\"command\": \"nonexistentcommand\"}'
node bin/queuectl.js enqueue '{\"command\": \"Start-Sleep -Seconds 3; Write-Output Done\"}'

# 2️⃣ Start workers
node bin/queuectl.js worker start --count 2

# 3️⃣ Check job status
node bin/queuectl.js status

# 4️⃣ List completed jobs
node bin/queuectl.js list --state completed

# 5️⃣ View and retry DLQ jobs
node bin/queuectl.js dlq list
node bin/queuectl.js dlq retry job_<id>
```
## Example Output
```bash
👷 Worker worker-1 started
👷 Worker worker-2 started
Processing job job_c53fd4ca -> echo Hello from QueueCTL
✅ Job job_c53fd4ca completed:
Hello from QueueCTL

Processing job job_dc2c9fb8 -> Start-Sleep -Seconds 3; Write-Output Done
✅ Job job_dc2c9fb8 completed:
Done

📊 Job Status Summary:
pending      : 0
processing   : 0
completed    : 2
dead         : 0
```

### Author

Nikhil Suhaas Atchuta
Backend Developer — Node.js, System Design, and Process Automation
📧 nikhilsuhaas9@gmail.com

### Submission Checklist

✅ All core features implemented
✅ Jobs persist across restarts
✅ Retry & DLQ mechanisms verified
✅ CLI commands documented
✅ Graceful shutdown tested
✅ README includes full demo
✅ Tested end-to-end successfully