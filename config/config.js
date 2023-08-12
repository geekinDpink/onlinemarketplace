require("dotenv").config();

var config = {
  secret: process.env.JWT_SECRET,
};

module.exports = config;
