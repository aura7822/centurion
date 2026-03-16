const { connect } = require('../db_config');

class User {
  static async findById(userId) {
    const db = await connect();
    return db.collection('users').findOne({ userId });
  }
  static async create(data) {
    const db = await connect();
    return db.collection('users').insertOne({
      ...data, createdAt: new Date().toISOString(), isActive: true
    });
  }
  static async listAll() {
    const db = await connect();
    return db.collection('users').find({}).toArray();
  }
}
module.exports = User;
