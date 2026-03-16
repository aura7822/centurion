
#include <iostream>
#include <string>
#include <thread>
#include <chrono>
#include <csignal>
#include <cstdlib>
#include <filesystem>

#include <opencv2/opencv.hpp>
#include <opencv2/dnn.hpp>

#include "face_recognition.h"
#include "demographics_estimator.h"
#include "liveness_detection.h"
#include "logging.h"
#include "iot_simulation.h"
#include "server.h"
#include "model_loader.h"
#include "mongo_manager.h"
#include "tor_integration.h"
#include "image_utils.h"
#include "tor_integration.h"
#include "network_utils.h"
#include "tor_control.h"

namespace fs = std::filesystem;

// ── Graceful shutdown ────────────────────────────────────────────────────────
static CenturionServer* gServer = nullptr;
void onSignal(int sig) {
    std::cout << "\n[CENTURION] Signal " << sig << " received – activating standby...\n";
    if (gServer) gServer->stop();
}

// ── Read env with default ────────────────────────────────────────────────────
static std::string env(const char* key, const std::string& def = "") {
    const char* v = std::getenv(key);
    return v ? std::string(v) : def;
}

int main(int argc, char** argv) {
    std::cout << R"(
   ██████╗███████╗███╗   ██╗████████╗██╗   ██╗██████╗ ██╗ ██████╗ ███╗   ██╗
  ██╔════╝██╔════╝████╗  ██║╚══██╔══╝██║   ██║██╔══██╗██║██╔═══██╗████╗  ██║
  ██║     █████╗  ██╔██╗ ██║   ██║   ██║   ██║██████╔╝██║██║   ██║██╔██╗ ██║
  ██║     ██╔══╝  ██║╚██╗██║   ██║   ██║   ██║██╔══██╗██║██║   ██║██║╚██╗██║
  ╚██████╗███████╗██║ ╚████║   ██║   ╚██████╔╝██║  ██║██║╚██████╔╝██║ ╚████║
   ╚═════╝╚══════╝╚═╝  ╚═══╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝
                       AI-Powered Cybersecurity Backend ...
)" << "\n";

    // ── Read configuration ─────────────────────────────────────────────────
    std::string mongoUri  = env("MONGO_URI",       "mongodb://localhost:27017");
    std::string mongoDB   = env("MONGO_DB",        "centurion");
    std::string modelsDir = env("MODEL_DIR",        "models/");
    std::string logDir    = env("LOG_DIR",          "logs/");
    std::string snapDir   = env("SNAPSHOT_DIR",     "snapshots/");
    int         port      = std::stoi(env("CENTURION_PORT", "8080"));
    bool        gpioOn    = (env("GPIO_ENABLED", "false") == "true");

    // ── Create directories ─────────────────────────────────────────────────
    for (const auto& dir : {logDir, snapDir, modelsDir}) {
        fs::create_directories(dir);
    }

    // ── MongoDB ────────────────────────────────────────────────────────────
    std::cout << "[CENTURION] Connecting to MongoDB...\n";
    auto mongo = std::make_shared<MongoManager>(mongoUri, mongoDB);
    if (!mongo->isConnected()) {
        std::cerr << "[ERROR] MongoDB connection failed. "
                     "Ensure mongod is running: sudo systemctl start mongod\n";
        return 1;
    }

    // ── Model discovery ────────────────────────────────────────────────────
    std::cout << "[CENTURION] Loading AI models from: " << modelsDir << "\n";
    ModelLoader loader(modelsDir);
    loader.printSummary();

    // ── Face Recognizer ────────────────────────────────────────────────────
    FaceRecognizer recognizer;
    // Try FaceNet first, fallback to ArcFace
    if (loader.modelExists("facenet")) {
        if (!recognizer.loadModel(modelsDir + "facenet_embedding.onnx")) {
            std::cerr << "[WARN] FaceNet load failed\n";
        }
    } else if (loader.modelExists("arcface")) {
        if (!recognizer.loadModel(modelsDir + "arcface_r100.onnx")) {
            std::cerr << "[WARN] ArcFace load failed\n";
        }
    } else {
        std::cerr << "[ERROR] No face embedding model found in " << modelsDir << "\n"
                  << "        Required: facenet_embedding.onnx or arcface_r100.onnx\n"
                  << "        Download: https://github.com/onnx/models\n";
        return 1;
    }

    // Load enrolled users from MongoDB into recognizer memory
    auto enrolledUsers = mongo->loadAllEmbeddings();
    for (const auto& [uid, emb] : enrolledUsers) {
        recognizer.enrollUser(uid, emb);
    }
    std::cout << "[CENTURION] " << enrolledUsers.size()
              << " enrolled users loaded from MongoDB\n";

    // ── Demographics ────────────────────────────────────────────────────────
    DemographicsEstimator demographics;
    bool demoLoaded = false;
    if (loader.modelExists("age_gender") && loader.modelExists("ethnicity")) {
        demoLoaded = demographics.loadModels(
            modelsDir + "age_gender_model.onnx",
            modelsDir + "ethnicity_model.onnx");
    }
    if (!demoLoaded) {
        std::cerr << "[WARN] Demographics models not found – age/gender/ethnicity "
                     "will show defaults\n";
    }

    // ── Liveness ────────────────────────────────────────────────────────────
    LivenessDetector liveness;
    if (loader.modelExists("anti_spoof")) {
        liveness.loadModel(modelsDir + "anti_spoofing_model.onnx");
    } else {
        std::cout << "[WARN] Anti-spoof model not found – EAR blink detection only\n";
    }

    // ── Logger ──────────────────────────────────────────────────────────────
    Logger logger(logDir + "centurion.log", "");  // MongoDB handles structured logs
    logger.setMongoManager(mongo);

    // ── IoT ─────────────────────────────────────────────────────────────────
    IoTController iot;
    if (gpioOn) {
        int greenPin  = std::stoi(env("GPIO_GREEN_PIN",  "17"));
        int redPin    = std::stoi(env("GPIO_RED_PIN",    "27"));
        int buzzerPin = std::stoi(env("GPIO_BUZZER_PIN", "22"));
        iot.setGPIOMode(true, greenPin, redPin, buzzerPin);
    }

    // ── Tor ─────────────────────────────────────────────────────────────────
    std::cout << "[CENTURION] Checking Tor daemon...\n";
    if (!TorControl::isTorRunning()) {
    TorControl::startTorDaemon();
}
TorControl::printTorStatus();
    // ── Signal handlers ──────────────────────────────────────────────────────
    std::signal(SIGINT,  onSignal);
    std::signal(SIGTERM, onSignal);

    // ── HTTP Server ───────────────────────────────────────────────────────────
    std::cout << "[CENTURION] Starting REST API on port " << port << "\n";
    CenturionServer server(port, recognizer, demographics, liveness, logger, iot, mongo);
    gServer = &server;
    server.run();   // blocks until stop()

    std::cout << "[CENTURION] Shutdown successfull\n";
    return 0;
}
