#include <mongocxx/client.hpp>
#include <mongocxx/instance.hpp>
#include <bsoncxx/builder/stream/document.hpp>
#include <iostream>

mongocxx::instance inst{};
mongocxx::client client{mongocxx::uri{}};

auto db = client["centurion"];
auto users = db["users"];

void storeFace(std::string username,std::vector<float> embedding){

    bsoncxx::builder::stream::document doc;

    doc << "username" << username
        << "embedding" << embedding;

    users.insert_one(doc.view());

    std::cout<<"[DB] Face stored for "<<username<<std::endl;
}
