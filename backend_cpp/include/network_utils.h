#ifndef NETWORK_UTILS_H
#define NETWORK_UTILS_H

#include <string>
#include <thread>
#include <atomic>
#include <functional>

namespace NetworkUtils {
    
    class HTTPServer {
    private:
        int serverSocket;
        int serverPort;
        std::atomic<bool> running;
        void handleClient(int clientSocket);
        std::string handleFaceRecognition(const std::string& body);
        
    public:
        HTTPServer(int port = 8080);
        ~HTTPServer();
        
        void start();
        void stop();
    };
    
    class TorProxy {
    private:
        std::string host;
        int port;
        
    public:
        TorProxy(const std::string& proxyHost = "127.0.0.1", int proxyPort = 9050);
        std::string makeRequest(const std::string& url);
        void rotateIdentity();
    };
    
}

#endif
