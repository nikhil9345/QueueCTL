

import fs from 'fs';
import path from 'path';
import { generateId } from '../utils/idGen.js';

const JOBS_FILE = path.resolve(process.cwd(), 'persisted', 'jobs.json');

function ensureJobsFile() {
  const dir = path.dirname(JOBS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(JOBS_FILE)) fs.writeFileSync(JOBS_FILE, '[]', 'utf8');
}

function readJobs() {
  ensureJobsFile();
  const raw = fs.readFileSync(JOBS_FILE, 'utf8');
  try {
    return JSON.parse(raw || '[]');
  } catch (err) {
    // If file corrupted, reset to empty array to avoid crashes
    fs.writeFileSync(JOBS_FILE, '[]', 'utf8');
    return [];
  }
}

function writeJobs(jobs) {
  const tmp = `${JOBS_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(jobs, null, 2), 'utf8');
  fs.renameSync(tmp, JOBS_FILE);
}

function nowISO() {
  return new Date().toISOString();
}

async function enqueueJob(jobData) {
  const jobs = readJobs();
  const id = jobData.id || generateId();
  const job = {
    id,
    command: jobData.command,
    state: jobData.state || 'pending',
    attempts: jobData.attempts || 0,
    max_retries: typeof jobData.max_retries === 'number' ? jobData.max_retries : (parseInt(process.env.DEFAULT_MAX_RETRIES) || 3),
    created_at: jobData.created_at || nowISO(),
    updated_at: nowISO(),
    last_error: jobData.last_error || null,
    nextRetry: jobData.nextRetry || null,
    meta: jobData.meta || {}
  };
  jobs.push(job);
  writeJobs(jobs);
  return job;
}

async function fetchPendingJobAndLock(workerId) {
  const jobs = readJobs();
  const now = new Date();
  for (const job of jobs) {
    const nextRetryOK = !job.nextRetry || new Date(job.nextRetry) <= now;
    if (job.state === 'pending' && nextRetryOK) {
      job.state = 'processing';
      job.lockedAt = now.toISOString();
      job.lockedBy = workerId || 'worker';
      job.updated_at = now.toISOString();
      writeJobs(jobs);
      return job;
    }
  }
  return null;
}

async function markJobCompleted(jobId, result = {}) {
  const jobs = readJobs();
  const job = jobs.find((j) => j.id === jobId);
  if (!job) return null;
  job.state = 'completed';
  job.result = result;
  job.updated_at = nowISO();
  writeJobs(jobs);
  return job;
}

async function markJobFailed(jobId, errorMessage) {
  const jobs = readJobs();
  const job = jobs.find((j) => j.id === jobId);
  if (!job) return null;
  job.attempts = (job.attempts || 0) + 1;
  job.last_error = errorMessage;
  job.updated_at = nowISO();
  writeJobs(jobs);
  return job;
}

async function moveJobToDLQ(jobId) {
  const jobs = readJobs();
  const job = jobs.find((j) => j.id === jobId);
  if (!job) return null;
  job.state = 'dead';
  job.updated_at = nowISO();
  writeJobs(jobs);
  return job;
}

async function listByState(state) {
  const jobs = readJobs();
  return jobs.filter((j) => j.state === state);
}

async function getById(id) {
  const jobs = readJobs();
  return jobs.find((j) => j.id === id) || null;
}

async function getDLQJobs() {
  return listByState('dead');
}

async function retryDLQJob(jobId) {
  const jobs = readJobs();
  const job = jobs.find((j) => j.id === jobId);
  if (!job) return null;
  job.state = 'pending';
  job.attempts = 0;
  job.last_error = null;
  job.nextRetry = null;
  job.updated_at = nowISO();
  writeJobs(jobs);
  return job;
}

async function scheduleRetry(jobId, delaySeconds) {
  const jobs = readJobs();
  const job = jobs.find((j) => j.id === jobId);
  if (!job) return null;
  const next = new Date(Date.now() + Math.max(0, delaySeconds) * 1000).toISOString();
  job.nextRetry = next;
  job.state = 'pending';
  job.updated_at = nowISO();
  writeJobs(jobs);
  return job;
}

async function listAllJobs() {
  return readJobs();
}

export {
  ensureJobsFile,
  readJobs,
  writeJobs,
  enqueueJob,
  fetchPendingJobAndLock,
  markJobCompleted,
  markJobFailed,
  moveJobToDLQ,
  listByState,
  getById,
  getDLQJobs,
  retryDLQJob,
  scheduleRetry,
  listAllJobs
};
