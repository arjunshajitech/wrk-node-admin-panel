const express = require("express");
const cookieParser = require("cookie-parser");
var hbs = require("express-handlebars");
const path = require("path");
const session = require("express-session");
const http = require("http");
const connection = require("./connection");
const { v4: uuidv4 } = require("uuid");
var fileUpload = require("express-fileupload");
const fs = require("fs");

const {
  defaultAdminEntrySQL,
  createAdminTableSQL,
  createTableSQL,
} = require("./tables");
const { log } = require("console");

const port = process.env.PORT | 3000;
const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.engine(
  "hbs",
  hbs.engine({
    extname: "hbs",
    defaultLayout: "layout",
    layoutsDir: __dirname + "/views/layout/",
    partialsDir: __dirname + "/views/partials",
  })
);
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
app.use(fileUpload());

connection.connect(function (err) {
  if (err) throw err;
  console.log("MYSQL Connected!");
  connection.query(createTableSQL, (error, results, fields) => {});
  connection.query(createAdminTableSQL, (error, results, fields) => {});
  connection.query(defaultAdminEntrySQL, (error, results, fields) => {});
});

app.get("/", (req, res) => {
  res.render("admin/login", {
    showError: false,
  });
});

app.get("/logout", (req, res) => {
  res.render("admin/login", {
    showError: false,
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  connection.query(
    "SELECT * FROM admin_details WHERE email = ?",
    [email],
    (error, adminResults, fields) => {
      if (error) {
        console.error("Error querying admin database: " + error.stack);
        res.status(500).json({ error: "Internal server error" });
        return;
      }

      if (adminResults.length === 0 || adminResults[0].password !== password) {
        res.render("admin/login", {
          showError: true,
        });
        return;
      }

      // If login is successful, query student details
      connection.query(
        "SELECT * FROM student_details",
        (studentError, studentResults, studentFields) => {
          res.render("admin/home", { students: studentResults });
        }
      );
    }
  );
});

app.post("/create", (req, res) => {
  const {
    firstname,
    lastname,
    email,
    phone,
    facebookid,
    instagramid,
    address,
  } = req.body;

  const id = uuidv4();
  let imageId = uuidv4();
  let questionId = uuidv4();
  const profileImage = req.files && req.files.profile;
  const questions = req.files && req.files.questions;

  if (profileImage) {
    profileImage.mv("./public/image/" + imageId + ".jpg", (err, done) => {});
  } else {
    imageId = null;
  }

  if (questions) {
    questions.mv("./public/excel/" + questionId + ".xlsx", (err, done) => {});
  } else {
    questionId = null;
  }

  const insert = `
    INSERT INTO student_details (id, firstname, lastname, address, email, phone, facebookid, instagramid, profileid, questionsid)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;
  connection.query(
    insert,
    [
      id,
      firstname,
      lastname,
      address,
      email,
      phone,
      facebookid,
      instagramid,
      imageId,
      questionId,
    ],
    (error, results, fields) => {
      console.log("Student created successfully.");
    }
  );

  connection.query(
    "SELECT * FROM student_details",
    (studentError, studentResults, studentFields) => {
      res.render("admin/home", { students: studentResults });
    }
  );
});

app.get("/delete/:id", (req, res) => {
  const { id } = req.params;

  connection.query(
    "SELECT profileid, questionsid FROM student_details WHERE id = ?",
    [id],
    (selectError, selectResults) => {
      if (selectResults.length === 0) {
        return res.status(404).send("Student not found.");
      }

      const { profileid, questionsid } = selectResults[0];

      const deleteQuery = "DELETE FROM student_details WHERE id = ?";

      connection.query(deleteQuery, [id], (deleteError, deleteResults) => {
        const profileImagePath = path.join(
          __dirname,
          "public",
          "image",
          `${profileid}.jpg`
        );
        const questionsFilePath = path.join(
          __dirname,
          "public",
          "excel",
          `${questionsid}.xlsx`
        );

        fs.unlink(profileImagePath, (err) => {
          if (err) {
            console.error(`Failed to delete profile image: ${err.message}`);
          }
        });

        fs.unlink(questionsFilePath, (err) => {
          if (err) {
            console.error(`Failed to delete questions file: ${err.message}`);
          }
        });

        console.log("Student deleted successfully.");

        connection.query(
          "SELECT * FROM student_details",
          (studentError, studentResults, studentFields) => {
            if (studentError) {
              return res.status(500).send(studentError);
            }

            res.render("admin/home", { students: studentResults });
          }
        );
      });
    }
  );
});

const httpServer = http.createServer(app);

httpServer.listen(port, () => {
  console.log(`HTTP server listening on port ${port}`);
});
