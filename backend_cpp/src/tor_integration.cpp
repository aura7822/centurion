/*#include "tor_integration.h"
#include <iostream>
#include <fstream>
#include <thread>
#include <chrono>
#include <cstdlib>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>*/
#include "tor_control.h"
/*
TorController& getTorController(){
    static TorController inst("127.0.0.1",9051);
    return inst;
}

bool isTorRunning(){
    int s=socket(AF_INET,SOCK_STREAM,0); if(s<0) return false;
    struct timeval tv{2,0};
    setsockopt(s,SOL_SOCKET,SO_RCVTIMEO,&tv,sizeof(tv));
    setsockopt(s,SOL_SOCKET,SO_SNDTIMEO,&tv,sizeof(tv));
    struct sockaddr_in a{}; a.sin_family=AF_INET; a.sin_port=htons(9050);
    inet_pton(AF_INET,"127.0.0.1",&a.sin_addr);
    bool ok=(connect(s,(struct sockaddr*)&a,sizeof(a))==0);
    close(s); return ok;
}

bool startTorDaemon(const std::string&){
    if(isTorRunning()){std::cout<<"[Tor] Already running\n";return true;}
    std::cout<<"[Tor] Starting...\n";
    std::system("systemctl start tor 2>/dev/null || tor --RunAsDaemon 1 --quiet 2>/dev/null &");
    for(int i=0;i<10;++i){
        std::this_thread::sleep_for(std::chrono::seconds(1));
        if(isTorRunning()){std::cout<<"[Tor] Started\n";return true;}
    }
    std::cerr<<"[Tor] Failed. Try: sudo dnf install tor && sudo systemctl start tor\n";
    return false;
}

std::string waitForOnionAddress(const std::string& dir,int retries){
    for(int i=0;i<retries;++i){
        std::ifstream f(dir+"hostname");
        if(f.is_open()){std::string a;std::getline(f,a);if(!a.empty()){std::cout<<"[Tor] .onion: "<<a<<"\n";return a;}}
        std::this_thread::sleep_for(std::chrono::seconds(1));
    }
    return "";
}

void printTorStatus(){
    TorController& c=getTorController();
    std::cout<<"[Tor] SOCKS5: "<<c.getSOCKSProxy()
             <<" | Running: "<<(isTorRunning()?"YES":"NO")
             <<" | .onion: "<<(c.getOnionAddress().empty()?"(pending)":c.getOnionAddress())<<"\n";
}
*/
