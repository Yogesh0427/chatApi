// chat.controller.js
const pool = require("../config/pool");

exports.getMessages = async (req, res) => {
  const { conversationId } = req.params; 
  const result = await pool.query(
    "SELECT * FROM messages WHERE conversation_id=$1 ORDER BY created_at ASC",
    [conversationId]
  );
  res.json(result.rows);
};

exports.createConversation = async (req, res) => {
  const { userId, astrologerId } = req.body;
  const result = await pool.query(
    "INSERT INTO conversations (user_id, astrologer_id) VALUES ($1,$2) ON CONFLICT(user_id, astrologer_id) DO NOTHING RETURNING *",
    [userId, astrologerId]
  );
  res.json(result.rows[0]);
};
