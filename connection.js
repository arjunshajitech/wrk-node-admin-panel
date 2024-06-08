const mysql = require("mysql");

// Create a connection pool to the MySQL database
var con = mysql.createConnection({
  host: "localhost",
  port: 5001,
  user: "root",
  password: "root",
  database: "admin_panel"
});

module.exports = con;


// mysql connection issue solved by 
// https://stackoverflow.com/questions/50093144/mysql-8-0-client-does-not-support-authentication-protocol-requested-by-server?page=1&tab=scoredesc#tab-top
