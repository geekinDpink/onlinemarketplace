const express = require("express");
const bodyParser = require("body-parser");
const connection = require("./config/dbconfig");
const jwt = require("jsonwebtoken");
const { secret } = require("./config/config");
// const bcrypt = require("bcrypt");

const app = express();
const port = 3001;

var cors = require("cors");

// Middleware that parses incoming requests body
app.use(bodyParser.json());

// TODO add CORS
app.use(cors());

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// create middleware
function verifyToken(req, res, next) {
  console.log("req.header", req.headers);

  var token = req.headers["authorization"]; // retrieve authorization header’s content
  // console.log(token);

  if (!token || !token.includes("Bearer")) {
    res.status(403); // 403 - Forbidden
    return res.send({ auth: "false", message: "Not authorized!" });
  } else {
    token = token.split("Bearer ")[1]; // split bearer from token and refer to token
    jwt.verify(token, secret, function (err, decoded) {
      //verify token
      if (err) {
        res.status(403); // 403 - Forbidden
        return res.end({ auth: false, message: "Not authorized!" });
      } else {
        req.userid = decoded.userid;
        // req.role = decoded.role;
        next();
      }
    });
  }
}

// Get all users info
// app.get("/users", (req, res) => {
//   const { username, password } = req.body;
//   const sql = "SELECT * FROM users_table";
//   connection.query(sql, (err, users) => {
//     if (err) {
//       console.error("Error fetching users", err);
//       res.status(500).json({ error: "Users information is not available " });
//     } else {
//       res.status(200).json(users);
//     }
//   });
// });

// Endpoint for login, take in username and password and generate jwt
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // select user whose username and password matches
  const sql = "SELECT * FROM users_table WHERE username=? and password=?;";

  // return user data
  connection.query(sql, [username, password], (err, user) => {
    if (err) {
      res.status(500).json({ error: "Server is not available " }); // 500 - Internal Server Error
    } else {
      if (user.length > 0) {
        console.log(user);
        let token = jwt.sign(
          {
            id: user.username,
            created_at: user.created_at,
          },
          secret,
          {
            expiresIn: 3600, // 1 hour
          }
        );
        res.status(200).json(token); // 200 - OK
      } else {
        res.status(404).json({ error: "Users information is not available " }); // 404 - Not Found
      }
    }
  });
});

// Get all products info
app.get("/products", verifyToken, (req, res) => {
  const sql = "SELECT * FROM products_table";
  connection.query(sql, (err, users) => {
    if (err) {
      console.error(`Error fetching products`, err);
      res.status(500).json({ error: "Products information is not available" }); // 500 - Internal Server Error
    } else {
      res.status(200).json(users); // 200 - OK
    }
  });
});

// Add new product
app.post("/products", (req, res) => {
  const { seller_id, seller_name, item_name, item_desc, price } = req.body;
  const sql =
    "INSERT INTO products_table (seller_id, seller_name, item_name, item_desc, price) VALUES (?, ?, ?, ?, ?)";
  connection.query(
    sql,
    [seller_id, seller_name, item_name, item_desc, price],
    (err, result) => {
      if (err) {
        console.error(`Error adding product ${item_name}`, err);
        res.status(500).json({ error: "Unable to list product" }); // 500 - Internal Server Error
      } else {
        // 201 - Created
        res.status(201).json({
          id: result.insertId,
          message: `${item_name} added successfully`,
        });
      }
    }
  );
});
