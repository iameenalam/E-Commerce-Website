import { MongoClient, type Db, type Collection, type Document } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI env var is required");
}

const dbName = process.env.MONGODB_DB ?? "solezaar";

type Collections = {
  users: Collection;
  products: Collection;
  banners: Collection;
  orders: Collection;
  carts: Collection;
  sessions: Collection;
};

interface MongoGlobal {
  _mongoClientPromise?: Promise<MongoClient>;
  _mongoDbPromise?: Promise<Db>;
  _collections?: Partial<Collections>;
}

const globalWithMongo = globalThis as unknown as typeof globalThis & MongoGlobal;

const clientPromise =
  globalWithMongo._mongoClientPromise ??
  new MongoClient(uri, {
    maxPoolSize: 20,
  }).connect();

if (!globalWithMongo._mongoClientPromise) {
  globalWithMongo._mongoClientPromise = clientPromise;
}

const dbPromise =
  globalWithMongo._mongoDbPromise ??
  clientPromise.then((client) => client.db(dbName));

if (!globalWithMongo._mongoDbPromise) {
  globalWithMongo._mongoDbPromise = dbPromise;
}

export async function getDb(): Promise<Db> {
  return dbPromise;
}

export async function getCollection<TSchema extends Document = Document>(
  name: keyof Collections
): Promise<Collection<TSchema>> {
  if (!globalWithMongo._collections) {
    globalWithMongo._collections = {};
  }
  if (!globalWithMongo._collections[name]) {
    const db = await getDb();
    globalWithMongo._collections[name] = db.collection(name);
  }
  return globalWithMongo._collections[name] as unknown as Collection<TSchema>;
}