#include "demographics_estimator.h"
#include <iostream>

const std::vector<std::string> DemographicsEstimator::AGE_BUCKETS    = {"(0-2)","(4-6)","(8-12)","(15-20)","(25-32)","(38-43)","(48-53)","(60-100)"};
const std::vector<std::string> DemographicsEstimator::GENDER_LABELS  = {"Male","Female"};
const std::vector<std::string> DemographicsEstimator::ETHNICITY_LABELS = {"Asian","Black","Hispanic","White","Other"};

bool DemographicsEstimator::loadModels(const std::string& agePath,
                                        const std::string& ethPath) {
    auto tryONNX = [](cv::dnn::Net& net, const std::string& p) {
        try {
            net = cv::dnn::readNetFromONNX(p);
            net.setPreferableBackend(cv::dnn::DNN_BACKEND_OPENCV);
            net.setPreferableTarget(cv::dnn::DNN_TARGET_CPU);
            return true;
        } catch (...) { return false; }
    };
    auto tryCaffe = [](cv::dnn::Net& net, const std::string& model, const std::string& proto) {
        try {
            net = cv::dnn::readNetFromCaffe(proto, model);
            net.setPreferableBackend(cv::dnn::DNN_BACKEND_OPENCV);
            net.setPreferableTarget(cv::dnn::DNN_TARGET_CPU);
            return true;
        } catch (...) { return false; }
    };

    bool ok = false;
    if (tryONNX(ageGenderNet_, agePath)) {
        ok = true; std::cout << "[Demographics] Age/gender ONNX loaded\n";
    } else if (tryCaffe(ageGenderNet_, "models/age_net.caffemodel", "models/deploy_age.prototxt")) {
        ok = true; std::cout << "[Demographics] Age/gender Caffe loaded\n";
    } else {
        std::cout << "[Demographics] WARNING: no age/gender model\n";
    }

    if (tryONNX(ethnicityNet_, ethPath))
        std::cout << "[Demographics] Ethnicity loaded\n";
    else
        std::cout << "[Demographics] Ethnicity model not available\n";

    return ok;
}

cv::Mat DemographicsEstimator::preprocessFace(const cv::Mat& face, int sz) {
    cv::Mat r, f;
    cv::resize(face, r, cv::Size(sz,sz));
    r.convertTo(f, CV_32F, 1.0/255.0);
    return f;
}

Demographics DemographicsEstimator::estimate(const cv::Mat& roi) {
    Demographics d{25,"Unknown",0.5f,"Unknown",0.0f};
    if (roi.empty() || ageGenderNet_.empty()) return d;
    try {
        cv::Mat blob = cv::dnn::blobFromImage(
            preprocessFace(roi,227), 1.0, cv::Size(227,227),
            cv::Scalar(78.4,87.7,114.9), false);
        ageGenderNet_.setInput(blob);
        std::vector<cv::Mat> outs;
        ageGenderNet_.forward(outs);
        if (!outs.empty()) {
            cv::Point loc; double val;
            cv::minMaxLoc(outs[0].reshape(1,1), nullptr, &val, nullptr, &loc);
            const int mids[]={1,5,10,17,28,40,50,70};
            d.age = (loc.x>=0&&loc.x<8) ? mids[loc.x] : 25;
        }
        if (outs.size()>=2) {
            float* p=outs[1].ptr<float>();
            int gi=(outs[1].total()>1&&p[1]>p[0])?1:0;
            d.gender=GENDER_LABELS[gi];
            d.genderConf=(outs[1].total()>1)?p[gi]:0.5f;
        }
    } catch (...) {}
    if (!ethnicityNet_.empty()) {
        try {
            cv::Mat blob=cv::dnn::blobFromImage(preprocessFace(roi,224));
            ethnicityNet_.setInput(blob);
            cv::Mat out=ethnicityNet_.forward();
            cv::Point loc; double val;
            cv::minMaxLoc(out,nullptr,&val,nullptr,&loc);
            if (loc.x>=0&&loc.x<(int)ETHNICITY_LABELS.size()) {
                d.ethnicity=ETHNICITY_LABELS[loc.x];
                d.ethnicityConf=(float)val;
            }
        } catch (...) {}
    }
    return d;
}
