const express = require("express");
const cookieParser = require("cookie-parser");
var hbs = require("express-handlebars");
const path = require("path");
const session = require("express-session");
const http = require("http");
const connection = require("./connection");

const {
  defaultAdminEntrySQL,
  createAdminTableSQL,
  createTableSQL,
} = require("./tables");

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
    (error, results, fields) => {
      // if (error) {
      //   console.error("Error querying database: " + error.stack);
      //   res.status(500).json({ error: "Internal server error" });
      //   return;
      // }

      if (results.length === 0) {
        res.render("admin/login", {
          showError: true,
        });
        return;
      }

      const admin = results[0];

      if (admin.password !== password) {
        res.render("admin/login", {
          showError: true,
        });
        return;
      }

      res.render("admin/home", {});
    }
  );
  return;
});

const httpServer = http.createServer(app);

httpServer.listen(port, () => {
  console.log(`HTTP server listening on port ${port}`);
});
