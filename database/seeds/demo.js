// Run with: node database/seeds/demo.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const LogEntry = require('../models/LogEntry');
const dbConfig = require('../db_config');

mongoose.connect(dbConfig.mongodb.uri, dbConfig.mongodb.options);

const seed = async () => {
  await User.deleteMany({});
  await LogEntry.deleteMany({});

  const user = await User.create({
    username: 'admin',
    password: '$2a$10$...', // hashed 'admin' – you'd use bcrypt
    faceEmbeddings: [[0.1, 0.2, ...]], // dummy
  });

  await LogEntry.create([
    { eventType: 'authorized', faceData: { confidence: 0.98 } },
    { eventType: 'unauthorized', faceData: { confidence: 0.23 } },
  ]);

  console.log('Database seeded!');
  mongoose.disconnect();
};

seed().catch(console.error);
