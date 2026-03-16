#pragma once
#include <opencv2/opencv.hpp>
#include <opencv2/dnn.hpp>
#include <vector>
#include <string>
#include <unordered_map>

struct FaceResult {
    bool        identified;
    std::string userId;
    float       confidence;       // 0.0 – 1.0
    cv::Rect    boundingBox;
    std::vector<float> embedding; // 128-d FaceNet vector
};

class FaceRecognizer {
public:
    FaceRecognizer();
    ~FaceRecognizer() = default;

    // Load ONNX FaceNet model
    bool loadModel(const std::string& modelPath);

    // Detect all faces in frame, return bounding boxes
    std::vector<cv::Rect> detectFaces(const cv::Mat& frame);

    // Extract 128-d embedding from a cropped face ROI
    std::vector<float> extractEmbedding(const cv::Mat& faceROI);

    // Register a new authorised user embedding into DB
    void enrollUser(const std::string& userId, const std::vector<float>& embedding);

    // Load all enrolled embeddings from DB/file into memory
    void loadEnrolledUsers(const std::string& embeddingsPath);

    // Compare embedding against enrolled set; returns best match
    FaceResult identify(const cv::Mat& frame);

    // Cosine similarity between two embeddings
    static float cosineSimilarity(const std::vector<float>& a,
                                  const std::vector<float>& b);

private:
    cv::dnn::Net                                          net_;
    cv::CascadeClassifier                                 faceCascade_; // Haar fallback
    std::unordered_map<std::string, std::vector<float>>   enrolledUsers_;
    float                                                 threshold_ = 0.75f;

    cv::Mat preprocessFace(const cv::Mat& face);
};
