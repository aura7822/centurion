#ifndef IMAGE_UTILS_H
#define IMAGE_UTILS_H

#include <opencv2/opencv.hpp>
#include <string>
#include <vector>

namespace ImageUtils {
    
    cv::Mat base64ToMat(const std::string& base64Data);
    std::string matToBase64(const cv::Mat& image);
    
    cv::Mat resizeToStandard(const cv::Mat& image, int width = 224, int height = 224);
    cv::Rect detectLargestFace(const cv::Mat& image, cv::CascadeClassifier& faceCascade);
    cv::Mat extractFace(const cv::Mat& image, const cv::Rect& faceRect);
    
    std::string base64_encode(const unsigned char* data, size_t len);
    std::string base64_decode(const std::string& encoded_string);
    
    void saveSnapshot(const cv::Mat& image, const std::string& filename);
}

#endif
