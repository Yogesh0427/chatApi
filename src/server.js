require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const pool = require("./config/pool");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection",(socket) => {
  console.log("✅ Socket connected:", socket.id);
 
  socket.on("join",(userId) => {
    socket.join(userId);
    console.log("User joined room:", userId)
  })

 socket.on("sendMessage", async (data) => {
  try {
    const { conversationId, senderId, receiverId, message } = data;

    if (!conversationId || !senderId || !receiverId || !message) return;

    // 1️⃣ Save to DB
    const result = await pool.query(
      `
      INSERT INTO messages 
      (conversation_id, sender_id, receiver_id, message)
      VALUES ($1,$2,$3,$4)
      RETURNING *
      `,
      [conversationId, senderId, receiverId, message]
    );

    const savedMessage = result.rows[0];

    // 2️⃣ Emit to receiver
    io.to(receiverId).emit("newMessage", savedMessage);

    // 3️⃣ Emit back to sender (sync across devices)
    io.to(senderId).emit("newMessage", savedMessage);

  } catch (err) {
    console.error("sendMessage error:", err.message);
  }
});


  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

server.listen(5000, () => console.log("🚀 Server running on port 5000"));
