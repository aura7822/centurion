#include "server.h"
#include <iostream>
#include <sstream>
#include <iomanip>
#include <chrono>

// ── Minimal JSON string extractor ────────────────────────────
// Properly handles escaped quotes and long base64 values
namespace jsonparse {
std::string getString(const std::string& body, const std::string& key) {
    std::string needle = "\"" + key + "\"";
    auto kp = body.find(needle);
    if (kp == std::string::npos) return "";
    // Find the colon after the key
    auto colon = body.find(':', kp + needle.size());
    if (colon == std::string::npos) return "";
    // Find the opening quote of the value
    auto q1 = body.find('"', colon + 1);
    if (q1 == std::string::npos) return "";
    // Find closing quote — skip escaped quotes
    std::string result;
    size_t i = q1 + 1;
    while (i < body.size()) {
        if (body[i] == '\\' && i + 1 < body.size()) {
            // handle escape sequence
            char next = body[i+1];
            if (next == '"') result += '"';
            else if (next == '\\') result += '\\';
            else if (next == 'n') result += '\n';
            else if (next == 'r') result += '\r';
            else if (next == 't') result += '\t';
            else { result += '\\'; result += next; }
            i += 2;
        } else if (body[i] == '"') {
            break; // end of string value
        } else {
            result += body[i++];
        }
    }
    return result;
}
}

namespace b64 {
static const std::string C="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
std::vector<unsigned char> decode(const std::string& s){
    std::vector<unsigned char> r; int i=0,in=0; unsigned char c3[3],c4[4];
    int len=s.size();
    while(len--&&s[in]!='='&&(isalnum(s[in])||s[in]=='+'||s[in]=='/')){
        c4[i++]=s[in++];
        if(i==4){for(int k=0;k<4;k++)c4[k]=C.find(c4[k]);
            c3[0]=(c4[0]<<2)+((c4[1]&0x30)>>4);
            c3[1]=((c4[1]&0xf)<<4)+((c4[2]&0x3c)>>2);
            c3[2]=((c4[2]&3)<<6)+c4[3];
            for(int k=0;k<3;k++)r.push_back(c3[k]);i=0;}
    }
    if(i){for(int j=i;j<4;j++)c4[j]=0;for(int j=0;j<4;j++)c4[j]=C.find(c4[j]);
        c3[0]=(c4[0]<<2)+((c4[1]&0x30)>>4);
        c3[1]=((c4[1]&0xf)<<4)+((c4[2]&0x3c)>>2);
        c3[2]=((c4[2]&3)<<6)+c4[3];
        for(int j=0;j<i-1;j++)r.push_back(c3[j]);}
    return r;
}
}

CenturionServer::CenturionServer(int port,
    FaceRecognizer& rec,DemographicsEstimator& dem,
    LivenessDetector& liv,Logger& log,IoTController& iot,
    std::shared_ptr<MongoManager> mongo)
    :port_(port),recognizer_(rec),demographics_(dem),
     liveness_(liv),logger_(log),iot_(iot),mongo_(std::move(mongo)){}

void CenturionServer::setCORSHeaders(httplib::Response& res){
    res.set_header("Access-Control-Allow-Origin","*");
    res.set_header("Access-Control-Allow-Methods","GET, POST, OPTIONS");
    res.set_header("Access-Control-Allow-Headers","Content-Type, Authorization");
}

cv::Mat CenturionServer::base64ToMat(const std::string& b64str){
    std::string d = b64str;
    auto p = d.find(',');
    if (p != std::string::npos) d = d.substr(p + 1);
    // Strip whitespace/newlines that might corrupt base64
    d.erase(std::remove_if(d.begin(), d.end(), [](unsigned char c){
        return c == '\n' || c == '\r' || c == ' ';
    }), d.end());
    auto dec = b64::decode(d);
    if (dec.empty()) return cv::Mat();
    return cv::imdecode(std::vector<uchar>(dec.begin(), dec.end()), cv::IMREAD_COLOR);
}

