#ifndef CONFIG_MANAGER_H
#define CONFIG_MANAGER_H

#include <string>
#include <map>
#include <fstream>
#include <iostream>
#include <sstream>
#include <algorithm>

class ConfigManager {
private:
    std::map<std::string, std::string> configMap;
    static ConfigManager* instance;
    
    // Private constructor for singleton
    ConfigManager() {}
    
    // Trim whitespace
    std::string trim(const std::string& str) {
        size_t first = str.find_first_not_of(" \t\n\r");
        size_t last = str.find_last_not_of(" \t\n\r");
        if (first == std::string::npos || last == std::string::npos)
            return "";
        return str.substr(first, last - first + 1);
    }
    
public:
    // Singleton pattern
    static ConfigManager* getInstance() {
        if (!instance)
            instance = new ConfigManager();
        return instance;
    }
    
    // Load configuration from .env file
    bool loadConfig(const std::string& filepath = "config/.env") {
        std::ifstream file(filepath);
        if (!file.is_open()) {
            std::cerr << "Failed to open config file: " << filepath << std::endl;
            return false;
        }
        
        std::string line;
        while (std::getline(file, line)) {
            // Skip comments and empty lines
            if (line.empty() || line[0] == '#')
                continue;
                
            size_t delimiterPos = line.find('=');
            if (delimiterPos != std::string::npos) {
                std::string key = trim(line.substr(0, delimiterPos));
                std::string value = trim(line.substr(delimiterPos + 1));
                
                // Remove quotes if present
                if (value.size() >= 2 && value.front() == '"' && value.back() == '"') {
                    value = value.substr(1, value.size() - 2);
                }
                
                configMap[key] = value;
            }
        }
        
        file.close();
        std::cout << "✓ Loaded " << configMap.size() << " configuration values" << std::endl;
        return true;
    }
    
    // Get configuration value
    std::string get(const std::string& key, const std::string& defaultValue = "") {
        auto it = configMap.find(key);
        if (it != configMap.end()) {
            return it->second;
        }
        return defaultValue;
    }
    
    // Get as integer
    int getInt(const std::string& key, int defaultValue = 0) {
        std::string val = get(key);
        if (val.empty()) return defaultValue;
        return std::stoi(val);
    }
    
    // Get as boolean
    bool getBool(const std::string& key, bool defaultValue = false) {
        std::string val = get(key);
        if (val.empty()) return defaultValue;
        std::transform(val.begin(), val.end(), val.begin(), ::tolower);
        return val == "true" || val == "1" || val == "yes";
    }
    
    // Check if key exists
    bool hasKey(const std::string& key) {
        return configMap.find(key) != configMap.end();
    }
};

ConfigManager* ConfigManager::instance = nullptr;

#endif
