#pragma once
/**
 * MongoDB C++ Driver wrapper for Centurion®
 * Stores: users, face_embeddings, access_logs, threat_scores
 * Requires: mongocxx driver (libmongocxx-dev)
 */

#include <mongocxx/client.hpp>
#include <mongocxx/instance.hpp>
#include <mongocxx/uri.hpp>
#include <mongocxx/pool.hpp>
#include <bsoncxx/builder/stream/document.hpp>
#include <bsoncxx/builder/basic/document.hpp>
#include <bsoncxx/json.hpp>
#include <bsoncxx/types.hpp>

#include <string>
#include <vector>
#include <optional>
#include <mutex>
#include <chrono>

// Forward declare AccessEvent to avoid circular include
struct AccessEvent;

// ── Document structs ─────────────────────────────────────────────────────────

struct UserDoc {
    std::string userId;
    std::string fullName;
    std::string role;        // "admin" | "user" | "guest"
    bool        isActive;
    std::string createdAt;
};

struct EmbeddingDoc {
    std::string         userId;
    std::vector<float>  embedding;   // 128-d FaceNet vector
    std::string         modelVersion;
    std::string         enrolledAt;
};

struct ThreatDoc {
    std::string ipAddress;
    int         failureCount;
    std::string threatLevel;  // "low" | "medium" | "high" | "critical"
    bool        blocked;
    std::string lastSeen;
};

// ── MongoDB Manager ──────────────────────────────────────────────────────────

class MongoManager {
public:
    explicit MongoManager(const std::string& uri = "mongodb://localhost:27017",
                          const std::string& dbName = "centurion");
    ~MongoManager() = default;

    bool isConnected() const { return connected_; }

    // ── Users ────────────────────────────────────────────────────────────────
    bool   insertUser(const UserDoc& user);
    bool   userExists(const std::string& userId);
    std::optional<UserDoc> getUser(const std::string& userId);

    // ── Embeddings ───────────────────────────────────────────────────────────
    bool   saveEmbedding(const EmbeddingDoc& doc);
    // Load all enrolled embeddings into a map<userId, vector<float>>
    std::unordered_map<std::string, std::vector<float>> loadAllEmbeddings();

    // ── Access Logs ──────────────────────────────────────────────────────────
    bool        insertLog(const AccessEvent& event);
    std::string getRecentLogsJSON(int limit = 50);
    std::string getAnalyticsSummaryJSON();

    // ── Threat Scores ────────────────────────────────────────────────────────
    int  incrementFailures(const std::string& ip);   // returns new count
    bool isBlocked(const std::string& ip);
    void resetFailures(const std::string& ip);
    std::string getThreatLevel(int count);

    // ── Admin ────────────────────────────────────────────────────────────────
    bool verifyAdminPassword(const std::string& username,
                             const std::string& password);

private:
    mongocxx::instance  instance_{};   // must live as long as any client
    mongocxx::client    client_;
    mongocxx::database  db_;
    bool                connected_ = false;
    std::mutex          mutex_;

    std::string currentTimestamp();
    bsoncxx::document::value buildLogDocument(const AccessEvent& event);
    void ensureIndexes();
};
