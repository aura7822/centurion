#ifndef TOR_CONTROL_H
#define TOR_CONTROL_H

#include <string>

namespace TorControl {
    bool isTorRunning();
    bool startTorDaemon();
    bool stopTorDaemon();
    void printTorStatus();
    std::string getTorSocksProxy();
    bool testTorConnection();
    std::string getTorIP();
}

#endif // TOR_CONTROL_H
