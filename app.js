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



const db = require("./db");

const port = process.env.PORT || 3001;

const corsOptions = {
  origin: "https://famous-dolphin-0ed2d4.netlify.app",
  optionsSuccessStatus: 200,
  credentials: true
};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'build')));
app.use('/uploads', express.static(__dirname + '/uploads'));


app.get('/*', function (req, res) {
   res.sendFile(path.join(__dirname, 'build', 'index.html'));
 });

db.on("error", console.error.bind(console, "MonoDB Connection Error:"));
db.once("open", () => {
  console.log("Database Connected...");
});

app.use("/", routes);

app.listen(port, () => {
  console.log("The Express Server is running on port 3001");
});
