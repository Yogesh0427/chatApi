const express = require("express");
const router = express.Router();

const userController = require("../controllers/login");

// 🔐 LOGIN
router.post("/login", userController.userLogin);

// 📝 SIGNUP
router.post("/signup", userController.userSignup);

module.exports = router;
