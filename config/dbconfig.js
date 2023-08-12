// latest package of mysql
const mysql = require("mysql2");
require("dotenv").config();

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: process.env.DB_PWD,
  database: "best_online_marketplace",
});

module.exports = connection;
