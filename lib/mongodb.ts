import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI as string;
let client: MongoClient;
let db: Db;

if (!process.env.MONGODB_URI) {
  throw new Error("Please add MONGODB_URI to your environment variables");
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!global._mongoClientPromise) {
  client = new MongoClient(uri);
  global._mongoClientPromise = client.connect();
}

const clientPromise: Promise<MongoClient> = global._mongoClientPromise;

export async function getDb() {
  if (!db) {
    const client = await clientPromise;
    db = client.db(process.env.MONGODB_DB || "testmind");
  }
  return db;
}
