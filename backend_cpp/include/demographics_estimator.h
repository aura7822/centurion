#pragma once
#include <opencv2/opencv.hpp>
#include <opencv2/dnn.hpp>
#include <string>

struct Demographics {
    int         age;          // estimated age in years
    std::string gender;       // "Male" | "Female"
    float       genderConf;   // confidence 0-1
    std::string ethnicity;    // "Asian" | "Black" | "Hispanic" | "White" | "Other"
    float       ethnicityConf;
};

class DemographicsEstimator {
public:
    bool loadModels(const std::string& ageGenderModelPath,
                    const std::string& ethnicityModelPath);

    Demographics estimate(const cv::Mat& faceROI);

private:
    cv::dnn::Net ageGenderNet_;
    cv::dnn::Net ethnicityNet_;

    static const std::vector<std::string> AGE_BUCKETS;
    static const std::vector<std::string> GENDER_LABELS;
    static const std::vector<std::string> ETHNICITY_LABELS;

    cv::Mat preprocessFace(const cv::Mat& face, int targetSize = 224);
};
