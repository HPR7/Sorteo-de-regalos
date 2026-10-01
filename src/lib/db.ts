import fs from 'fs';
import path from 'path';
import os from 'os';
import { Exchange, Participant, EmailLog } from '@/types';

// In-memory store
const memoryStore = {
  exchanges: [] as Exchange[],
  participants: [] as Participant[],
  emailLogs: [] as EmailLog[],
};

// Check if Upstash / Vercel KV is available in environment
function getKvConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_REST_TOKEN;
  if (url && token) {
    return { url, token };
  }
  return null;
}

// Helper for cloud KV REST calls
async function kvGet<T>(key: string): Promise<T | null> {
  const kv = getKvConfig();
  if (!kv) return null;
  try {
    const res = await fetch(`${kv.url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${kv.token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.result) {
      return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
    }
  } catch (err) {
    console.warn(`Error reading ${key} from KV:`, err);
  }
  return null;
}

async function kvSet<T>(key: string, value: T): Promise<boolean> {
  const kv = getKvConfig();
  if (!kv) return false;
  try {
    const serialized = JSON.stringify(value);
    const res = await fetch(`${kv.url}/set/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kv.token}`,
        'Content-Type': 'application/json',
      },
      body: serialized,
    });
    return res.ok;
  } catch (err) {
    console.warn(`Error writing ${key} to KV:`, err);
    return false;
  }
}

function getDataDir(): string {
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

// Synchronous and Async Exchanges
export function getExchanges(): Exchange[] {
  ensureDataDir();
  const { exchangesFile } = getFilePaths();
  try {
    if (fs.existsSync(exchangesFile)) {
      const data = fs.readFileSync(exchangesFile, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // sync with memory store
        parsed.forEach(e => {
          if (!memoryStore.exchanges.some(me => me.id === e.id)) {
            memoryStore.exchanges.push(e);
          }
        });
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading exchanges from file:', err);
  }
  return memoryStore.exchanges;
}

export async function getExchangesAsync(): Promise<Exchange[]> {
  const kvData = await kvGet<Exchange[]>('sorteo:exchanges');
  if (Array.isArray(kvData) && kvData.length > 0) {
    kvData.forEach(e => saveExchangeLocal(e));
    return kvData;
  }
  return getExchanges();
}

export function getExchangeById(id: string): Exchange | null {
  const exchanges = getExchanges();
  return exchanges.find(e => e.id === id) || memoryStore.exchanges.find(e => e.id === id) || null;
}

export async function getExchangeByIdAsync(id: string): Promise<Exchange | null> {
  const kvData = await kvGet<Exchange>(`sorteo:exchange:${id}`);
  if (kvData) {
    saveExchangeLocal(kvData);
    return kvData;
  }
  const all = await getExchangesAsync();
  return all.find(e => e.id === id) || null;
}

function saveExchangeLocal(exchange: Exchange): void {
  ensureDataDir();
  const memIndex = memoryStore.exchanges.findIndex(e => e.id === exchange.id);
  if (memIndex >= 0) {
    memoryStore.exchanges[memIndex] = exchange;
  } else {
    memoryStore.exchanges.push(exchange);
  }

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

export function saveExchange(exchange: Exchange): void {
  saveExchangeLocal(exchange);
  // Async background sync to cloud KV if available
  const all = getExchanges();
  kvSet('sorteo:exchanges', all).catch(() => {});
  kvSet(`sorteo:exchange:${exchange.id}`, exchange).catch(() => {});
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

  // Merge with memory store
  memoryStore.participants.forEach(p => {
    if (!list.some(lp => lp.id === p.id)) {
      list.push(p);
    }
  });

  if (exchangeId) {
    return list.filter(p => p.exchangeId === exchangeId);
  }
  return list;
}

export async function getParticipantsAsync(exchangeId?: string): Promise<Participant[]> {
  const kvKey = exchangeId ? `sorteo:participants:${exchangeId}` : 'sorteo:participants';
  const kvData = await kvGet<Participant[]>(kvKey);
  if (Array.isArray(kvData) && kvData.length > 0) {
    kvData.forEach(p => saveParticipantLocal(p));
    return kvData;
  }
  return getParticipants(exchangeId);
}

function saveParticipantLocal(participant: Participant): void {
  ensureDataDir();
  const memIndex = memoryStore.participants.findIndex(p => p.id === participant.id);
  if (memIndex >= 0) {
    memoryStore.participants[memIndex] = participant;
  } else {
    memoryStore.participants.push(participant);
  }

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

export function saveParticipant(participant: Participant): void {
  saveParticipantLocal(participant);
  // Async background sync to cloud KV if available
  const allForExchange = getParticipants(participant.exchangeId);
  kvSet(`sorteo:participants:${participant.exchangeId}`, allForExchange).catch(() => {});
  const allGlobal = getParticipants();
  kvSet('sorteo:participants', allGlobal).catch(() => {});
}

export function saveParticipantsBulk(newParticipants: Participant[]): void {
  ensureDataDir();
  newParticipants.forEach(np => {
    saveParticipantLocal(np);
  });

  if (newParticipants.length > 0) {
    const exchangeId = newParticipants[0].exchangeId;
    const allForExchange = getParticipants(exchangeId);
    kvSet(`sorteo:participants:${exchangeId}`, allForExchange).catch(() => {});
  }
}

export function deleteParticipant(id: string): boolean {
  ensureDataDir();
  const p = memoryStore.participants.find(p => p.id === id);
  const exchangeId = p?.exchangeId;
  memoryStore.participants = memoryStore.participants.filter(p => p.id !== id);

  const { participantsFile } = getFilePaths();
  try {
    const participants = getParticipants();
    const filtered = participants.filter(p => p.id !== id);
    if (filtered.length !== participants.length) {
      fs.writeFileSync(participantsFile, JSON.stringify(filtered, null, 2), 'utf-8');
      if (exchangeId) {
        kvSet(`sorteo:participants:${exchangeId}`, filtered.filter(p => p.exchangeId === exchangeId)).catch(() => {});
      }
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

export async function getEmailLogsAsync(exchangeId?: string): Promise<EmailLog[]> {
  const kvKey = exchangeId ? `sorteo:logs:${exchangeId}` : 'sorteo:logs';
  const kvData = await kvGet<EmailLog[]>(kvKey);
  if (Array.isArray(kvData) && kvData.length > 0) {
    return kvData;
  }
  return getEmailLogs(exchangeId);
}

export function saveEmailLog(log: EmailLog): void {
  ensureDataDir();
  memoryStore.emailLogs.unshift(log);

  const { emailLogsFile } = getFilePaths();
  try {
    const logs = getEmailLogs();
    logs.unshift(log);
    fs.writeFileSync(emailLogsFile, JSON.stringify(logs, null, 2), 'utf-8');
    kvSet(`sorteo:logs:${log.exchangeId}`, logs.filter(l => l.exchangeId === log.exchangeId)).catch(() => {});
  } catch (err) {
    console.warn('Could not write email log to disk, retained in memory:', err);
  }
}
