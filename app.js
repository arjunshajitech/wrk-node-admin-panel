const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const session = require("express-session");
const http = require("http");
const connection = require("./connection");

const port = process.env.PORT | 3000;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "key",
    cookie: { maxAge: 60000 },
    resave: true,
    saveUninitialized: true,
  })
);

connection.connect(function (err) {
  if (err) throw err;
  console.log("MYSQL Connected!");

  const createTableSQL = `
  CREATE TABLE IF NOT EXISTS student_details (
    id VARCHAR(36) PRIMARY KEY,
    firstname VARCHAR(255),
    lastname VARCHAR(255),
    address VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    facebookid VARCHAR(255),
    instagramid VARCHAR(255),
    profileid VARCHAR(255),
    questionsid VARCHAR(255)
  )
`;

  connection.query(createTableSQL, (error, results, fields) => {
    if (error) {
      console.error("Error creating table: " + error.stack);
      return;
    }
    console.log("Table created successfully");
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "home.html"));
});

const httpServer = http.createServer(app);

httpServer.listen(port, () => {
  console.log(`HTTP server listening on port ${port}`);
});
