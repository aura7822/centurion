#pragma once
#include <string>
#include <fstream>
#include <mutex>
#include <chrono>
#include <opencv2/opencv.hpp>

struct AccessEvent {
    std::string  eventId;
    std::string  userId;          // "UNKNOWN" if unauthorized
    bool         authorized;
    std::string  timestamp;       // ISO 8601
    std::string  deviceInfo;
    int          estimatedAge;
    std::string  estimatedGender;
    std::string  estimatedEthnicity;
    float        confidence;
    bool         livenessPass;
    std::string  snapshotPath;    // path to saved JPEG
    std::string  ipAddress;
    std::string  blockchainHash;  // optional
};

class Logger {
public:
    Logger(const std::string& logFilePath, const std::string& dbConnStr = "");
    ~Logger();

    // Log an access event (writes to file + DB if configured)
    void logEvent(const AccessEvent& event);

    // Save snapshot image, returns saved path
    std::string saveSnapshot(const cv::Mat& frame, const std::string& eventId);

    // Returns last N events as JSON array string
    std::string getRecentEventsJSON(int limit = 50);

    // Analytics summary JSON
    std::string getAnalyticsSummaryJSON();

    // Wire MongoDB for structured log storage
    void setMongoManager(std::shared_ptr<class MongoManager> mongo);

private:
    std::shared_ptr<class MongoManager> mongo_;
    std::ofstream    logFile_;
    std::mutex       mutex_;
    std::string      snapshotDir_ = "snapshots/";
    std::string      dbConnStr_;
    bool             dbAvailable_ = false;

    std::string generateEventId();
    std::string currentTimestamp();
    void        writeToDatabase(const AccessEvent& event);
};
