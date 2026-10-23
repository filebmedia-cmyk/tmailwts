import { MongoClient, Db, Collection } from 'mongodb';
import {
  ApiKeyDocument,
  MailboxDocument,
  MessageDocument,
  DomainDocument,
  SystemSettingsDocument,
} from './models';
import { DEFAULT_SETTINGS } from './default-config';

// Cache client across hot reloads in development
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let indexesCreated = false;

// In-Memory fallback store for quick preview when MONGODB_URI is not yet set
class InMemoryStore {
  apiKeys: ApiKeyDocument[] = [
    {
      id: 'demo-key-1',
      name: 'Default Bot Master Key',
      key: 'tm_live_demo1234567890abcdef',
      maskedKey: 'tm_live_••••••••cdef',
      createdAt: new Date(),
      status: 'active',
      totalRequests: 12,
    },
  ];
  mailboxes: MailboxDocument[] = [];
  messages: MessageDocument[] = [];
  domains: DomainDocument[] = DEFAULT_SETTINGS.fallbackDomains.map((d, i) => ({
    domain: d,
    isActive: true,
    isDefault: i === 0,
    createdAt: new Date(),
  }));
  settings: SystemSettingsDocument = {
    key: 'system_settings',
    brandName: DEFAULT_SETTINGS.brandName,
    brandTagline: DEFAULT_SETTINGS.brandTagline,
    defaultDomain: DEFAULT_SETTINGS.defaultDomain,
    ttlMinutes: DEFAULT_SETTINGS.ttlMinutes,
    adminUsername: DEFAULT_SETTINGS.defaultAdminUsername,
    adminPassword: DEFAULT_SETTINGS.defaultAdminPassword,
    masterAdminKey: DEFAULT_SETTINGS.defaultMasterKey,
    webhookSecret: DEFAULT_SETTINGS.webhookSecret,
    updatedAt: new Date(),
  };
}

const memoryStore = new InMemoryStore();

export async function getDb(): Promise<{ db: Db | null; isInMemory: boolean }> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    return { db: null, isInMemory: true };
  }

  if (cachedClient && cachedDb) {
    return { db: cachedDb, isInMemory: false };
  }

  try {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
    });
    await client.connect();
    const dbName = process.env.MONGODB_DB || 'tmail_database';
    const db = client.db(dbName);

    cachedClient = client;
    cachedDb = db;

    if (!indexesCreated) {
      ensureIndexes(db).catch(console.error);
      indexesCreated = true;
    }

    return { db, isInMemory: false };
  } catch (error) {
    console.error('Failed to connect to MongoDB, falling back to memory store:', error);
    return { db: null, isInMemory: true };
  }
}

export async function ensureIndexes(db: Db) {
  try {
    // 1. Mailbox TTL Index (Auto-delete when expired)
    await db.collection('mailboxes').createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 }
    );
    await db.collection('mailboxes').createIndex({ address: 1 }, { unique: true });

    // 2. Messages TTL Index (Auto-delete when expired)
    await db.collection('messages').createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 }
    );
    await db.collection('messages').createIndex({ mailboxAddress: 1, receivedAt: -1 });

    // 3. API Keys Index
    await db.collection('api_keys').createIndex({ key: 1 }, { unique: true });

    // 4. Domains Index
    await db.collection('domains').createIndex({ domain: 1 }, { unique: true });

    console.log('MongoDB TTL & Performance Indexes verified successfully.');
  } catch (err) {
    console.warn('Index creation notice:', err);
  }
}

// ----------------- Unified Repository Helpers -----------------

export async function repoGetSettings(): Promise<SystemSettingsDocument> {
  const { db, isInMemory } = await getDb();
  if (!isInMemory && db) {
    const found = await db.collection<SystemSettingsDocument>('settings').findOne({ key: 'system_settings' });
    if (found) return found;
    // initialize if not found
    await db.collection<SystemSettingsDocument>('settings').insertOne(memoryStore.settings);
    return memoryStore.settings;
  }
  return memoryStore.settings;
}

export async function repoUpdateSettings(data: Partial<SystemSettingsDocument>): Promise<SystemSettingsDocument> {
  const { db, isInMemory } = await getDb();
  const updated: SystemSettingsDocument = {
    ...memoryStore.settings,
    ...data,
    key: 'system_settings',
    updatedAt: new Date(),
  };

  if (!isInMemory && db) {
    await db.collection<SystemSettingsDocument>('settings').updateOne(
      { key: 'system_settings' },
      { $set: updated },
      { upsert: true }
    );
  }
  memoryStore.settings = updated;
  return updated;
}

// API Keys
export async function repoListApiKeys(): Promise<ApiKeyDocument[]> {
  const { db, isInMemory } = await getDb();
  if (!isInMemory && db) {
    return await db.collection<ApiKeyDocument>('api_keys').find({}).sort({ createdAt: -1 }).toArray();
  }
  return memoryStore.apiKeys;
}

export async function repoFindApiKey(key: string): Promise<ApiKeyDocument | null> {
  const { db, isInMemory } = await getDb();
  if (!isInMemory && db) {
    return await db.collection<ApiKeyDocument>('api_keys').findOne({ key });
  }
  return memoryStore.apiKeys.find(k => k.key === key) || null;
}

export async function repoCreateApiKey(item: ApiKeyDocument): Promise<ApiKeyDocument> {
  const { db, isInMemory } = await getDb();
  if (!isInMemory && db) {
    await db.collection<ApiKeyDocument>('api_keys').insertOne(item);
  } else {
    memoryStore.apiKeys.unshift(item);
  }
  return item;
}

