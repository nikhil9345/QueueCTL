export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isoNow() {
  return new Date().toISOString();
}

export function secondsToMs(seconds) {
  return seconds * 1000;
}
