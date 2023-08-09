const express = require("express");
const bodyParser = require("body-parser");
const connection = require("./dbconfig");

const app = express();
const port = 3000;

// Middleware that parses incoming requests body
app.use(bodyParser.json());

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Get all users info
app.get("/users", (req, res) => {
  const sql = "SELECT * FROM users_table";
  connection.query(sql, (err, users) => {
    if (err) {
      console.error("Error fetching users", err);
      res.status(500).json({ error: "Users information is not available " });
    } else {
      res.status(200).json(users);
    }
  });
});

// Get all products info
app.get("/products", (req, res) => {
  const sql = "SELECT * FROM products_table";
  connection.query(sql, (err, users) => {
    if (err) {
      console.error(`Error fetching products`, err);
      res.status(500).json({ error: "Products information is not available" });
    } else {
      res.status(200).json(users);
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
        res.status(500).json({ error: "Unable to list product" });
      } else {
        res.status(201).json({
          id: result.insertId,
          message: `${item_name} added successfully`,
        });
      }
    }
  );
});