export async function repoUpdateApiKey(id: string, updates: Partial<ApiKeyDocument>): Promise<boolean> {
  const { db, isInMemory } = await getDb();
  if (!isInMemory && db) {
    const res = await db.collection<ApiKeyDocument>('api_keys').updateOne({ id }, { $set: updates });
    return res.matchedCount > 0;
  }
  const idx = memoryStore.apiKeys.findIndex(k => k.id === id);
  if (idx !== -1) {
    memoryStore.apiKeys[idx] = { ...memoryStore.apiKeys[idx], ...updates };
    return true;
  }
  return false;
}

export async function repoDeleteApiKey(id: string): Promise<boolean> {
  const { db, isInMemory } = await getDb();
  if (!isInMemory && db) {
    const res = await db.collection<ApiKeyDocument>('api_keys').deleteOne({ id });
    return res.deletedCount > 0;
  }
  const initialLength = memoryStore.apiKeys.length;
  memoryStore.apiKeys = memoryStore.apiKeys.filter(k => k.id !== id);
  return memoryStore.apiKeys.length < initialLength;
}

// Mailboxes
export async function repoCreateMailbox(mailbox: MailboxDocument): Promise<MailboxDocument> {
  const { db, isInMemory } = await getDb();
  if (!isInMemory && db) {
    await db.collection<MailboxDocument>('mailboxes').updateOne(
      { address: mailbox.address },
      { $set: mailbox },
      { upsert: true }
    );
  } else {
    const existing = memoryStore.mailboxes.findIndex(m => m.address === mailbox.address);
    if (existing !== -1) {
      memoryStore.mailboxes[existing] = mailbox;
    } else {
      memoryStore.mailboxes.push(mailbox);
    }
  }
  return mailbox;
}

export async function repoGetMailbox(address: string): Promise<MailboxDocument | null> {
  const cleanAddr = address.toLowerCase().trim();
  const { db, isInMemory } = await getDb();
  if (!isInMemory && db) {
    return await db.collection<MailboxDocument>('mailboxes').findOne({ address: cleanAddr });
  }
  return memoryStore.mailboxes.find(m => m.address === cleanAddr) || null;
}

export async function repoDeleteMailbox(address: string): Promise<{ deletedMailbox: boolean; deletedMessages: number }> {
  const cleanAddr = address.toLowerCase().trim();
  const { db, isInMemory } = await getDb();
  if (!isInMemory && db) {
    const mRes = await db.collection<MailboxDocument>('mailboxes').deleteOne({ address: cleanAddr });
    const msgRes = await db.collection<MessageDocument>('messages').deleteMany({ mailboxAddress: cleanAddr });
    return { deletedMailbox: mRes.deletedCount > 0, deletedMessages: msgRes.deletedCount };
  }
  memoryStore.mailboxes = memoryStore.mailboxes.filter(m => m.address !== cleanAddr);
  const beforeCount = memoryStore.messages.length;
  memoryStore.messages = memoryStore.messages.filter(msg => msg.mailboxAddress !== cleanAddr);
  return { deletedMailbox: true, deletedMessages: beforeCount - memoryStore.messages.length };
}

// Messages
export async function repoCreateMessage(message: MessageDocument): Promise<MessageDocument> {
  const { db, isInMemory } = await getDb();
  if (!isInMemory && db) {
    await db.collection<MessageDocument>('messages').insertOne(message);
  } else {
    memoryStore.messages.unshift(message);
  }
  return message;
}

export async function repoGetMessagesForMailbox(address: string): Promise<MessageDocument[]> {
  const cleanAddr = address.toLowerCase().trim();
  const { db, isInMemory } = await getDb();
  if (!isInMemory && db) {
    return await db.collection<MessageDocument>('messages')
      .find({ mailboxAddress: cleanAddr })
      .sort({ receivedAt: -1 })
      .toArray();
  }
  return memoryStore.messages
    .filter(m => m.mailboxAddress === cleanAddr)
    .sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());
}

export async function repoGetMessageById(id: string): Promise<MessageDocument | null> {
  const { db, isInMemory } = await getDb();
  if (!isInMemory && db) {
    return await db.collection<MessageDocument>('messages').findOne({ id });
  }
  return memoryStore.messages.find(m => m.id === id) || null;
}

// Domains
export async function repoListDomains(): Promise<DomainDocument[]> {
  const { db, isInMemory } = await getDb();
  if (!isInMemory && db) {
    const list = await db.collection<DomainDocument>('domains').find({}).toArray();
    if (list.length > 0) return list;
    // Seed default domains if empty
    const defaults = memoryStore.domains;
    await db.collection<DomainDocument>('domains').insertMany(defaults);
    return defaults;
  }
  return memoryStore.domains;
}

export async function repoAddDomain(domainName: string): Promise<DomainDocument> {
  const clean = domainName.toLowerCase().trim();
  const doc: DomainDocument = {
    domain: clean,
    isActive: true,
    isDefault: false,
    createdAt: new Date(),
  };
  const { db, isInMemory } = await getDb();
  if (!isInMemory && db) {
    await db.collection<DomainDocument>('domains').updateOne(
      { domain: clean },
      { $set: doc },
      { upsert: true }
    );
  } else {
    if (!memoryStore.domains.some(d => d.domain === clean)) {
      memoryStore.domains.push(doc);
    }
  }
  return doc;
}

export async function repoDeleteDomain(domainName: string): Promise<boolean> {
  const clean = domainName.toLowerCase().trim();
  const { db, isInMemory } = await getDb();
  if (!isInMemory && db) {
    const res = await db.collection<DomainDocument>('domains').deleteOne({ domain: clean });
    return res.deletedCount > 0;
  }
  memoryStore.domains = memoryStore.domains.filter(d => d.domain !== clean);
  return true;
}
