require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");
const _ = require("lodash");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const routes = require("./routes");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const path = require('path');



const db = require("./db");

const port = process.env.PORT || 3001;

const corsOptions = {


  //https://remarkable-crostata-a4622f.netlify.app
  //"https://adorable-twilight-a6b863.netlify.app"
  //http://localhost:3000
  origin:  'https://cheerful-lollipop-79dc13.netlify.app',
  optionsSuccessStatus: 200,
  credentials: true
};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));



db.on("error", console.error.bind(console, "MonoDB Connection Error:"));
db.once("open", () => {
  console.log("Database Connected...");
});

app.use("/", routes);

app.listen(port, () => {
  console.log("The Express Server is running on port 3001");
});
