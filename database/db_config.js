const { MongoClient } = require('mongodb');

const URI    = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB     = process.env.MONGO_DB  || 'centurion';

let client, db;

async function connect() {
  if (db) return db;
  client = new MongoClient(URI);
  await client.connect();
  db = client.db(DB);
  console.log('[DB] Connected to MongoDB:', DB);
  return db;
}

async function disconnect() {
  if (client) await client.close();
}

module.exports = { connect, disconnect, getDb: () => db };
