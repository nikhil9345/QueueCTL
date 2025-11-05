import dotenv from "dotenv";
import { scheduleRetry } from "../repositories/jobRepo.js";
import { sleep } from "../utils/time.js";

dotenv.config();

export function computeBackoffSeconds(base, attempts) {
  const a = Math.max(1, attempts);
  const delay = Math.pow(base, a);

  const jitter = Math.random() * 0.5 + 0.75;
  return Math.floor(delay * jitter);
}

export async function scheduleJobRetry(job) {
  try {
    const base = parseInt(process.env.BACKOFF_BASE) || 2;
    const nextAttempt = (job.attempts || 0) + 1;
    const delay = computeBackoffSeconds(base, nextAttempt);
    
    console.log(
      `⏳ Scheduling retry for job ${job.id} in ${delay}s (attempt ${nextAttempt}/${job.max_retries})`
    );

    await scheduleRetry(job.id, delay);
    return true;
  } catch (err) {
    console.error(`Failed to schedule retry for job ${job.id}:`, err);
    return false;
  }
}

export default { computeBackoffSeconds, scheduleJobRetry };
