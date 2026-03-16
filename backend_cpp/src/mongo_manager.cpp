#include "mongo_manager.h"
#include "logging.h"
#include <mongocxx/exception/exception.hpp>
#include <mongocxx/options/find.hpp>
#include <bsoncxx/builder/basic/document.hpp>
#include <bsoncxx/builder/basic/kvp.hpp>
#include <bsoncxx/builder/stream/document.hpp>
#include <bsoncxx/builder/stream/array.hpp>
#include <bsoncxx/json.hpp>
#include <iostream>
#include <sstream>
#include <iomanip>
#include <ctime>

// Use basic builder (more compatible across bsoncxx versions)
using bsoncxx::builder::basic::make_document;
using bsoncxx::builder::basic::make_array;
using bsoncxx::builder::basic::kvp;
using bsoncxx::builder::stream::document;
using bsoncxx::builder::stream::open_array;
using bsoncxx::builder::stream::close_array;
using bsoncxx::builder::stream::finalize;

MongoManager::MongoManager(const std::string& uri, const std::string& db) {
    try {
        client_ = mongocxx::client(mongocxx::uri(uri));
        db_     = client_[db];
        client_["admin"].run_command(make_document(kvp("ping",1)));
        connected_ = true;
        std::cout << "[MongoDB] Connected: " << uri << "/" << db << "\n";
        ensureIndexes();
    } catch (const mongocxx::exception& e) {
        std::cerr << "[MongoDB] Failed: " << e.what() << "\n";
        connected_ = false;
    }
}

std::string MongoManager::currentTimestamp() {
    auto now = std::chrono::system_clock::now();
    auto t   = std::chrono::system_clock::to_time_t(now);
    std::ostringstream o;
    o << std::put_time(std::gmtime(&t), "%Y-%m-%dT%H:%M:%SZ");
    return o.str();
}

void MongoManager::ensureIndexes() {
    try {
        db_["access_logs"].create_index(make_document(kvp("timestamp",-1)));
        db_["access_logs"].create_index(
            make_document(kvp("eventId",1)),
            mongocxx::options::index{}.unique(true));
        db_["face_embeddings"].create_index(
            make_document(kvp("userId",1)),
            mongocxx::options::index{}.unique(true));
        db_["threat_scores"].create_index(
            make_document(kvp("ipAddress",1)),
            mongocxx::options::index{}.unique(true));
        std::cout << "[MongoDB] Indexes OK\n";
    } catch (...) {}
}

bool MongoManager::insertUser(const UserDoc& u) {
    std::lock_guard<std::mutex> lk(mutex_);
    try {
        db_["users"].insert_one(make_document(
            kvp("userId",   u.userId),
            kvp("fullName", u.fullName),
            kvp("role",     u.role),
            kvp("isActive", u.isActive),
            kvp("createdAt",currentTimestamp())));
        return true;
    } catch (...) { return false; }
}

bool MongoManager::userExists(const std::string& uid) {
    return db_["users"].count_documents(
        make_document(kvp("userId", uid))) > 0;
}

bool MongoManager::saveEmbedding(const EmbeddingDoc& doc) {
    std::lock_guard<std::mutex> lk(mutex_);
    try {
        bsoncxx::builder::basic::array arr;
        for (float v : doc.embedding) arr.append((double)v);

        auto d = make_document(
            kvp("userId",       doc.userId),
            kvp("modelVersion", doc.modelVersion),
            kvp("enrolledAt",   currentTimestamp()),
            kvp("embedding",    arr.extract()));

        mongocxx::options::replace opts; opts.upsert(true);
        db_["face_embeddings"].replace_one(
            make_document(kvp("userId", doc.userId)), d.view(), opts);
        return true;
    } catch (const mongocxx::exception& e) {
        std::cerr << "[MongoDB] saveEmbedding: " << e.what() << "\n";
        return false;
    }
}

