#include "image_utils.h"
#include <opencv2/imgproc.hpp>
#include <filesystem>
#include <fstream>
#include <sstream>
#include <iostream>
#include <cmath>

namespace fs = std::filesystem;

// ── Internal base64 table ────────────────────────────────────────────────────
namespace {
    static const std::string B64_CHARS =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    std::string rawBase64Encode(const unsigned char* data, size_t len) {
        std::string out;
        out.reserve(((len + 2) / 3) * 4);
        for (size_t i = 0; i < len; i += 3) {
            uint32_t b = (data[i] << 16);
            if (i + 1 < len) b |= (data[i+1] << 8);
            if (i + 2 < len) b |= data[i+2];
            out += B64_CHARS[(b >> 18) & 0x3F];
            out += B64_CHARS[(b >> 12) & 0x3F];
            out += (i + 1 < len) ? B64_CHARS[(b >> 6) & 0x3F] : '=';
            out += (i + 2 < len) ? B64_CHARS[b & 0x3F]        : '=';
        }
        return out;
    }

    std::vector<uint8_t> rawBase64Decode(const std::string& s) {
        std::vector<uint8_t> out;
        int val = 0, valb = -8;
        for (unsigned char c : s) {
            if (c == '=') break;
            auto pos = B64_CHARS.find(c);
            if (pos == std::string::npos) continue;
            val  = (val << 6) + static_cast<int>(pos);
            valb += 6;
            if (valb >= 0) {
                out.push_back(static_cast<uint8_t>((val >> valb) & 0xFF));
                valb -= 8;
            }
        }
        return out;
    }
} // namespace

