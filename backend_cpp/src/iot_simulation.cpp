#include "iot_simulation.h"
#include <iostream>
#include <thread>
#include <chrono>
#include <sstream>
#ifdef RASPBERRY_PI
  #include <wiringPi.h>
#endif

IoTController::IoTController(){ currentStatus_={false,false,false,false,"Idle"}; }

void IoTController::setGPIOMode(bool en,int gp,int rp,int bp){
    gpioEnabled_=en; greenPin_=gp; redPin_=rp; buzzerPin_=bp;
#ifdef RASPBERRY_PI
    if(gpioEnabled_){wiringPiSetupGpio();pinMode(gp,OUTPUT);pinMode(rp,OUTPUT);pinMode(bp,OUTPUT);}
#endif
    std::cout<<"[IoT] "<<(gpioEnabled_?"GPIO":"Simulation")<<" mode\n";
}

void IoTController::setGPIO(int pin,bool high){
#ifdef RASPBERRY_PI
    if(gpioEnabled_) digitalWrite(pin,high?HIGH:LOW);
#endif
    std::cout<<"[IoT] Pin "<<pin<<"->"<<(high?"HIGH":"LOW")<<"\n";
}

void IoTController::unlockDoor(int ms){
    std::cout<<"[IoT] DOOR UNLOCKED "<<ms<<"ms\n";
    std::thread([this,ms](){
        std::this_thread::sleep_for(std::chrono::milliseconds(ms));
        currentStatus_.doorUnlocked=false; setGPIO(greenPin_,false);
        std::cout<<"[IoT] DOOR LOCKED\n";
    }).detach();
}

void IoTController::soundBuzzer(int n){
    std::thread([this,n](){
        for(int i=0;i<n;++i){
            setGPIO(buzzerPin_,true);
            std::this_thread::sleep_for(std::chrono::milliseconds(200));
            setGPIO(buzzerPin_,false);
            std::this_thread::sleep_for(std::chrono::milliseconds(200));
        }
    }).detach();
}

IoTStatus IoTController::trigger(IoTEvent ev,const std::string& uid){
    switch(ev){
        case IoTEvent::AUTHORIZED:
            currentStatus_={true,false,false,true,"GRANTED-"+uid};
            setGPIO(greenPin_,true); setGPIO(redPin_,false); unlockDoor(3000);
            std::cout<<"[IoT] GREEN | granted: "<<uid<<"\n"; break;
        case IoTEvent::UNAUTHORIZED:
            currentStatus_={false,true,true,false,"DENIED"};
            setGPIO(greenPin_,false); setGPIO(redPin_,true); soundBuzzer(3);
            std::cout<<"[IoT] RED | BUZZER | denied\n";
            std::thread([this](){
                std::this_thread::sleep_for(std::chrono::seconds(5));
                currentStatus_.redLED=false; setGPIO(redPin_,false);
            }).detach(); break;
        case IoTEvent::ALERT:
            currentStatus_={false,true,true,false,"ALERT"};
            setGPIO(redPin_,true); soundBuzzer(6);
            std::cout<<"[IoT] ALERT\n"; break;
    }
    return currentStatus_;
}

std::string IoTController::getStatusJSON(){
    std::ostringstream j;
    j<<"{\"greenLED\":"<<(currentStatus_.greenLED?"true":"false")
     <<",\"redLED\":"<<(currentStatus_.redLED?"true":"false")
     <<",\"buzzer\":"<<(currentStatus_.buzzer?"true":"false")
     <<",\"doorUnlocked\":"<<(currentStatus_.doorUnlocked?"true":"false")
     <<",\"message\":\""<<currentStatus_.message<<"\"}";
    return j.str();
}
