import { openDB, type IDBPDatabase } from 'idb';
import { Move } from '../engine/types';

export interface GameRecord {
  id?: number;
  title: string;
  moves: Move[];
  result: string;
  date: string;
  players: { red: string; black: string };
  tags: string[];
  isBuiltin: boolean;
}

const DB_NAME = 'chinese-chess';
const DB_VERSION = 1;
const STORE_NAME = 'records';

let dbInstance: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('title', 'title');
        store.createIndex('date', 'date');
        store.createIndex('isBuiltin', 'isBuiltin');
      }
    },
  });

  return dbInstance;
}

// CRUD operations

export async function addRecord(record: Omit<GameRecord, 'id'>): Promise<number> {
  const db = await getDB();
  return db.add(STORE_NAME, record) as Promise<number>;
}

export async function getAllRecords(): Promise<GameRecord[]> {
  const db = await getDB();
  const records = await db.getAll(STORE_NAME);
  return records.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getRecord(id: number): Promise<GameRecord | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, id);
}

export async function deleteRecord(id: number): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export async function searchRecords(query: string): Promise<GameRecord[]> {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  const q = query.toLowerCase();
  return all.filter(r =>
    r.title.toLowerCase().includes(q) ||
    r.players.red.toLowerCase().includes(q) ||
    r.players.black.toLowerCase().includes(q) ||
    r.tags.some((t: string) => t.toLowerCase().includes(q))
  ).sort((a, b) => b.date.localeCompare(a.date));
}

export async function getRecordCount(): Promise<number> {
  const db = await getDB();
  return db.count(STORE_NAME);
}