namespace ImageUtils {

// ── Preprocessing ────────────────────────────────────────────────────────────

cv::Mat letterboxResize(const cv::Mat& src, int targetW, int targetH,
                        cv::Scalar padColor) {
    if (src.empty()) return {};
    float scaleW = static_cast<float>(targetW) / src.cols;
    float scaleH = static_cast<float>(targetH) / src.rows;
    float scale  = std::min(scaleW, scaleH);

    int newW = static_cast<int>(src.cols * scale);
    int newH = static_cast<int>(src.rows * scale);

    cv::Mat resized;
    cv::resize(src, resized, cv::Size(newW, newH), 0, 0, cv::INTER_LINEAR);

    cv::Mat canvas(targetH, targetW, src.type(), padColor);
    int top  = (targetH - newH) / 2;
    int left = (targetW - newW) / 2;
    resized.copyTo(canvas(cv::Rect(left, top, newW, newH)));
    return canvas;
}

cv::Mat alignFace(const cv::Mat& frame,
                  const cv::Point2f& leftEye,
                  const cv::Point2f& rightEye,
                  int outputSize) {
    // Compute rotation angle from eye line
    float dx    = rightEye.x - leftEye.x;
    float dy    = rightEye.y - leftEye.y;
    float angle = std::atan2(dy, dx) * 180.0f / CV_PI;

    cv::Point2f center((leftEye.x + rightEye.x) / 2.0f,
                        (leftEye.y + rightEye.y) / 2.0f);

    cv::Mat rotMat = cv::getRotationMatrix2D(center, angle, 1.0);
    cv::Mat aligned;
    cv::warpAffine(frame, aligned, rotMat, frame.size(),
                   cv::INTER_LINEAR, cv::BORDER_REPLICATE);

    // Crop square around face center
    float eyeDist = std::sqrt(dx*dx + dy*dy);
    int   side    = static_cast<int>(eyeDist * 3.0f);
    side = std::min(side, std::min(frame.cols, frame.rows));

    int x = std::max(0, static_cast<int>(center.x) - side / 2);
    int y = std::max(0, static_cast<int>(center.y) - side / 2);
    x = std::min(x, aligned.cols - side);
    y = std::min(y, aligned.rows - side);

    cv::Mat cropped = aligned(cv::Rect(x, y, side, side));
    cv::resize(cropped, cropped, cv::Size(outputSize, outputSize));
    return cropped;
}

cv::Mat enhanceLowLight(const cv::Mat& bgr) {
    cv::Mat lab;
    cv::cvtColor(bgr, lab, cv::COLOR_BGR2Lab);

    std::vector<cv::Mat> channels;
    cv::split(lab, channels);

    // Apply CLAHE to L channel
    auto clahe = cv::createCLAHE(2.0, cv::Size(8, 8));
    clahe->apply(channels[0], channels[0]);

    cv::merge(channels, lab);
    cv::Mat result;
    cv::cvtColor(lab, result, cv::COLOR_Lab2BGR);
    return result;
}

cv::Mat gammaCorrect(const cv::Mat& src, double gamma) {
    cv::Mat lut(1, 256, CV_8U);
    auto* p = lut.ptr();
    for (int i = 0; i < 256; ++i) {
        p[i] = static_cast<uchar>(
            std::pow(static_cast<double>(i) / 255.0, gamma) * 255.0);
    }
    cv::Mat result;
    cv::LUT(src, lut, result);
    return result;
}

cv::Mat toFloatTensor(const cv::Mat& bgr) {
    cv::Mat f;
    bgr.convertTo(f, CV_32F, 1.0 / 255.0);
    return f;
}

// ── Annotation ────────────────────────────────────────────────────────────────

void drawFaceBox(cv::Mat& frame, const cv::Rect& box,
                 const std::string& label, bool authorized, float confidence) {
    cv::Scalar color = authorized
        ? cv::Scalar(0, 255, 0)    // green
        : cv::Scalar(0, 0, 255);   // red

    // Thick bounding box
    cv::rectangle(frame, box, color, 2);

    // Build label text
    std::string text = label;
    if (confidence >= 0.0f) {
        std::ostringstream ss;
        ss << label << " (" << static_cast<int>(confidence * 100) << "%)";
        text = ss.str();
    }

    // Label background
    int baseline = 0;
    cv::Size textSize = cv::getTextSize(text, cv::FONT_HERSHEY_SIMPLEX,
                                        0.5, 1, &baseline);
    cv::Rect labelBox(box.x, box.y - textSize.height - 8,
                      textSize.width + 4, textSize.height + 8);
    labelBox &= cv::Rect(0, 0, frame.cols, frame.rows); // clamp
    cv::rectangle(frame, labelBox, color, cv::FILLED);
    cv::putText(frame, text,
                cv::Point(box.x + 2, box.y - 4),
                cv::FONT_HERSHEY_SIMPLEX, 0.5,
                cv::Scalar(255, 255, 255), 1);
}

void drawDemographics(cv::Mat& frame, const cv::Rect& box,
                      int age, const std::string& gender,
                      const std::string& ethnicity) {
    std::ostringstream ss;
    ss << gender << " ~" << age << "y  " << ethnicity;
    cv::putText(frame, ss.str(),
                cv::Point(box.x, box.y + box.height + 16),
                cv::FONT_HERSHEY_SIMPLEX, 0.45,
                cv::Scalar(200, 200, 50), 1);
}

// ── Base64 ───────────────────────────────────────────────────────────────────

std::string matToBase64(const cv::Mat& img, int quality) {
    std::vector<uchar> buf;
    cv::imencode(".jpg", img, buf, {cv::IMWRITE_JPEG_QUALITY, quality});
    return "data:image/jpeg;base64," +
           rawBase64Encode(buf.data(), buf.size());
}

cv::Mat base64ToMat(const std::string& b64) {
    std::string data = b64;
    auto comma = data.find(',');
    if (comma != std::string::npos) data = data.substr(comma + 1);

    auto decoded = rawBase64Decode(data);
    if (decoded.empty()) return {};
    return cv::imdecode(decoded, cv::IMREAD_COLOR);
}

// ── Snapshot ──────────────────────────────────────────────────────────────────

std::string saveSnapshot(const cv::Mat& frame,
                         const std::string& eventId,
                         const std::string& dir) {
    if (frame.empty()) return "";
    try {
        fs::create_directories(dir);
        std::string path = dir + eventId + ".jpg";
        cv::imwrite(path, frame, {cv::IMWRITE_JPEG_QUALITY, 85});
        return path;
    } catch (const std::exception& e) {
        std::cerr << "[ImageUtils] saveSnapshot error: " << e.what() << "\n";
        return "";
    }
}

cv::Mat blurRegion(const cv::Mat& frame, const cv::Rect& roi, int strength) {
    cv::Mat result = frame.clone();
    cv::Rect safe  = roi & cv::Rect(0, 0, frame.cols, frame.rows);
    if (safe.empty()) return result;

    cv::Mat region = result(safe);
    int k = (strength % 2 == 0) ? strength + 1 : strength;
    cv::GaussianBlur(region, region, cv::Size(k, k), 0);
    return result;
}

// ── Validation ────────────────────────────────────────────────────────────────

bool isValidFrame(const cv::Mat& frame, int minWidth, int minHeight) {
    return !frame.empty()
        && frame.cols >= minWidth
        && frame.rows >= minHeight
        && (frame.channels() == 3 || frame.channels() == 1);
}

double sharpnessScore(const cv::Mat& gray) {
    cv::Mat lap;
    cv::Laplacian(gray, lap, CV_64F);
    cv::Scalar mean, stddev;
    cv::meanStdDev(lap, mean, stddev);
    return stddev[0] * stddev[0]; // variance of Laplacian
}

double brightnessScore(const cv::Mat& bgr) {
    cv::Mat gray;
    cv::cvtColor(bgr, gray, cv::COLOR_BGR2GRAY);
    return cv::mean(gray)[0];
}

} // namespace ImageUtils
