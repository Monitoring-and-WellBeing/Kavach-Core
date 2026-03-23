import fs from 'fs';
import path from 'path';
import os from 'os';

const LOG_DIR = path.join(process.env.APPDATA || os.homedir(), 'kavach-logs');
const LOG_FILE = path.join(LOG_DIR, 'agent.log');
const ROTATED_LOG = LOG_FILE + '.1';
const MAX_LOG_BYTES = 5 * 1024 * 1024; // 5 MB — rotate when exceeded

function ensureLogDir(): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function rotateLogs(): void {
  try {
    const stat = fs.statSync(LOG_FILE);
    if (stat.size > MAX_LOG_BYTES) {
      if (fs.existsSync(ROTATED_LOG)) fs.unlinkSync(ROTATED_LOG);
      fs.renameSync(LOG_FILE, ROTATED_LOG);
    }
  } catch {
    // log file does not exist yet — nothing to rotate
  }
}

function write(level: string, message: string, meta?: unknown): void {
  try {
    ensureLogDir();
    rotateLogs();
    const ts = new Date().toISOString();
    const metaStr = meta !== undefined ? ' ' + JSON.stringify(meta) : '';
    const line = `${ts} [${level.padEnd(5)}] ${message}${metaStr}\n`;
    fs.appendFileSync(LOG_FILE, line, 'utf-8');
  } catch {
    // never crash the agent because of a logging failure
  }
}

export const logger = {
  info:  (msg: string, meta?: unknown): void => write('INFO',  msg, meta),
  warn:  (msg: string, meta?: unknown): void => write('WARN',  msg, meta),
  error: (msg: string, meta?: unknown): void => write('ERROR', msg, meta),
  debug: (msg: string, meta?: unknown): void => write('DEBUG', msg, meta),
};
