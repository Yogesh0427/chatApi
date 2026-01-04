const express = require("express")
const router = express.Router()

// ✅ Make sure path is correct relative to routes folder
const Login = require("../controllers/login")

// Post route for creating conversation
router.post("/login", Login.userLogin)

// Post route for creating conversation
router.post("/signup", Login.userSignup)

module.exports = router