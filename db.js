const mongoose = require("mongoose");
require("dotenv").config();
// const url = 'mongodb+srv://ahmadaliirfan32:jpTt0V33kosPfa55@cluster0.gzxqjoz.mongodb.net/?retryWrites=true&w=majority';

const url =
  "mongodb://ahmadaliirfan32:jpTt0V33kosPfa55@ac-iqjbmhq-shard-00-00.gzxqjoz.mongodb.net:27017,ac-iqjbmhq-shard-00-01.gzxqjoz.mongodb.net:27017,ac-iqjbmhq-shard-00-02.gzxqjoz.mongodb.net:27017/?ssl=true&replicaSet=atlas-eylfss-shard-0&authSource=admin&retryWrites=true&w=majority";

//const url = process.env.DATABASE_CONNECTION_STRING;

mongoose.Promise = global.Promise;

async function connect() {
  await mongoose
    .connect(url, { useUnifiedTopology: true, useNewUrlParser: true })
    .catch((e) => {
      console.error("Connection Error", e.message);
    });
}

connect();
const db = mongoose.connection;

module.exports = db;
