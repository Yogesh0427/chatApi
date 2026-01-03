const express = require("express")
const router = express.Router()

// ✅ Make sure path is correct relative to routes folder
const chatController = require("../controllers/chat.controller")

// Post route for creating conversation
router.post("/conversation", chatController.createConversation)

// GET route for messages
router.get("/messages/:conversationId", chatController.getMessages)

module.exports = router