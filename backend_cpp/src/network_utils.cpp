#include "../include/network_utils.h"
#include <iostream>
#include <cstring>
#include <arpa/inet.h>
#include <unistd.h>
#include <sstream>
#include <optional>  // Add this
#include <vector>    // Add this
#include <string>    // Add this
#include <nlohmann/json.hpp>  // If you're using nlohmann/json
struct HttpResponse {
    int statusCode;
    std::string body;
};

struct NewsItem {
    std::string title;
    std::string url;
    std::string source;
    std::string publishedAt;
};

struct IPIntelligence {
    std::string ip;
    std::string country;
    std::string city;
    bool isTor;
    bool isProxy;
    bool isVPN;
    double latitude;
    double longitude;
};

namespace NetworkUtils {

    HTTPServer::HTTPServer(int port) : serverPort(port), running(false) {
        serverSocket = socket(AF_INET, SOCK_STREAM, 0);
        if (serverSocket < 0) {
            std::cerr << "   Failed to create socket" << std::endl;
            return;
        }

        int opt = 1;
        setsockopt(serverSocket, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

        sockaddr_in serverAddr;
        serverAddr.sin_family = AF_INET;
        serverAddr.sin_addr.s_addr = INADDR_ANY;
        serverAddr.sin_port = htons(port);

        if (bind(serverSocket, (struct sockaddr*)&serverAddr, sizeof(serverAddr)) < 0) {
            std::cerr << "   Failed to bind to port " << port << std::endl;
            close(serverSocket);
            serverSocket = -1;
        }
    }

    HTTPServer::~HTTPServer() {
        stop();
        if (serverSocket >= 0) {
            close(serverSocket);
        }
    }

    void HTTPServer::start() {
        if (serverSocket < 0) return;

        if (listen(serverSocket, 10) < 0) {
            std::cerr << "   Failed to listen on socket" << std::endl;
            return;
        }

        running = true;
        std::cout << "   ✓ HTTP Server listening on port " << serverPort << std::endl;

        while (running) {
            sockaddr_in clientAddr;
            socklen_t clientLen = sizeof(clientAddr);
            int clientSocket = accept(serverSocket, (struct sockaddr*)&clientAddr, &clientLen);

            if (clientSocket >= 0) {
                std::string response = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{\"status\":\"running\"}";
                send(clientSocket, response.c_str(), response.length(), 0);
                close(clientSocket);
            }
        }
    }

    void HTTPServer::stop() {
        running = false;
    }

    std::string HTTPServer::handleFaceRecognition(const std::string& body) {
        return "{\"authorized\":true}";
    }

    void HTTPServer::handleClient(int clientSocket) {
        char buffer[4096] = {0};
        read(clientSocket, buffer, 4096);
    }

    TorProxy::TorProxy(const std::string& proxyHost, int proxyPort)
        : host(proxyHost), port(proxyPort) {}

    std::string TorProxy::makeRequest(const std::string& url) {
        return "";
    }

    void TorProxy::rotateIdentity() {}

} // namespace NetworkUtils