void CenturionServer::handleIdentify(const httplib::Request& req, httplib::Response& res){
    setCORSHeaders(res);
    try {
        std::string imgData = jsonparse::getString(req.body, "image");
        if (imgData.empty()) {
            res.status = 400;
            res.set_content("{\"error\":\"missing image\"}", "application/json");
            return;
        }
        cv::Mat frame = base64ToMat(imgData);
        if (frame.empty()) {
            res.status = 400;
            res.set_content("{\"error\":\"decode failed\"}", "application/json");
            return;
        }

        FaceResult    fr = recognizer_.identify(frame);
        LivenessResult lv = liveness_.check(frame);
        Demographics  dm{25,"Unknown",0.5f,"Unknown",0.0f};
        if (!fr.boundingBox.empty()) {
            cv::Rect safe = fr.boundingBox & cv::Rect(0,0,frame.cols,frame.rows);
            if (!safe.empty()) dm = demographics_.estimate(frame(safe));
        }

        AccessEvent ev;
        auto now = std::chrono::system_clock::now();
        ev.eventId = "evt-" + std::to_string(
            std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count());
        ev.userId = fr.userId;
        ev.authorized = fr.identified && lv.isLive;
        ev.ipAddress = req.get_header_value("X-Forwarded-For");
        if (ev.ipAddress.empty()) ev.ipAddress = req.remote_addr;
        ev.estimatedAge = dm.age;
        ev.estimatedGender = dm.gender;
        ev.estimatedEthnicity = dm.ethnicity;
        ev.confidence = fr.confidence;
        ev.livenessPass = lv.isLive;
        if (!ev.authorized) ev.snapshotPath = logger_.saveSnapshot(frame, ev.eventId);
        logger_.logEvent(ev);

        IoTStatus iotS;
        if (ev.authorized) {
            iotS = iot_.trigger(IoTEvent::AUTHORIZED, fr.userId);
        } else {
            std::lock_guard<std::mutex> lk(failureMutex_);
            failureCount_[ev.ipAddress]++;
            iotS = (failureCount_[ev.ipAddress] >= 5)
                ? iot_.trigger(IoTEvent::ALERT)
                : iot_.trigger(IoTEvent::UNAUTHORIZED);
        }

        std::ostringstream j;
        j << std::fixed << std::setprecision(4)
          << "{\"eventId\":\"" << ev.eventId << "\""
          << ",\"authorized\":"  << (ev.authorized ? "true" : "false")
          << ",\"userId\":\""    << fr.userId << "\""
          << ",\"confidence\":"  << fr.confidence
          << ",\"liveness\":{\"isLive\":" << (lv.isLive ? "true" : "false")
          << ",\"score\":"       << lv.score
          << ",\"blinkDetected\":" << (lv.blinkDetected ? "true" : "false") << "}"
          << ",\"demographics\":{\"age\":" << dm.age
          << ",\"gender\":\""    << dm.gender << "\",\"genderConf\":" << dm.genderConf
          << ",\"ethnicity\":\"" << dm.ethnicity << "\",\"ethnicityConf\":" << dm.ethnicityConf << "}"
          << ",\"iot\":"         << iot_.getStatusJSON()
          << ",\"snapshotPath\":\"" << ev.snapshotPath << "\"}";
        res.set_content(j.str(), "application/json");

    } catch (const std::exception& e) {
        std::cerr << "[ERROR] identify: " << e.what() << "\n";
        res.status = 500;
        res.set_content(std::string("{\"error\":\"") + e.what() + "\"}", "application/json");
    } catch (...) {
        std::cerr << "[ERROR] identify: unknown exception\n";
        res.status = 500;
        res.set_content("{\"error\":\"internal error\"}", "application/json");
    }
}

