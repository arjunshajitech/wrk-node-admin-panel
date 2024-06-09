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
const excel = require("exceljs");

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
    name,
    email,
    about,
    website,
    facebook,
    instagram,
    twiter,
    youtube,
    tiktok,
  } = req.body;

  console.log(req.body);

  if (!name || !email) {
    return res.status(400).send("Name and Email are required.");
  }

  const id = uuidv4();
  let imageId = uuidv4();
  let questionId = uuidv4();
  const profileImage = req.files && req.files.profile;
  const questions = req.files && req.files.questions;

  if (profileImage) {
    profileImage.mv("./public/image/" + imageId + ".jpg", (err, done) => {
      if (err) {
        console.error("Error saving profile image:", err);
        return res.status(500).send("Error saving profile image.");
      }
    });
  } else {
    imageId = null;
  }

  if (questions) {
    questions.mv("./public/excel/" + questionId + ".xlsx", (err, done) => {
      if (err) {
        console.error("Error saving questions file:", err);
        return res.status(500).send("Error saving questions file.");
      }
    });
  } else {
    questionId = null;
  }

  const insert = `
    INSERT INTO student_details (id, name, email, about, website, instagram, twiter, facebook, youtube, tiktok, profileid, questionsid)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;
  connection.query(
    insert,
    [
      id,
      name,
      email,
      about,
      website,
      instagram,
      twiter,
      facebook,
      youtube,
      tiktok,
      imageId,
      questionId,
    ],
    (error, results, fields) => {
      if (error) {
        console.error("Error inserting student details:", error);
        return res.status(500).send("Error creating student.");
      }
      console.log("Student created successfully.");
      connection.query(
        "SELECT * FROM student_details",
        (studentError, studentResults, studentFields) => {
          if (studentError) {
            console.error("Error fetching student details:", studentError);
            return res.status(500).send("Error fetching students.");
          }
          res.render("admin/home", { students: studentResults });
        }
      );
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

app.get("/students", (req, res) => {
  connection.query(
    "SELECT * FROM student_details",
    (error, results, fields) => {
      if (error) {
        return res.status(500).send(error);
      }

      const response = {
        studentsList: results,
      };
      res.json(response);
    }
  );
});

app.get("/students/:id", (req, res) => {
  const { id } = req.params;
  const userQuery = "SELECT * FROM student_details WHERE id = ?";

  connection.query(userQuery, [id], (error, results) => {
    if (error) {
      console.error("Error finding user:", error);
      return res.status(500).send("Error finding user");
    }

    if (results.length === 0) {
      return res.status(404).send({ message: "User not found." });
    }

    const student = results[0];
    const { questionsid } = student;

    if (questionsid === null || questionsid === "") {
      return res.status(404).send({ message: "No questions found." });
    }

    const filePath = path.join(
      __dirname,
      "public",
      "excel",
      `${questionsid}.xlsx`
    );
    const workbook = new excel.Workbook();

    workbook.xlsx
      .readFile(filePath)
      .then(() => {
        const worksheet = workbook.getWorksheet(1);
        const questions = [];

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;

          const question = row.getCell(1).value;
          const answer = row.getCell(2).value;

          questions.push({ question, answer });
        });

        res.json({ student, questions });
      })
      .catch((error) => {
        console.error("Error reading Excel file:", error);
        res.status(500).send({ message: "Error reading Excel file" });
      });
  });
});

const httpServer = http.createServer(app);

httpServer.listen(port, () => {
  console.log(`HTTP server listening on port ${port}`);
});
