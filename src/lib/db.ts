import fs from 'fs';
import path from 'path';
import os from 'os';
import { Exchange, Participant, EmailLog } from '@/types';

// In-memory fallback if disk writes are restricted
const memoryStore = {
  exchanges: [] as Exchange[],
  participants: [] as Participant[],
  emailLogs: [] as EmailLog[],
};

function getDataDir(): string {
  // Check if running in a serverless environment (Vercel, AWS Lambda, Netlify, etc.)
  if (
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT ||
    (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
  ) {
    return path.join(os.tmpdir(), 'sorteo_data');
  }
  return path.join(process.cwd(), 'data');
}

function getFilePaths() {
  const dataDir = getDataDir();
  return {
    dataDir,
    exchangesFile: path.join(dataDir, 'exchanges.json'),
    participantsFile: path.join(dataDir, 'participants.json'),
    emailLogsFile: path.join(dataDir, 'email_logs.json'),
  };
}

function ensureDataDir() {
  try {
    const { dataDir, exchangesFile, participantsFile, emailLogsFile } = getFilePaths();
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(exchangesFile)) {
      fs.writeFileSync(exchangesFile, JSON.stringify([], null, 2), 'utf-8');
    }
    if (!fs.existsSync(participantsFile)) {
      fs.writeFileSync(participantsFile, JSON.stringify([], null, 2), 'utf-8');
    }
    if (!fs.existsSync(emailLogsFile)) {
      fs.writeFileSync(emailLogsFile, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (err) {
    console.warn('Could not initialize disk storage directory, falling back to memory store:', err);
  }
}

// Exchanges
export function getExchanges(): Exchange[] {
  ensureDataDir();
  const { exchangesFile } = getFilePaths();
  try {
    if (fs.existsSync(exchangesFile)) {
      const data = fs.readFileSync(exchangesFile, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading exchanges from file:', err);
  }
  return memoryStore.exchanges;
}

export function getExchangeById(id: string): Exchange | null {
  const exchanges = getExchanges();
  return exchanges.find(e => e.id === id) || memoryStore.exchanges.find(e => e.id === id) || null;
}

export function saveExchange(exchange: Exchange): void {
  ensureDataDir();
  // Update memory store
  const memIndex = memoryStore.exchanges.findIndex(e => e.id === exchange.id);
  if (memIndex >= 0) {
    memoryStore.exchanges[memIndex] = exchange;
  } else {
    memoryStore.exchanges.push(exchange);
  }

  // Attempt disk write
  const { exchangesFile } = getFilePaths();
  try {
    const exchanges = getExchanges();
    const index = exchanges.findIndex(e => e.id === exchange.id);
    if (index >= 0) {
      exchanges[index] = exchange;
    } else {
      exchanges.push(exchange);
    }
    fs.writeFileSync(exchangesFile, JSON.stringify(exchanges, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write exchange to file system, retained in memory:', err);
  }
}

// Participants
export function getParticipants(exchangeId?: string): Participant[] {
  ensureDataDir();
  const { participantsFile } = getFilePaths();
  let list: Participant[] = [];

  try {
    if (fs.existsSync(participantsFile)) {
      const data = fs.readFileSync(participantsFile, 'utf-8');
      list = JSON.parse(data);
    }
  } catch (err) {
    console.warn('Error reading participants from file:', err);
  }

  // Merge with memory store if needed
  if (list.length === 0 && memoryStore.participants.length > 0) {
    list = memoryStore.participants;
  }

  if (exchangeId) {
    return list.filter(p => p.exchangeId === exchangeId);
  }
  return list;
}

export function saveParticipant(participant: Participant): void {
  ensureDataDir();
  // Update memory store
  const memIndex = memoryStore.participants.findIndex(p => p.id === participant.id);
  if (memIndex >= 0) {
    memoryStore.participants[memIndex] = participant;
  } else {
    memoryStore.participants.push(participant);
  }

  // Attempt disk write
  const { participantsFile } = getFilePaths();
  try {
    const participants = getParticipants();
    const index = participants.findIndex(p => p.id === participant.id);
    if (index >= 0) {
      participants[index] = participant;
    } else {
      participants.push(participant);
    }
    fs.writeFileSync(participantsFile, JSON.stringify(participants, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write participant to disk, retained in memory:', err);
  }
}

export function saveParticipantsBulk(newParticipants: Participant[]): void {
  ensureDataDir();
  // Update memory store
  newParticipants.forEach(np => {
    const index = memoryStore.participants.findIndex(p => p.id === np.id);
    if (index >= 0) {
      memoryStore.participants[index] = np;
    } else {
      memoryStore.participants.push(np);
    }
  });

  // Attempt disk write
  const { participantsFile } = getFilePaths();
  try {
    const participants = getParticipants();
    newParticipants.forEach(np => {
      const index = participants.findIndex(p => p.id === np.id);
      if (index >= 0) {
        participants[index] = np;
      } else {
        participants.push(np);
      }
    });
    fs.writeFileSync(participantsFile, JSON.stringify(participants, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write bulk participants to disk, retained in memory:', err);
  }
}

export function deleteParticipant(id: string): boolean {
  ensureDataDir();
  memoryStore.participants = memoryStore.participants.filter(p => p.id !== id);

  const { participantsFile } = getFilePaths();
  try {
    const participants = getParticipants();
    const filtered = participants.filter(p => p.id !== id);
    if (filtered.length !== participants.length) {
      fs.writeFileSync(participantsFile, JSON.stringify(filtered, null, 2), 'utf-8');
      return true;
    }
  } catch (err) {
    console.warn('Could not delete participant from disk, updated in memory:', err);
    return true;
  }
  return false;
}

// Email Logs
export function getEmailLogs(exchangeId?: string): EmailLog[] {
  ensureDataDir();
  const { emailLogsFile } = getFilePaths();
  let list: EmailLog[] = [];

  try {
    if (fs.existsSync(emailLogsFile)) {
      const data = fs.readFileSync(emailLogsFile, 'utf-8');
      list = JSON.parse(data);
    }
  } catch (err) {
    console.warn('Error reading email logs from file:', err);
  }

  if (list.length === 0 && memoryStore.emailLogs.length > 0) {
    list = memoryStore.emailLogs;
  }

  if (exchangeId) {
    return list.filter(l => l.exchangeId === exchangeId);
  }
  return list;
}

export function saveEmailLog(log: EmailLog): void {
  ensureDataDir();
  memoryStore.emailLogs.unshift(log);

  const { emailLogsFile } = getFilePaths();
  try {
    const logs = getEmailLogs();
    logs.unshift(log);
    fs.writeFileSync(emailLogsFile, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write email log to disk, retained in memory:', err);
  }
}
