cmake_minimum_required(VERSION 3.16)
project(CenturionBackend VERSION 1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

if(NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE Release)
endif()
set(CMAKE_CXX_FLAGS_RELEASE "-O3 -DNDEBUG -march=native")
set(CMAKE_CXX_FLAGS_DEBUG   "-g -O0")

# OpenCV (required) — Fedora: sudo dnf install opencv-devel
find_package(OpenCV REQUIRED COMPONENTS core dnn imgproc objdetect video imgcodecs highgui)
message(STATUS "OpenCV ${OpenCV_VERSION} found")

find_package(Threads REQUIRED)

# OpenSSL — Fedora: sudo dnf install openssl-devel
find_package(OpenSSL REQUIRED)

# CURL — Fedora: sudo dnf install libcurl-devel
find_package(CURL REQUIRED)

find_package(nlohmann_json REQUIRED)

# MongoDB C++ Driver — Fedora: sudo dnf install mongo-cxx-driver-devel
find_package(libmongocxx QUIET)
find_package(libbsoncxx  QUIET)

if(libmongocxx_FOUND AND libbsoncxx_FOUND)
    message(STATUS "MongoDB C++ driver found (cmake)")
    set(MONGO_FOUND TRUE)
else()
    find_package(PkgConfig QUIET)
    if(PkgConfig_FOUND)
        pkg_check_modules(MONGOCXX QUIET libmongocxx)
        pkg_check_modules(BSONCXX  QUIET libbsoncxx)
        if(MONGOCXX_FOUND AND BSONCXX_FOUND)
            set(MONGO_FOUND TRUE)
            message(STATUS "MongoDB C++ driver found (pkg-config)")
        endif()
    endif()
endif()

if(NOT MONGO_FOUND)
    message(FATAL_ERROR
        "MongoDB C++ driver not found!\n"
        "  Fedora: sudo dnf install mongo-cxx-driver-devel\n"
        "  Or:     https://mongocxx.org/mongocxx-v3/installation/linux/")
endif()

find_library(WIRINGPI_LIB wiringPi)
if(WIRINGPI_LIB)
    add_definitions(-DRASPBERRY_PI)
    message(STATUS "WiringPi found")
endif()

find_package(CUDA QUIET)
if(CUDA_FOUND)
    message(STATUS "CUDA ${CUDA_VERSION} found")
    add_definitions(-DWITH_CUDA)
endif()

# Sources
set(SOURCES
    src/main.cpp
    src/face_recognition.cpp
    src/demographics_estimator.cpp
    src/liveness_detection.cpp
    src/logging.cpp
    src/iot_simulation.cpp
    src/server.cpp
    src/model_loader.cpp
    src/mongo_manager.cpp
    src/tor_integration.cpp
    src/tor_control.cpp
    utils/image_utils.cpp

    utils/network_utils.cpp
)

add_executable(centurion ${SOURCES})

target_include_directories(centurion PRIVATE
    include/
    utils/
    ${MONGOCXX_INCLUDE_DIRS}
    ${BSONCXX_INCLUDE_DIRS}
    ${OpenCV_INCLUDE_DIRS}
    ${CURL_INCLUDE_DIRS}
)

target_link_libraries(centurion
    ${OpenCV_LIBS}
     ${OpenCV_LIBS}
    ${MONGOCXX_LIBRARIES}
    ${BSONCXX_LIBRARIES}
    ${CURL_LIBRARIES}
    pthread
    ${CMAKE_DL_LIBS}
    nlohmann_json::nlohmann_json
    Threads::Threads
    OpenSSL::SSL
    OpenSSL::Crypto
    CURL::libcurl
)

target_compile_definitions(centurion PRIVATE CPPHTTPLIB_OPENSSL_SUPPORT)

if(libmongocxx_FOUND)
    target_link_libraries(centurion mongo::mongocxx_shared bsoncxx::bsoncxx_shared)
else()
    target_link_libraries(centurion ${MONGOCXX_LIBRARIES} ${BSONCXX_LIBRARIES})
    target_include_directories(centurion PRIVATE
        ${MONGOCXX_INCLUDE_DIRS} ${BSONCXX_INCLUDE_DIRS})
    target_compile_options(centurion PRIVATE
        ${MONGOCXX_CFLAGS_OTHER} ${BSONCXX_CFLAGS_OTHER})
endif()

if(WIRINGPI_LIB)
    target_link_libraries(centurion ${WIRINGPI_LIB})
endif()

message(STATUS "")
message(STATUS "=== Centurion Build Config ===")
message(STATUS "OpenCV    : ${OpenCV_VERSION}")
message(STATUS "MongoDB   : ON")
message(STATUS "CURL      : ON")
message(STATUS "CUDA      : ${CUDA_FOUND}")
message(STATUS "GPIO      : ${WIRINGPI_LIB}")
message(STATUS "==============================")
