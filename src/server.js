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

io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log("User joined room:", userId);
  });

  socket.on("send_message", async (data) => {
    const { conversationId, senderId, receiverId, message } = data;

    // Emit to receiver
    io.to(receiverId).emit("receive_message", data);

    // Save to DB
    await pool.query(
      "INSERT INTO messages (conversation_id, sender_id, receiver_id, message) VALUES ($1,$2,$3,$4)",
      [conversationId, senderId, receiverId, message]
    );
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

server.listen(5000, () => console.log("🚀 Server running on port 5000"));
