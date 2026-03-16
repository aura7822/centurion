#ifndef CONFIG_H
#define CONFIG_H

#include <string>
#include <map>
#include <fstream>
#include <iostream>
#include <sstream>
#include <algorithm>

class Config {
private:
    std::map<std::string, std::string> values;
    static Config* instance;
    
    Config() {}
    
    std::string trim(const std::string& str) {
        size_t first = str.find_first_not_of(" \t\n\r");
        size_t last = str.find_last_not_of(" \t\n\r");
        return (first == std::string::npos) ? "" : str.substr(first, last - first + 1);
    }
    
public:
    static Config* getInstance() {
        if (!instance) instance = new Config();
        return instance;
    }
    
    bool loadFromFile(const std::string& path) {
        std::ifstream file(path);
        if (!file.is_open()) return false;
        
        std::string line;
        while (std::getline(file, line)) {
            if (line.empty() || line[0] == '#') continue;
            
            size_t delim = line.find('=');
            if (delim != std::string::npos) {
                std::string key = trim(line.substr(0, delim));
                std::string value = trim(line.substr(delim + 1));
                if (!key.empty()) values[key] = value;
            }
        }
        return true;
    }
    
    std::string get(const std::string& key, const std::string& def = "") {
        auto it = values.find(key);
        return (it != values.end()) ? it->second : def;
    }
    
    bool hasKey(const std::string& key) {
        return values.find(key) != values.end();
    }
};

Config* Config::instance = nullptr;

#endif
