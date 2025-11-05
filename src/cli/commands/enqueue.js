import { enqueueJob } from "../../repositories/jobRepo.js";

export default async function enqueueCommand(jobJson) {
  try {
    let parsed;

    if (typeof jobJson === "string") {
      try {
        parsed = JSON.parse(jobJson);
      } catch {
        console.error("❌ Invalid JSON format.");
        console.error("💡 Example (PowerShell):");
        console.error(`   node bin/queuectl.js enqueue '{\\"command\\": \\"echo hi\\"}'`);
        console.error("💡 Example (Bash):");
        console.error(`   queuectl enqueue '{"command": "echo hi"}'`);
        process.exit(1);
      }
    } else {
      parsed = jobJson;
    }

    const job = await enqueueJob(parsed);
    console.log(`✅ Job enqueued: ${job.id}`);
  } catch (err) {
    console.error("❌ Enqueue failed:", err?.message || err);
  }
}
