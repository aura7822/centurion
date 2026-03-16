const { connect } = require('../db_config');

class LogEntry {
  static async recent(limit = 50) {
    const db = await connect();
    return db.collection('access_logs')
      .find({}).sort({ timestamp: -1 }).limit(limit).toArray();
  }
  static async analytics() {
    const db = await connect();
    return db.collection('analytics_summary').findOne({});
  }
}
module.exports = LogEntry;
