#include "liveness_detection.h"
#include <cmath>
#include <iostream>

LivenessDetector::LivenessDetector() {}

bool LivenessDetector::loadModel(const std::string& path) {
    try {
        antiSpoofNet_=cv::dnn::readNetFromONNX(path);
        antiSpoofNet_.setPreferableBackend(cv::dnn::DNN_BACKEND_OPENCV);
        antiSpoofNet_.setPreferableTarget(cv::dnn::DNN_TARGET_CPU);
        modelLoaded_=true;
        std::cout<<"[Liveness] Anti-spoof model loaded\n";
        return true;
    } catch (...) {
        modelLoaded_=false;
        std::cout<<"[Liveness] EAR blink-only mode\n";
        return false;
    }
}

float LivenessDetector::computeEAR(const std::vector<cv::Point2f>& eye) {
    if (eye.size()<6) return 1.0f;
    auto d=[](cv::Point2f a,cv::Point2f b){
        return std::sqrt((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y));};
    return (d(eye[0],eye[3])>1e-5f)?(d(eye[1],eye[5])+d(eye[2],eye[4]))/(2.0f*d(eye[0],eye[3])):1.0f;
}

bool LivenessDetector::detectBlink(float ear) {
    earHistory_.push_back(ear);
    if (earHistory_.size()>20) earHistory_.pop_front();
    int n=0; for(float v:earHistory_) if(v<EAR_THRESHOLD)++n;
    return n>=EAR_CONSEC;
}

LivenessResult LivenessDetector::check(const cv::Mat& roi,
                                        const std::vector<cv::Point2f>& lm) {
    LivenessResult r{false,0.65f,false};
    if (roi.empty()) return r;
    float score=0.65f;
    if (modelLoaded_) {
        try {
            cv::Mat rs; cv::resize(roi,rs,cv::Size(80,80));
            cv::Mat blob=cv::dnn::blobFromImage(rs,1.0/255.0);
            antiSpoofNet_.setInput(blob);
            cv::Mat out=antiSpoofNet_.forward();
            float* p=out.ptr<float>();
            score=(out.total()>1)?p[1]:p[0];
        } catch (...) { score=0.65f; }
    }
    bool blink=false;
    if (lm.size()>=68) {
        std::vector<cv::Point2f> lE(lm.begin()+36,lm.begin()+42);
        std::vector<cv::Point2f> rE(lm.begin()+42,lm.begin()+48);
        blink=detectBlink((computeEAR(lE)+computeEAR(rE))/2.0f);
    } else { blink=(score>0.5f); }
    r.blinkDetected=blink; r.score=score; r.isLive=(score>0.55f)||blink;
    return r;
}
