const express = require("express");
const cors = require("cors");
const app = express();
const chatRoutes = require("./routes/chat.routes");
const loginRoutes = require("./routes/login")

app.use(cors());
app.use(express.json());

app.use("/api/chat", chatRoutes)
app.use("/api", loginRoutes)

module.exports = app;