std::unordered_map<std::string,std::vector<float>>
MongoManager::loadAllEmbeddings() {
    std::unordered_map<std::string,std::vector<float>> result;
    try {
        for (auto&& d : db_["face_embeddings"].find({})) {
            // Compatible string extraction for all bsoncxx versions
            auto sv  = d["userId"].get_string().value;
            std::string uid(sv.data(), sv.size());
            std::vector<float> emb;
            for (auto&& v : d["embedding"].get_array().value)
                emb.push_back((float)v.get_double().value);
            if (!emb.empty()) result[uid] = std::move(emb);
        }
    } catch (...) {}
    return result;
}

bool MongoManager::insertLog(const AccessEvent& ev) {
    std::lock_guard<std::mutex> lk(mutex_);
    try {
        db_["access_logs"].insert_one(make_document(
            kvp("eventId",           ev.eventId),
            kvp("userId",            ev.userId),
            kvp("authorized",        ev.authorized),
            kvp("timestamp",         currentTimestamp()),
            kvp("ipAddress",         ev.ipAddress),
            kvp("estimatedAge",      ev.estimatedAge),
            kvp("estimatedGender",   ev.estimatedGender),
            kvp("estimatedEthnicity",ev.estimatedEthnicity),
            kvp("confidence",        (double)ev.confidence),
            kvp("livenessPass",      ev.livenessPass),
            kvp("snapshotPath",      ev.snapshotPath),
            kvp("blockchainHash",    ev.blockchainHash)));
        return true;
    } catch (...) { return false; }
}

std::string MongoManager::getRecentLogsJSON(int limit) {
    std::ostringstream o; o << "[";
    try {
        mongocxx::options::find opts;
        opts.limit(limit);
        opts.sort(make_document(kvp("timestamp",-1)));
        bool first = true;
        for (auto&& d : db_["access_logs"].find({}, opts)) {
            if (!first) o << ",";
            o << bsoncxx::to_json(d);
            first = false;
        }
    } catch (...) {}
    o << "]"; return o.str();
}

std::string MongoManager::getAnalyticsSummaryJSON() {
    try {
        // Use basic builder for complex nested docs (avoids stream chaining issues)
        mongocxx::pipeline p{};
        p.group(make_document(
            kvp("_id", bsoncxx::types::b_null{}),
            kvp("total",       make_document(kvp("$sum", 1))),
            kvp("authorized",  make_document(kvp("$sum",
                make_document(kvp("$cond",
                    make_array(bsoncxx::types::b_string{"$authorized"}, 1, 0)))))),
            kvp("avgConfidence", make_document(kvp("$avg","$confidence")))));
        for (auto&& d : db_["access_logs"].aggregate(p))
            return bsoncxx::to_json(d);
    } catch (...) {}
    return "{\"total\":0,\"authorized\":0,\"avgConfidence\":0}";
}

int MongoManager::incrementFailures(const std::string& ip) {
    std::lock_guard<std::mutex> lk(mutex_);
    try {
        mongocxx::options::find_one_and_update opts;
        opts.upsert(true);
        opts.return_document(mongocxx::options::return_document::k_after);
        auto r = db_["threat_scores"].find_one_and_update(
            make_document(kvp("ipAddress", ip)),
            make_document(
                kvp("$inc", make_document(kvp("failureCount", 1))),
                kvp("$set", make_document(kvp("lastSeen", currentTimestamp())))),
            opts);
        if (r) return r->view()["failureCount"].get_int32().value;
    } catch (...) {}
    return 1;
}

bool MongoManager::isBlocked(const std::string& ip) {
    return db_["threat_scores"].count_documents(
        make_document(kvp("ipAddress",ip), kvp("blocked",true))) > 0;
}

void MongoManager::resetFailures(const std::string& ip) {
    std::lock_guard<std::mutex> lk(mutex_);
    try {
        db_["threat_scores"].update_one(
            make_document(kvp("ipAddress", ip)),
            make_document(kvp("$set",
                make_document(kvp("failureCount",0), kvp("blocked",false)))));
    } catch (...) {}
}

std::string MongoManager::getThreatLevel(int n) {
    if (n>=20) return "critical";
    if (n>=10) return "high";
    if (n>=5)  return "medium";
    return "low";
}

bool MongoManager::verifyAdminPassword(const std::string&, const std::string&) {
    return false;
}
