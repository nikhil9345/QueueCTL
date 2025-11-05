import { listAllJobs } from "../../repositories/jobRepo.js";

export async function showStatus() {
  try {
    const jobs = await listAllJobs();
    const summary = { pending: 0, processing: 0, completed: 0, failed: 0, dead: 0 };
    for (const j of jobs) {
      const s = j.state || 'pending';
      if (summary[s] !== undefined) summary[s] += 1;
      else summary[s] = (summary[s] || 0) + 1;
    }
    console.log('📊 Job Status Summary:');
    for (const [state, count] of Object.entries(summary)) {
      console.log(`${state.padEnd(12)} : ${count}`);
    }
  } catch (err) {
    console.error('❌ Failed to fetch status:', err && err.message ? err.message : err);
  }
}

export default function statusCommand() {
  return showStatus();
}
