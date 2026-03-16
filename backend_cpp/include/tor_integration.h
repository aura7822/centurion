#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>

#pragma once
/**
 * Tor Integration
 * - Sends NEWNYM signal for identity rotation
 * - Configures SOCKS5 proxy for outbound threat intel calls
 * - Reads .onion address from hidden service directory
 */
#include <string>
#include <netinet/in.h>
#include <sys/socket.h>
#include <unistd.h>
#include <cstring>
#include <iostream>
#include <fstream>

class TorController {
public:
    TorController(const std::string& controlHost = "127.0.0.1",
                  int controlPort = 9051)
        : host_(controlHost), port_(controlPort) {}

    // Send NEWNYM for fresh circuit (identity rotation)
    bool rotateIdentity() {
        return sendControlCommand("SIGNAL NEWNYM\r\n");
    }

    // Read .onion address from hidden service directory
    std::string getOnionAddress(const std::string& hsDir = "/var/lib/tor/centurion/") {
        std::ifstream f(hsDir + "hostname");
        if (!f.is_open()) return "";
        std::string addr;
        std::getline(f, addr);
        return addr;
    }

    // Proxy config string for curl/httplib outbound calls
    // usage: curl_easy_setopt(curl, CURLOPT_PROXY, getSOCKSProxy().c_str());
    std::string getSOCKSProxy() const {
        return "socks5h://127.0.0.1:9050";
    }

private:
    std::string host_;
    int         port_;

    bool sendControlCommand(const std::string& cmd) {
        int sock = socket(AF_INET, SOCK_STREAM, 0);
        if (sock < 0) { std::cerr << "[Tor] Socket error\n"; return false; }

        struct sockaddr_in addr{};
        addr.sin_family = AF_INET;
        addr.sin_port   = htons(port_);
        inet_pton(AF_INET, host_.c_str(), &addr.sin_addr);

        if (connect(sock, (struct sockaddr*)&addr, sizeof(addr)) < 0) {
            std::cerr << "[Tor] Cannot connect to ControlPort " << host_ << ":" << port_ << "\n";
            close(sock); return false;
        }

        // Authenticate (cookie-based; read auth cookie file)
        std::ifstream cookie("/var/lib/tor/control_auth_cookie", std::ios::binary);
        if (cookie.is_open()) {
            std::string authBytes((std::istreambuf_iterator<char>(cookie)),
                                   std::istreambuf_iterator<char>());
            std::string authCmd = "AUTHENTICATE \"" + hexEncode(authBytes) + "\"\r\n";
            send(sock, authCmd.c_str(), authCmd.size(), 0);
            char buf[256] = {};
            recv(sock, buf, sizeof(buf) - 1, 0); // expect "250 OK"
        }

        send(sock, cmd.c_str(), cmd.size(), 0);
        char buf[256] = {};
        recv(sock, buf, sizeof(buf) - 1, 0);
        close(sock);

        return strncmp(buf, "250", 3) == 0;
    }

    static std::string hexEncode(const std::string& s) {
        static const char* hex = "0123456789abcdef";
        std::string out;
        for (unsigned char c : s) {
            out += hex[c >> 4];
            out += hex[c & 0xf];
        }
        return out;
    }
};
