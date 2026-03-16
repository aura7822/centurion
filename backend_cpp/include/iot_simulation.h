#pragma once
#include <string>
#include <functional>

enum class IoTEvent { AUTHORIZED, UNAUTHORIZED, ALERT };

struct IoTStatus {
    bool   greenLED;
    bool   redLED;
    bool   buzzer;
    bool   doorUnlocked;
    std::string message;
};

class IoTController {
public:
    IoTController();

    // Trigger IoT response based on auth result
    IoTStatus trigger(IoTEvent event, const std::string& userId = "");

    // Get current status as JSON
    std::string getStatusJSON();

    // Optional: real GPIO via WiringPi/pigpio (Raspberry Pi)
    void setGPIOMode(bool enabled, int greenPin = 17, int redPin = 27, int buzzerPin = 22);

private:
    bool gpioEnabled_  = false;
    int  greenPin_     = 17;
    int  redPin_       = 27;
    int  buzzerPin_    = 22;
    IoTStatus currentStatus_;

    void setGPIO(int pin, bool high);
    void unlockDoor(int durationMs = 3000);
    void soundBuzzer(int pulses = 3);
};
