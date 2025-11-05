import * as repo from "../../repositories/jobRepo.js";

export async function listDLQ() {
  try {
    const jobs = await repo.getDLQJobs();
    if (!jobs.length) {
      console.log("✅ DLQ is empty.");
      return;
    }
    console.log(`💀 Dead Letter Queue (${jobs.length} job(s))`);
    for (const job of jobs) {
      console.log(
        `• ID: ${job.id} | Attempts: ${job.attempts} | Command: ${job.command} | Error: ${job.last_error}`
      );
    }
  } catch (err) {
    console.error("❌ Failed to list DLQ jobs:", err && err.message ? err.message : err);
  }
}

export async function retryDLQ(jobId) {
  try {
    await repo.retryDLQJob(jobId);
    console.log(`🔁 Retried DLQ job ${jobId}`);
  } catch (err) {
    console.error("❌ Failed to retry DLQ job:", err && err.message ? err.message : err);
  }
}