void CenturionServer::handleEnroll(const httplib::Request& req, httplib::Response& res){
    setCORSHeaders(res);
    try {
        // Use proper JSON parser that handles long base64 strings
        std::string uid      = jsonparse::getString(req.body, "userId");
        std::string imgData  = jsonparse::getString(req.body, "image");

        std::cerr << "[ENROLL] userId='" << uid
                  << "' imageLen=" << imgData.size() << "\n";

        if (uid.empty() || imgData.empty()) {
            res.status = 400;
            res.set_content("{\"error\":\"userId and image required\"}", "application/json");
            return;
        }

        cv::Mat frame = base64ToMat(imgData);
        if (frame.empty()) {
            res.status = 400;
            res.set_content("{\"error\":\"invalid image — could not decode\"}", "application/json");
            return;
        }

        std::cerr << "[ENROLL] Frame: " << frame.cols << "x" << frame.rows << "\n";

        auto faces = recognizer_.detectFaces(frame);
        std::cerr << "[ENROLL] Faces detected: " << faces.size() << "\n";

        if (faces.empty()) {
            res.set_content("{\"error\":\"no face detected — ensure face is clearly visible and well-lit\"}", "application/json");
            return;
        }

        // Use largest face
        auto best = *std::max_element(faces.begin(), faces.end(),
            [](auto& a, auto& b){ return a.area() < b.area(); });
        best &= cv::Rect(0, 0, frame.cols, frame.rows);

        std::cerr << "[ENROLL] Best face: " << best << "\n";

        auto emb = recognizer_.extractEmbedding(frame(best));
        std::cerr << "[ENROLL] Embedding size: " << emb.size() << "\n";

        recognizer_.enrollUser(uid, emb);

        if (mongo_) {
            EmbeddingDoc d;
            d.userId       = uid;
            d.embedding    = emb;
            d.modelVersion = "v1";
            mongo_->saveEmbedding(d);
            std::cerr << "[ENROLL] Saved to MongoDB\n";
        }

        res.set_content(
            "{\"success\":true,\"userId\":\"" + uid + "\",\"embeddingSize\":" +
            std::to_string(emb.size()) + "}",
            "application/json");

    } catch (const std::exception& e) {
        std::cerr << "[ERROR] enroll exception: " << e.what() << "\n";
        res.status = 500;
        res.set_content(std::string("{\"error\":\"") + e.what() + "\"}", "application/json");
    } catch (...) {
        std::cerr << "[ERROR] enroll unknown exception\n";
        res.status = 500;
        res.set_content("{\"error\":\"internal server error\"}", "application/json");
    }
}

void CenturionServer::handleLogs(const httplib::Request& req, httplib::Response& res){
    setCORSHeaders(res);
    try {
        auto lim = req.get_param_value("limit");
        res.set_content(logger_.getRecentEventsJSON(lim.empty() ? 50 : std::stoi(lim)), "application/json");
    } catch (...) {
        res.set_content("[]", "application/json");
    }
}

void CenturionServer::handleIoT(const httplib::Request&, httplib::Response& res){
    setCORSHeaders(res);
    try {
        res.set_content(iot_.getStatusJSON(), "application/json");
    } catch (...) {
        res.set_content("{\"greenLED\":false,\"redLED\":false,\"buzzer\":false,\"doorUnlocked\":false,\"message\":\"Idle\"}", "application/json");
    }
}

void CenturionServer::handleAnalytics(const httplib::Request&, httplib::Response& res){
    setCORSHeaders(res);
    try {
        res.set_content(logger_.getAnalyticsSummaryJSON(), "application/json");
    } catch (...) {
        res.set_content("{\"totalAttempts\":0,\"authorized\":0,\"unauthorized\":0}", "application/json");
    }
}

void CenturionServer::run(){
    svr_.Options(".*", [this](const httplib::Request&, httplib::Response& res){
        setCORSHeaders(res); res.status = 204;
    });
    svr_.Post("/api/identify",   [this](auto& q, auto& r){ handleIdentify(q, r); });
    svr_.Post("/api/enroll",     [this](auto& q, auto& r){ handleEnroll(q, r); });
    svr_.Get ("/api/logs",       [this](auto& q, auto& r){ handleLogs(q, r); });
    svr_.Get ("/api/iot/status", [this](auto& q, auto& r){ handleIoT(q, r); });
    svr_.Get ("/api/analytics",  [this](auto& q, auto& r){ handleAnalytics(q, r); });
    svr_.Get ("/health",         [](const httplib::Request&, httplib::Response& res){
        res.set_content("{\"status\":\"ok\",\"service\":\"centurion-backend\"}", "application/json");
    });
    std::cout << "[CENTURION] Server on http://0.0.0.0:" << port_ << "\n";
    svr_.listen("0.0.0.0", port_);
}

void CenturionServer::stop(){ svr_.stop(); }
