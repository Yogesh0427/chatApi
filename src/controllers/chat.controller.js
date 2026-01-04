const pool = require("../config/pool")

exports.fetchAllChaters=async (req,res)=>{
  const {role}= req.body
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
  const { conversationId } = req.body
  
  try {
    const result = await pool.query(
      "SELECT * FROM messages WHERE conversation_id=$1 ORDER BY created_at ASC",
      [conversationId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ error: "Server error" })
  }
}

exports.createConversation = async (req, res) => {
  const { userId, astrologerId } = req.body;

  if (!userId || !astrologerId) {
    return res.status(400).json({
      error: "userId and astrologerId are required",
      received: { userId, astrologerId }
    });
  }

  try {
    const result = await pool.query(
      `
      SELECT *
      FROM conversations
      WHERE 
        (user1_id = $1 AND user2_id = $2)
        OR
        (user1_id = $2 AND user2_id = $1)
      `,
      [userId, astrologerId]
    );

    let conversation;

    if (result.rows.length > 0) {
      conversation = result.rows[0];
    } else {
      const insertResult = await pool.query(
        `
        INSERT INTO conversations (user1_id, user2_id)
        VALUES ($1, $2)
        RETURNING *
        `,
        [userId, astrologerId]
      );

      conversation = insertResult.rows[0];
    }

    res.json(conversation);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

