#include "logging.h"
#include "mongo_manager.h"
#include <iostream>
#include <sstream>
#include <iomanip>
#include <random>
#include <filesystem>
namespace fs=std::filesystem;

Logger::Logger(const std::string& logPath, const std::string& db) : dbConnStr_(db) {
    fs::create_directories(fs::path(logPath).parent_path());
    fs::create_directories(snapshotDir_);
    logFile_.open(logPath, std::ios::app);
    if (!logFile_.is_open())
        std::cerr<<"[Logger] Cannot open: "<<logPath<<"\n";
}
Logger::~Logger(){ if(logFile_.is_open()) logFile_.close(); }

std::string Logger::currentTimestamp() {
    auto now=std::chrono::system_clock::now();
    auto t=std::chrono::system_clock::to_time_t(now);
    auto ms=std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch())%1000;
    std::ostringstream o;
    o<<std::put_time(std::gmtime(&t),"%Y-%m-%dT%H:%M:%S")
     <<"."<<std::setfill('0')<<std::setw(3)<<ms.count()<<"Z";
    return o.str();
}

std::string Logger::saveSnapshot(const cv::Mat& frame, const std::string& id) {
    if (frame.empty()) return "";
    std::string path=snapshotDir_+id+".jpg";
    try { cv::imwrite(path,frame,{cv::IMWRITE_JPEG_QUALITY,85}); }
    catch (...) { return ""; }
    return path;
}

void Logger::logEvent(const AccessEvent& ev) {
    std::lock_guard<std::mutex> lock(mutex_);
    std::ostringstream j;
    j<<std::fixed<<std::setprecision(4)
     <<"{\"eventId\":\""<<ev.eventId<<"\",\"userId\":\""<<ev.userId<<"\","
     <<"\"authorized\":"<<(ev.authorized?"true":"false")<<","
     <<"\"timestamp\":\""<<currentTimestamp()<<"\","
     <<"\"ip\":\""<<ev.ipAddress<<"\",\"age\":"<<ev.estimatedAge<<","
     <<"\"gender\":\""<<ev.estimatedGender<<"\","
     <<"\"ethnicity\":\""<<ev.estimatedEthnicity<<"\","
     <<"\"confidence\":"<<ev.confidence<<","
     <<"\"liveness\":"<<(ev.livenessPass?"true":"false")<<","
     <<"\"snapshot\":\""<<ev.snapshotPath<<"\"}\n";
    if (logFile_.is_open()) logFile_<<j.str()<<std::flush;
    std::cout<<"[LOG] "<<(ev.authorized?"AUTH":"UNAUTH")<<" | "<<ev.userId<<"\n";
    if (dbAvailable_) writeToDatabase(ev);
}

void Logger::writeToDatabase(const AccessEvent& ev) {
    if (mongo_) mongo_->insertLog(ev);
}

void Logger::setMongoManager(std::shared_ptr<MongoManager> m) {
    mongo_=std::move(m); dbAvailable_=(mongo_!=nullptr);
    std::cout<<"[Logger] MongoDB "<<(dbAvailable_?"ON":"OFF")<<"\n";
}

std::string Logger::getRecentEventsJSON(int limit) {
    if (mongo_) return mongo_->getRecentLogsJSON(limit);
    std::lock_guard<std::mutex> lock(mutex_);
    std::ifstream f("logs/centurion.log");
    std::deque<std::string> lines; std::string line;
    while(std::getline(f,line)){lines.push_back(line);if((int)lines.size()>limit)lines.pop_front();}
    std::ostringstream o; o<<"[";
    for(size_t i=0;i<lines.size();++i){o<<lines[i];if(i+1<lines.size())o<<",";}
    o<<"]"; return o.str();
}

std::string Logger::getAnalyticsSummaryJSON() {
    if (mongo_) return mongo_->getAnalyticsSummaryJSON();
    return "{\"message\":\"Connect MongoDB for analytics\"}";
}
