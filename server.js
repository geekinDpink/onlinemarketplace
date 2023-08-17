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

// create middleware to verify token, if able to verify i.e. no error, move on to implementation next middleware
function verifyToken(req, res, next) {
  var token = req.headers["authorization"]; // retrieve authorization header’s content

  if (!token || !token.includes("Bearer")) {
    res.status(403); // 403 - Forbidden
    return res.send({ auth: "false", message: "Not authorized!" });
  } else {
    token = token.split("Bearer ")[1]; // split bearer from token and refer to token
    jwt.verify(token, secret, function (err, decoded) {
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
        const theUser = user[0];
        res
          .status(200)
          .json({ token: token, id: theUser.id, username: theUser.username }); // 200 - OK
      } else {
        res.status(404).json({ error: "Users information is not available " }); // 404 - Not Found
      }
    }
  });
});

// Add new user, hashed password and email to db
app.post("/register", (req, res) => {
  const { username, password, email } = req.body;

  // hash the password
  bcrypt
    .hash(password, 5)
    .then((hashedPassword) => {
      const sql =
        "INSERT INTO users_table (username, password, email) VALUES (?, ?, ?)";
      connection.query(
        sql,
        [username, hashedPassword, email],
        (err, result) => {
          if (err) {
            console.error(`Error registering ${username}`, err);
            res.status(500).json({ error: "Unable to register user" }); // 500 - Internal Server Error
          } else {
            // 201 - Created
            res.status(201).json({
              id: result.insertId,
              message: `${username} added successfully`,
            });
          }
        }
      );
    })
    // catch error if the password hash isn't successful
    .catch((e) => {
      res.status(500).send({
        message: "Password was not hashed successfully",
        e,
      });
    });
});

// Get all products info
app.get("/products", (req, res) => {
  const sql = "SELECT * FROM products_table";
  connection.query(sql, (err, products) => {
    if (err) {
      console.error(`Error fetching products`, err);
      res.status(500).json({ error: "Products information is not available" }); // 500 - Internal Server Error
    } else {
      res.status(200).json(products); // 200 - OK
    }
  });
});

// Get products info of a specific seller
app.get("/products/:id", verifyToken, (req, res) => {
  const sellerId = req.params.id;
  const sql = "SELECT * FROM products_table WHERE SELLER_ID LIKE ?";

  connection.query(sql, [sellerId], (err, products) => {
    if (err) {
      console.error(`Error fetching products`, err);
      res.status(500).json({ error: "Products information is not available" }); // 500 - Internal Server Error
    } else {
      res.status(200).json(products); // 200 - OK
    }
  });
});

// Add new product
app.post("/products", verifyToken, (req, res) => {
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
