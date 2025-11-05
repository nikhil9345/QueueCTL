import { enqueueJob } from "../src/repositories/jobRepo.js";

async function seedDemoJobs() {
  try {
    const demoJobs = [
      { command: "echo 'Hello from demo job 1'", max_retries: 2 },
      { command: "Start-Sleep -Seconds 3; Write-Output 'Demo job 2 done'", max_retries: 3 }, // Windows safe
      { command: "nonexistentcommand", max_retries: 2 } // intentionally fails → DLQ
    ];

    for (const jobData of demoJobs) {
      const job = await enqueueJob(jobData);
      console.log(`✅ Seeded job: ${job.id} | Command: ${job.command}`);
    }
  } catch (err) {
    console.error("❌ Failed to seed demo jobs:", err.message);
  }
}

seedDemoJobs();
