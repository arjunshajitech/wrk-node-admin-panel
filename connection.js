const mysql = require("mysql");

// Create a connection pool to the MySQL database
var con = mysql.createConnection({
  host: "localhost",
  port: 5001,
  user: "root",
  password: "root",
  database: "admin_panel",
});

module.exports = con;

// execure the command in the mysql
// 1. ALTER USER 'root' IDENTIFIED WITH mysql_native_password BY 'root';
// 2. flush privileges;

// mysql connection issue solved by
// https://stackoverflow.com/questions/50093144/mysql-8-0-client-does-not-support-authentication-protocol-requested-by-server?page=1&tab=scoredesc#tab-top
