#include "model_loader.h"
#include <iostream>
#include <iomanip>
#include <stdexcept>

ModelLoader::ModelLoader(const std::string& dir):modelsDir_(dir){registerDefaults();discoverModels();}

void ModelLoader::registerDefaults(){
    auto add=[&](const std::string& n,const std::string& f,const std::string& fmt,
                 cv::Size sz,int ch,const std::string& desc,const std::string& proto=""){
        ModelInfo i; i.name=n;i.path=modelsDir_+f;i.format=fmt;
        i.protoPath=proto.empty()?"":modelsDir_+proto;
        i.inputSize=sz;i.inputChannels=ch;i.description=desc;
        registry_[n]=i;
    };
    add("facenet",         "facenet_embedding.onnx",           "onnx",{160,160},3,"ArcFace/FaceNet");
    add("face_detector",   "face_detection_yunet_2023mar.onnx","onnx",{320,320},3,"YuNet detector");
    add("age_gender",      "age_gender_model.onnx",            "onnx",{224,224},3,"Age/gender ONNX");
    add("age_gender_caffe","age_net.caffemodel","caffemodel",{227,227},3,"Age/gender Caffe","deploy_age.prototxt");
    add("ethnicity",       "ethnicity_model.onnx",             "onnx",{224,224},3,"Ethnicity");
    add("anti_spoof",      "anti_spoofing_model.onnx",         "onnx",{80,80},  3,"Anti-spoof");
}

void ModelLoader::discoverModels(){
    if(!fs::exists(modelsDir_)){std::cerr<<"[ModelLoader] Dir not found: "<<modelsDir_<<"\n";return;}
    for(const auto& e:fs::directory_iterator(modelsDir_)){
        if(!e.is_regular_file()) continue;
        std::string stem=e.path().stem().string(),ext=e.path().extension().string();
        if(ext==".onnx"&&registry_.find(stem)==registry_.end()){
            ModelInfo i;i.name=stem;i.path=e.path().string();
            i.format="onnx";i.inputSize={224,224};i.inputChannels=3;i.description="Auto";
            registry_[stem]=i;
        }
    }
}

bool ModelLoader::isCUDAAvailable(){
    cv::dnn::Net t;
    try{t.setPreferableBackend(cv::dnn::DNN_BACKEND_OPENCV);return true;}catch(...){return false;}
}

std::pair<int,int> ModelLoader::getBestBackendTarget(){
    return isCUDAAvailable()
        ? std::make_pair((int)cv::dnn::DNN_BACKEND_OPENCV,(int)cv::dnn::DNN_TARGET_CPU)
        : std::make_pair((int)cv::dnn::DNN_BACKEND_OPENCV,(int)cv::dnn::DNN_TARGET_CPU);
}

cv::dnn::Net ModelLoader::loadFromInfo(const ModelInfo& info){
    cv::dnn::Net net;
    if(!fs::exists(info.path)) throw std::runtime_error("Not found: "+info.path);
    if(info.format=="onnx")       net=cv::dnn::readNetFromONNX(info.path);
    else if(info.format=="caffemodel") net=cv::dnn::readNetFromCaffe(info.protoPath,info.path);
    else if(info.format=="pb")    net=cv::dnn::readNetFromTensorflow(info.path,info.protoPath);
    else return net;
    auto[b,t]=getBestBackendTarget();
    net.setPreferableBackend(b);net.setPreferableTarget(t);
    return net;
}

std::optional<cv::dnn::Net> ModelLoader::loadNet(const std::string& name){
    auto it=registry_.find(name);
    if(it==registry_.end()) return std::nullopt;
    try{
        auto net=loadFromInfo(it->second);
        if(net.empty()) return std::nullopt;
        std::cout<<"[ModelLoader] Loaded: "<<name<<"\n";
        return net;
    }catch(const std::exception& e){
        std::cerr<<"[ModelLoader] Failed '"<<name<<"': "<<e.what()<<"\n";
        return std::nullopt;
    }
}

bool ModelLoader::modelExists(const std::string& n) const{
    auto it=registry_.find(n);
    return it!=registry_.end()&&fs::exists(it->second.path);
}

std::vector<std::string> ModelLoader::listModels() const{
    std::vector<std::string> v;
    for(const auto&[k,_]:registry_) v.push_back(k);
    return v;
}

std::optional<ModelInfo> ModelLoader::getInfo(const std::string& n) const{
    auto it=registry_.find(n);
    return it==registry_.end()?std::nullopt:std::optional<ModelInfo>(it->second);
}

void ModelLoader::printSummary() const{
    std::cout<<"\n[ModelLoader] ─── Model Status ─────────────\n";
    for(const auto&[n,i]:registry_){
        bool ex=fs::exists(i.path);
        std::cout<<(ex?"  OK  ":"  --  ")<<std::left<<std::setw(20)<<n
                 <<" "<<(ex?"READY  ":"MISSING")<<"\n";
    }
    std::cout<<"────────────────────────────────────────────\n\n";
}
