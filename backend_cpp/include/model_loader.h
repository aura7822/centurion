#pragma once
/**
 * model_loader.h — Centralised ONNX/Caffe model loader for Centurion®
 * Handles: discovery, validation, GPU/CPU fallback, hot-reload
 */

#include <opencv2/dnn.hpp>
#include <string>
#include <map>
#include <vector>
#include <optional>
#include <filesystem>

namespace fs = std::filesystem;

// ── Model descriptor ─────────────────────────────────────────────────────────
struct ModelInfo {
    std::string name;           // e.g. "facenet"
    std::string path;           // full path on disk
    std::string format;         // "onnx" | "caffemodel" | "pb"
    std::string protoPath;      // .prototxt for Caffe models (optional)
    bool        requiresCUDA;
    cv::Size    inputSize;      // expected input dimensions
    int         inputChannels;
    std::string description;
};

// ── Model loader ──────────────────────────────────────────────────────────────
class ModelLoader {
public:
    explicit ModelLoader(const std::string& modelsDir = "models/");

    // Scan models/ directory and register discovered models
    void discoverModels();

    // Load a named model into memory; returns loaded net or empty
    std::optional<cv::dnn::Net> loadNet(const std::string& name);

    // Check if a model file exists on disk
    bool modelExists(const std::string& name) const;

    // Print all discovered models and their status
    void printSummary() const;

    // Reload a model from disk (hot-reload)
    std::optional<cv::dnn::Net> reloadNet(const std::string& name);

    // Returns true if CUDA backend is available and working
    static bool isCUDAAvailable();

    // Preferred backend/target based on hardware
    static std::pair<int, int> getBestBackendTarget();

    // List all registered model names
    std::vector<std::string> listModels() const;

    // Get model info
    std::optional<ModelInfo> getInfo(const std::string& name) const;

private:
    std::string modelsDir_;
    std::map<std::string, ModelInfo> registry_;

    cv::dnn::Net loadFromInfo(const ModelInfo& info);
    void registerDefaults();
};
