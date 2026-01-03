const pool = require("../config/pool")
const { v4: uuidv4 } = require("uuid")

exports.fetchAllChaters=async (req,res)=>{
  const {role}= req.body
  console.log(role)
  try{
    const result = await pool.query(
      'select user_id as id,name,role from chat_users where role <> $1',
      [role]
    )
    res.json(result.rows)
  }
  catch (err) {
    console.error(err.message)
    res.status(500).json({ error: "Server error" })
  }
}

exports.getMessages = async (req, res) => {
  const { conversationId } = req.params
  try {
    const result = await pool.query(
      "SELECT * FROM messages WHERE conversation_id=$1 ORDER BY created_at ASC",
      [conversationId]
    );
    res.json(result.rows)
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ error: "Server error" })
  }
}

exports.createConversation = async (req, res) => {
  const { userId, astrologerId } = req.body
  try {
    let result = await pool.query(
      "SELECT * FROM conversations WHERE user_id=$1 AND astrologer_id=$2",
      [userId, astrologerId]
    );

    let conversation;
    if (result.rows.length > 0) {
      conversation = result.rows[0]
    } else {
      const newId = uuidv4()
      result = await pool.query(
        "INSERT INTO conversations (id, user_id, astrologer_id) VALUES ($1,$2,$3) RETURNING *",
        [newId, userId, astrologerId]
      );
      conversation = result.rows[0]
    }

    res.json(conversation);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" })
  }
};
