const { connect } = require('../db_config');

class FaceEmbedding {
  static async getByUser(userId) {
    const db = await connect();
    return db.collection('face_embeddings').findOne({ userId });
  }
  static async upsert(userId, embedding, modelVersion = 'v1') {
    const db = await connect();
    return db.collection('face_embeddings').replaceOne(
      { userId },
      { userId, embedding, modelVersion, enrolledAt: new Date().toISOString() },
      { upsert: true }
    );
  }
}
module.exports = FaceEmbedding;
