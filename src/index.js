import dotenv from "dotenv";
import { ensureJobsFile } from "./repositories/jobRepo.js";

dotenv.config();

(async () => {
  try {
    ensureJobsFile();
    console.log("QueueCTL system initialized.");
    console.log("Use `queuectl --help` for available commands.");
  } catch (err) {
    console.error("Initialization failed:", err.message);
  }
})();
