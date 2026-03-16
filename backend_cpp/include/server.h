#pragma once
#include "httplib.h"
#include "face_recognition.h"
#include "demographics_estimator.h"
#include "liveness_detection.h"
#include "logging.h"
#include "iot_simulation.h"
#include "mongo_manager.h"
#include <string>
#include <mutex>
#include <map>
#include <memory>

class CenturionServer {
public:
    CenturionServer(int port,
                    FaceRecognizer&        recognizer,
                    DemographicsEstimator& demographics,
                    LivenessDetector&      liveness,
                    Logger&                logger,
                    IoTController&         iot,
                    std::shared_ptr<MongoManager> mongo = nullptr);
    void run();
    void stop();
private:
    int                           port_;
    httplib::Server               svr_;
    FaceRecognizer&               recognizer_;
    DemographicsEstimator&        demographics_;
    LivenessDetector&             liveness_;
    Logger&                       logger_;
    IoTController&                iot_;
    std::shared_ptr<MongoManager> mongo_;
    std::mutex                    failureMutex_;
    std::map<std::string,int>     failureCount_;
    void handleIdentify (const httplib::Request&, httplib::Response&);
    void handleEnroll   (const httplib::Request&, httplib::Response&);
    void handleLogs     (const httplib::Request&, httplib::Response&);
    void handleIoT      (const httplib::Request&, httplib::Response&);
    void handleAnalytics(const httplib::Request&, httplib::Response&);
    cv::Mat base64ToMat(const std::string&);
    void    setCORSHeaders(httplib::Response&);
};
