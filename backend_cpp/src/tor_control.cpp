
#include "tor_control.h"
#include <iostream>
#include <cstdlib>
#include <string>
#include <unistd.h>
#include <signal.h>
#include <sys/wait.h>
#include <fstream>
#include <regex>

namespace TorControl {

bool isTorRunning() {
    // Check if Tor process is running
    FILE* pipe = popen("pgrep -x tor 2>/dev/null", "r");
    if (!pipe) return false;

    char buffer[128];
    std::string result = "";
    while (fgets(buffer, sizeof(buffer), pipe) != nullptr) {
        result += buffer;
    }
    int status = pclose(pipe);

    // If pgrep found a process, it returns 0
    if (!result.empty() && WIFEXITED(status) && WEXITSTATUS(status) == 0) {
        return true;
    }

    // Check if Tor SOCKS port is listening
    pipe = popen("netstat -tln 2>/dev/null | grep -q ':9050 '", "r");
    if (pipe) {
        status = pclose(pipe);
        if (WIFEXITED(status) && WEXITSTATUS(status) == 0) {
            return true;
        }
    }

    return false;
}

bool startTorDaemon() {
    if (isTorRunning()) {
        std::cout << "Tor is already running." << std::endl;
        return true;
    }

    std::cout << "Attempting to start Tor daemon..." << std::endl;

    // Try systemctl first
    int result = system("systemctl start tor 2>/dev/null");
    if (result == 0) {
        sleep(2);
        if (isTorRunning()) {
            std::cout << "Tor started via systemctl." << std::endl;
            return true;
        }
    }

    // Try service command
    result = system("service tor start 2>/dev/null");
    if (result == 0) {
        sleep(2);
        if (isTorRunning()) {
            std::cout << "Tor started via service command." << std::endl;
            return true;
        }
    }

    // Try launching as daemon
    pid_t pid = fork();

    if (pid == 0) {
        // Child process
        setsid();

        close(STDIN_FILENO);
        close(STDOUT_FILENO);
        close(STDERR_FILENO);

        const char* tor_paths[] = {
            "/usr/bin/tor",
            "/usr/sbin/tor",
            "/bin/tor",
            "/sbin/tor",
            "/usr/local/bin/tor",
            nullptr
        };

        for (int i = 0; tor_paths[i] != nullptr; i++) {
            execl(tor_paths[i], "tor", "--runasdaemon", "1", nullptr);
        }
        exit(1);
    } else if (pid > 0) {
        int status;
        waitpid(pid, &status, 0);
        sleep(3);

        if (isTorRunning()) {
            std::cout << "Tor started as daemon." << std::endl;
            return true;
        }
    }

    std::cerr << "Failed to start Tor daemon." << std::endl;
    return false;
}

bool stopTorDaemon() {
    if (!isTorRunning()) {
        std::cout << "Tor is not running." << std::endl;
        return true;
    }

    std::cout << "Stopping Tor daemon..." << std::endl;

    int result = system("systemctl stop tor 2>/dev/null");
    if (result == 0) {
        sleep(1);
        if (!isTorRunning()) return true;
    }

    result = system("pkill -x tor 2>/dev/null");
    sleep(1);

    return !isTorRunning();
}

void printTorStatus() {
    std::cout << "\n=== Tor Status ===\n";

    if (isTorRunning()) {
        std::cout << "✓ Tor daemon: RUNNING\n";

        FILE* pipe = popen("netstat -tln 2>/dev/null | grep 9050", "r");
        if (pipe) {
            char buffer[256];
            if (fgets(buffer, sizeof(buffer), pipe) != nullptr) {
                std::cout << "✓ SOCKS proxy: Listening on port 9050\n";
            } else {
                std::cout << "⚠ SOCKS proxy: Not listening on port 9050\n";
            }
            pclose(pipe);
        }
    } else {
        std::cout << "✗ Tor daemon: NOT RUNNING\n";
    }

    std::cout << "==================\n";
}

std::string getTorSocksProxy() {
    if (isTorRunning()) {
        return "socks5h://127.0.0.1:9050";
    }
    return "";
}

bool testTorConnection() {
    if (!isTorRunning()) return false;

    FILE* pipe = popen("curl --socks5-hostname 127.0.0.1:9050 --max-time 5 https://check.torproject.org/api/ip 2>/dev/null | grep -q '\"IsTor\":true'", "r");
    if (pipe) {
        int status = pclose(pipe);
        return (WIFEXITED(status) && WEXITSTATUS(status) == 0);
    }
    return false;
}

std::string getTorIP() {
    if (!isTorRunning()) return "";

    FILE* pipe = popen("curl --socks5-hostname 127.0.0.1:9050 --max-time 5 https://check.torproject.org/api/ip 2>/dev/null | grep -o '\"IP\":\"[^\"]*\"' | cut -d'\"' -f4", "r");
    if (pipe) {
        char buffer[64];
        if (fgets(buffer, sizeof(buffer), pipe) != nullptr) {
            std::string ip(buffer);
            ip.erase(ip.find_last_not_of(" \n\r\t") + 1);
            pclose(pipe);
            return ip;
        }
        pclose(pipe);
    }
    return "";
}

} // namespace TorControl
