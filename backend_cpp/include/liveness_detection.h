#pragma once
/**
 * Liveness Detection
 * Uses Eye-Aspect-Ratio (EAR) for blink detection and a passive
 * anti-spoofing ONNX model (e.g. Silent-Face-Anti-Spoofing).
 */
#include <opencv2/opencv.hpp>
#include <opencv2/dnn.hpp>
#include <deque>
#include <string>

struct LivenessResult {
    bool  isLive;
    float score;        // 0.0 = spoof, 1.0 = real
    bool  blinkDetected;
};

class LivenessDetector {
public:
    LivenessDetector();

    // Load optional deep anti-spoofing model
    bool loadModel(const std::string& modelPath);

    // Main entry: runs both passive model + EAR blink check
    LivenessResult check(const cv::Mat& faceROI,
                         const std::vector<cv::Point2f>& landmarks68 = {});

private:
    cv::dnn::Net    antiSpoofNet_;
    bool            modelLoaded_ = false;

    // EAR (Eye Aspect Ratio) blink detection
    std::deque<float> earHistory_;        // rolling window
    static constexpr float EAR_THRESHOLD = 0.21f;
    static constexpr int   EAR_CONSEC    = 2;   // consecutive frames below threshold

    float computeEAR(const std::vector<cv::Point2f>& eyeLandmarks);
    bool  detectBlink(float ear);

    cv::Mat preprocessAntiSpoof(const cv::Mat& face);
};
