import { listByState, listAllJobs } from "../../repositories/jobRepo.js";

export async function listJobs(state) {
  try {
    const jobs = state ? await listByState(state) : await listAllJobs();

    if (!jobs.length) {
      console.log(`No jobs found${state ? ` in state "${state}"` : ""}.`);
      return;
    }

    console.log(`🧾 Listing ${jobs.length} job(s)${state ? ` [${state}]` : " [all]"}:`);

    for (const job of jobs) {
      console.log(
        `• ID: ${job.id} | State: ${job.state} | Attempts: ${job.attempts}/${job.max_retries} | Command: ${job.command}` +
        (job.last_error ? ` | Error: ${job.last_error.split("\n")[0]}` : "")
      );
    }
  } catch (err) {
    console.error("❌ Failed to list jobs:", err && err.message ? err.message : err);
  }
}

export default function listCommand(options) {
  return listJobs(options && options.state);
}
