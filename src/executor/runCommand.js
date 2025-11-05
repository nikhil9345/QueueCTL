import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

const OUTPUT_DIR = path.resolve(process.cwd(), 'persisted', 'outputs');

async function ensureOutputDir() {
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      console.error('Failed to create output directory:', err);
      throw err;
    }
  }
}

async function saveOutput(jobId, result) {
  try {
    const outputPath = path.join(OUTPUT_DIR, `${jobId}.json`);
    await fs.writeFile(outputPath, JSON.stringify({
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      error: result.error,
      timestamp: new Date().toISOString()
    }, null, 2));
  } catch (err) {
    console.error('Failed to save job output:', err);
  }
}

export async function runCommand(jobId, command, timeoutMs = 300000) {
  await ensureOutputDir();
  
  return new Promise((resolve) => {
    // Use PowerShell on Windows for better command compatibility
    const isWindows = process.platform === 'win32';
    const shell = isWindows ? ['powershell.exe', '-Command'] : ['sh', '-c'];
    const child = spawn(shell[0], [...(shell.slice(1)), command], {
      windowsHide: true
    });

    let stdout = '';
    let stderr = '';
    let finished = false;
    const startTime = Date.now();

    const kill = () => {
      if (!finished) {
        finished = true;
        try { 
          if (isWindows) {
            spawn("taskkill", ["/pid", child.pid, "/T", "/F"]);
          } else {
            child.kill('SIGKILL');
          }
        } catch (e) {}
        const result = { 
          success: false, 
          exitCode: null, 
          stdout, 
          stderr, 
          error: `Timeout after ${timeoutMs}ms`,
          duration: Date.now() - startTime
        };
        saveOutput(jobId, result);
        resolve(result);
      }
    };

    const timer = setTimeout(kill, timeoutMs);

    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    child.on('error', (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      const result = { 
        success: false, 
        exitCode: null, 
        stdout, 
        stderr: err.message || 'Command execution failed', 
        error: err.message || 'Command execution failed',
        duration: Date.now() - startTime
      };
      saveOutput(jobId, result);
      resolve(result);
    });

    child.on('close', (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      const result = { 
        success: code === 0, 
        exitCode: code, 
        stdout, 
        stderr,
        duration: Date.now() - startTime
      };
      saveOutput(jobId, result);
      resolve(result);
    });
  });
}

export async function getJobOutput(jobId) {
  try {
    const outputPath = path.join(OUTPUT_DIR, `${jobId}.json`);
    const content = await fs.readFile(outputPath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    return null;
  }
}

export default { runCommand, getJobOutput };

