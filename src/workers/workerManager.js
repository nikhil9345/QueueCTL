import { workerLoop, stopWorkers } from './worker.js';

let managers = [];

export async function startWorkers(count = 1) {
  count = Number(count) || 1;
  for (let i = 0; i < count; i++) {
    const id = `worker-${i + 1}`;
    const p = workerLoop(id).catch((err) => console.error(`Worker ${id} crashed:`, err));
    managers.push(p);
  }
  console.log(`Started ${count} worker(s)`);
}

export async function stopAllWorkers() {
  stopWorkers();
  await Promise.allSettled(managers);
  managers = [];
  console.log('All workers stopped');
}

export default { startWorkers, stopAllWorkers };
