import { startWorkers, stopAllWorkers } from '../../workers/workerManager.js';

export default async function workerCommand(options) {
  const sub = options && options[0];
  if (options && options.count) {
    await startWorkers(options.count);
    return;
  }

  if (options === 'start' || (options && options.action === 'start')) {
    const count = (options && options.count) || 1;
    await startWorkers(count);
    return;
  }

  if (options === 'stop' || (options && options.action === 'stop')) {
    await stopAllWorkers();
    return;
  }

  console.log('Usage: queuectl worker start --count <n> | queuectl worker stop');
}
