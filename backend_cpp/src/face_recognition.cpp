#include "face_recognition.h"
#include <numeric>
#include <cmath>
#include <fstream>
#include <sstream>
#include <iostream>

FaceRecognizer::FaceRecognizer() {
    const std::vector<std::string> paths = {
        "/usr/share/opencv4/haarcascades/haarcascade_frontalface_default.xml",
        "/usr/share/opencv/haarcascades/haarcascade_frontalface_default.xml",
        "/usr/local/share/opencv4/haarcascades/haarcascade_frontalface_default.xml",
        "models/haarcascade_frontalface_default.xml",
        "haarcascade_frontalface_default.xml"
    };
    for (const auto& p : paths) {
        if (faceCascade_.load(p)) {
            std::cout << "[FaceRecognizer] Cascade: " << p << "\n";
            return;
        }
    }
    std::cerr << "[FaceRecognizer] WARNING: cascade not found, DNN-only\n";
}

bool FaceRecognizer::loadModel(const std::string& path) {
    try {
        net_ = cv::dnn::readNetFromONNX(path);
        try {
            net_.setPreferableBackend(cv::dnn::DNN_BACKEND_OPENCV);
            net_.setPreferableTarget(cv::dnn::DNN_TARGET_CPU);
            std::cout << "[FaceRecognizer] GPU mode: " << path << "\n";
        } catch (...) {
            net_.setPreferableBackend(cv::dnn::DNN_BACKEND_OPENCV);
            net_.setPreferableTarget(cv::dnn::DNN_TARGET_CPU);
            std::cout << "[FaceRecognizer] CPU mode: " << path << "\n";
        }
        return true;
    } catch (const cv::Exception& e) {
        std::cerr << "[FaceRecognizer] Load error: " << e.what() << "\n";
        return false;
    }
}

std::vector<cv::Rect> FaceRecognizer::detectFaces(const cv::Mat& frame) {
    std::vector<cv::Rect> faces;
    if (frame.empty()) return faces;
    cv::Mat gray;
    cv::cvtColor(frame, gray, cv::COLOR_BGR2GRAY);
    cv::equalizeHist(gray, gray);
    if (!faceCascade_.empty())
        faceCascade_.detectMultiScale(gray, faces, 1.1, 4, 0, cv::Size(60,60));
    return faces;
}

cv::Mat FaceRecognizer::preprocessFace(const cv::Mat& face) {
    cv::Mat r, f, n;
    cv::resize(face, r, cv::Size(112,112));
    r.convertTo(f, CV_32F, 1.0/255.0);
    cv::subtract(f, cv::Scalar(0.5,0.5,0.5), n);
    cv::divide(n, cv::Scalar(0.5,0.5,0.5), n);
    return n;
}

std::vector<float> FaceRecognizer::extractEmbedding(const cv::Mat& roi) {
    if (net_.empty()) return std::vector<float>(512, 0.0f);
    cv::Mat blob = cv::dnn::blobFromImage(preprocessFace(roi), 1.0/128.0, cv::Size(112,112), cv::Scalar(127.5,127.5,127.5), true, false);
    net_.setInput(blob);
    cv::Mat out = net_.forward();
    std::vector<float> emb(out.begin<float>(), out.end<float>());
    float norm = 0.0f;
    for (float v : emb) norm += v*v;
    norm = std::sqrt(norm);
    if (norm > 1e-10f) for (float& v : emb) v /= norm;
    return emb;
}

float FaceRecognizer::cosineSimilarity(const std::vector<float>& a,
                                        const std::vector<float>& b) {
    if (a.empty() || a.size()!=b.size()) return 0.0f;
    float dot=0,nA=0,nB=0;
    for (size_t i=0;i<a.size();++i){dot+=a[i]*b[i];nA+=a[i]*a[i];nB+=b[i]*b[i];}
    return (nA<1e-10f||nB<1e-10f)?0.0f:dot/(std::sqrt(nA)*std::sqrt(nB));
}

void FaceRecognizer::enrollUser(const std::string& uid, const std::vector<float>& emb) {
    enrolledUsers_[uid] = emb;
    std::cout << "[FaceRecognizer] Enrolled: " << uid << "\n";
}

void FaceRecognizer::loadEnrolledUsers(const std::string& path) {
    std::ifstream f(path); if (!f.is_open()) return;
    std::string line;
    while (std::getline(f, line)) {
        std::istringstream ss(line); std::string tok, uid;
        std::getline(ss, uid, ',');
        std::vector<float> emb;
        while (std::getline(ss, tok, ','))
            try { emb.push_back(std::stof(tok)); } catch (...) {}
        if (!emb.empty()) enrolledUsers_[uid] = emb;
    }
    std::cout << "[FaceRecognizer] Loaded " << enrolledUsers_.size() << " users\n";
}

FaceResult FaceRecognizer::identify(const cv::Mat& frame) {
    FaceResult res{false,"UNKNOWN",0.0f,{},{}};
    if (frame.empty()) return res;
    auto faces = detectFaces(frame);
    if (faces.empty()) return res;
    auto best = *std::max_element(faces.begin(),faces.end(),
        [](const cv::Rect&a,const cv::Rect&b){return a.area()<b.area();});
    best &= cv::Rect(0,0,frame.cols,frame.rows);
    auto emb = extractEmbedding(frame(best));
    res.embedding=emb; res.boundingBox=best;
    float topScore=0; std::string topId;
    for (const auto&[uid,e]:enrolledUsers_){
        float s=cosineSimilarity(emb,e);
        if(s>topScore){topScore=s;topId=uid;}
    }
    if (topScore>=threshold_){res.identified=true;res.userId=topId;res.confidence=topScore;}
    return res;
}
