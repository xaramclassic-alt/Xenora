const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secretkey",
    resave: false,
    saveUninitialized: false,
  })
);

// Database
const db = new sqlite3.Database("./database.db");
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
)`);
db.run(`CREATE TABLE IF NOT EXISTS characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    description TEXT,
    personality TEXT,
    traits TEXT,
    scenario TEXT,
    image_url TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
)`);

// Signup
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  db.run(
    `INSERT INTO users(username,password) VALUES(?,?)`,
    [username, hash],
    function (err) {
      if (err) return res.json({ success: false, message: "Username exists" });
      req.session.userId = this.lastID;
      res.json({ success: true });
    }
  );
});

// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username=?`, [username], async (err, user) => {
    if (!user) return res.json({ success: false, message: "User not found" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ success: false, message: "Wrong password" });
    req.session.userId = user.id;
    res.json({ success: true });
  });
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login.html");
});

// Auth Middleware
function checkAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
  next();
}

// Chat AI
app.post("/chat", checkAuth, async (req, res) => {
  const { message } = req.body;
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: message }],
      }),
    });
    const data = await response.json();
    const reply = data.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ reply: "AI error" });
  }
});

// Generate Image
app.post("/image", checkAuth, async (req, res) => {
  const { prompt } = req.body;
  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ prompt, n: 1, size: "512x512" }),
    });
    const data = await response.json();
    const imageUrl = data.data[0].url;
    res.json({ imageUrl });
  } catch (err) {
    res.status(500).json({ imageUrl: null });
  }
});

// Save Character
app.post("/save-character", checkAuth, (req, res) => {
  const { name, description, personality, traits, scenario, image_url } = req.body;
  db.run(
    `INSERT INTO characters(user_id,name,description,personality,traits,scenario,image_url) VALUES(?,?,?,?,?,?,?)`,
    [req.session.userId, name, description, personality, traits, scenario, image_url],
    function (err) {
      if (err) return res.json({ success: false });
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Get Characters
app.get("/my-characters", checkAuth, (req, res) => {
  db.all(`SELECT * FROM characters WHERE user_id=?`, [req.session.userId], (err, rows) => {
    if (err) return res.json({ success: false });
    res.json({ success: true, characters: rows });
  });
});

app.listen(PORT, () => console.log(`🚀 Xenora AI running on port ${PORT}`));
