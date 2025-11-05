// import { fetchPendingJobAndLock, markJobCompleted, markJobFailed, moveJobToDLQ, scheduleRetry } from "../repositories/jobRepo.js";
// import { runCommand } from "../executor/runCommand.js";
// import { computeBackoffSeconds, scheduleJobRetry } from "../services/retryScheduler.js";
// import dotenv from "dotenv";
// import { sleep } from "../utils/time.js";

// dotenv.config();

// let running = true;

// export async function processJob(job) {
//   try {
//     const result = await runCommand(job.id, job.command, job.timeout || (parseInt(process.env.JOB_TIMEOUT_MS) || 300000));
    
//     if (result.success) {
//       console.log(`✅ Job ${job.id} completed:\n${result.stdout || ""}`);
//       await markJobCompleted(job.id, { stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode });
//       return;
//     }

//     // Handle failure
//     const maxRetries = job.max_retries || parseInt(process.env.DEFAULT_MAX_RETRIES) || 3;
//     const attempts = (job.attempts || 0) + 1;
    
//     // Record the failure
//     const errorMsg = result.error || result.stderr || 'Command failed';
//     await markJobFailed(job.id, errorMsg);

//     if (attempts >= maxRetries) {
//       console.log(`💀 Job ${job.id} moved to DLQ after ${attempts} attempts.`);
//       console.log(`Last error: ${errorMsg}`);
//       await moveJobToDLQ(job.id);
//     } else {
//       // Use enhanced retry scheduler
//       const scheduled = await scheduleJobRetry({ ...job, attempts });
//       if (!scheduled) {
//         console.log(`⚠️ Job ${job.id} moved to DLQ due to retry scheduling failure`);
//         await moveJobToDLQ(job.id);
//       } else {
//         console.log(`⚠️ Job ${job.id} failed (attempt ${attempts}/${maxRetries}). Error: ${errorMsg}`);
//       }
//     }
//   } catch (err) {
//     console.error(`Error processing job ${job.id}:`, err);
//     await markJobFailed(job.id, err.message || 'Internal error during job processing');
//     await moveJobToDLQ(job.id);
//   }
// }

// export async function workerLoop(workerId = 'worker') {
//   console.log(`👷 Worker ${workerId} started`);
//   while (running) {
//     const job = await fetchPendingJobAndLock(workerId);
//     if (!job) {
//       await sleep(1000);
//       continue;
//     }
//     console.log(`Processing job ${job.id} -> ${job.command}`);
//     try {
//       await processJob(job);
//     } catch (err) {
//       console.error('Worker processing error:', err && err.message ? err.message : err);
//     }
//   }
//   console.log(`🛑 Worker ${workerId} stopped`);
// }

// export function stopWorkers() {
//   running = false;
// }


import { fetchPendingJobAndLock, markJobCompleted, markJobFailed, moveJobToDLQ } from "../repositories/jobRepo.js";
import { runCommand } from "../executor/runCommand.js";
import { scheduleJobRetry } from "../services/retryScheduler.js";
import dotenv from "dotenv";
import { sleep } from "../utils/time.js";

dotenv.config();

let running = true;

export async function processJob(job) {
  try {
    const result = await runCommand(
      job.id,
      job.command,
      job.timeout || parseInt(process.env.JOB_TIMEOUT_MS) || 300000
    );

    if (result.success) {
      console.log(`✅ Job ${job.id} completed:\n${result.stdout || ""}`);
      await markJobCompleted(job.id, {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
      });
      return;
    }

    const maxRetries =
      job.max_retries ||
      parseInt(process.env.DEFAULT_MAX_RETRIES) ||
      3;
    const attempts = (job.attempts || 0) + 1;

    const errorMsg = result.error || result.stderr || "Command failed";
    await markJobFailed(job.id, errorMsg);

    if (attempts >= maxRetries) {
      console.log(`💀 Job ${job.id} moved to DLQ after ${attempts} attempts.`);
      console.log(`Last error: ${errorMsg}`);
      await moveJobToDLQ(job.id);
      process.stdout.write(""); // flush logs
    } else {
      const scheduled = await scheduleJobRetry({ ...job, attempts });
      if (!scheduled) {
        console.log(`⚠️ Job ${job.id} moved to DLQ due to retry scheduling failure`);
        await moveJobToDLQ(job.id);
      } else {
        console.log(
          `⏳ Scheduling retry for job ${job.id} in ${scheduled.delay}s (attempt ${attempts}/${maxRetries})`
        );
      }
    }
  } catch (err) {
    console.error(`Error processing job ${job.id}:`, err);
    await markJobFailed(job.id, err.message || "Internal error during job processing");
    await moveJobToDLQ(job.id);
  }
}

export async function workerLoop(workerId = "worker") {
  console.log(`👷 Worker ${workerId} started`);

  let idleCycles = 0;
  const MAX_IDLE_CYCLES = 5; // 🟢 threshold before worker exits if no jobs

  while (running) {
    const job = await fetchPendingJobAndLock(workerId);
    if (!job) {
      idleCycles++;
      if (idleCycles >= MAX_IDLE_CYCLES) {
        console.log(`✅ Worker ${workerId} finished all jobs, exiting...`);
        break;
      }
      await sleep(1000);
      continue;
    }

    idleCycles = 0;
    console.log(`Processing job ${job.id} -> ${job.command}`);
    try {
      await processJob(job);
    } catch (err) {
      console.error(
        "Worker processing error:",
        err && err.message ? err.message : err
      );
    }
  }

  console.log(`🛑 Worker ${workerId} stopped`);
}

export function stopWorkers() {
  running = false;
}
