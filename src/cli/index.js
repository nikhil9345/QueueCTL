#!/usr/bin/env node
import { Command } from "commander";
import enqueueCommand from "./commands/enqueue.js";
import workerCommand from "./commands/worker.js";
import statusCommand from "./commands/status.js";
import listCommand from "./commands/list.js";
import { listDLQ, retryDLQ } from "./commands/dlq.js";
import { setConfig, getConfig } from "./commands/config.js";

const program = new Command();

program
  .name("queuectl")
  .description("CLI-based job queue system")
  .version("1.0.0");

program
  .command("enqueue <job>")
  .description("Add a new job to the queue")
  .action((job) => enqueueCommand(job));

program
  .command("worker")
  .description("Start or stop workers")
  .command("start")
  .option("--count <n>", "Number of workers", "1")
  .action((options) => workerCommand(options));

program
  .command("status")
  .description("Show job and worker status")
  .action(statusCommand);

program
  .command("list")
  .description("List jobs by state")
  .option("--state <state>")
  .action(listCommand);

const dlq = program.command("dlq").description("Dead Letter Queue commands");

dlq
  .command("list")
  .description("List jobs in the Dead Letter Queue")
  .action(listDLQ);

dlq
  .command("retry <jobId>")
  .description("Retry a job from the Dead Letter Queue")
  .action(retryDLQ);


program
  .command("config")
  .description("Manage configuration")
  .argument("<action>", "set or get")
  .argument("[key]")
  .argument("[value]")
  .action(async (action, key, value) => {
    if (action === "set") {
      await setConfig(key, value);
    } else if (action === "get") {
      await getConfig(key);
    } else {
      console.log("Usage: queuectl config <set|get> <key> [value]");
    }
  });


program.parse(process.argv);
