require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const pool = require("./config/pool");

const server = http.createServer(app);

// userId -> socketId
const onlineUsers = new Map();

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  /* ================= USER ROOM ================= */
  socket.on("join", (userId) => {
    socket.join(userId);
  });

  /* ================= CONVERSATION ROOM ================= */
  socket.on("joinConversation", (conversationId) => {
    socket.join(conversationId);
  });

  /* ================= ONLINE USERS ================= */
  socket.on("addUser", (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
  });

  /* ================= TYPING (ONLY RECEIVER + SAME CHAT) ================= */
  socket.on("typing", ({ conversationId, senderId, receiverId, isTyping }) => {
    if (!conversationId || !receiverId) return;

    socket.to(conversationId).emit("typing", {
      conversationId,
      senderId,
      isTyping,
    });
  });

  /* ================= SEND MESSAGE ================= */
  socket.on(
    "sendMessage",
    async ({ conversationId, senderId, receiverId, message }) => {
      try {
        if (!conversationId || !senderId || !receiverId || !message) return;

        // 1️⃣ Save message
        const res = await pool.query(
          `
          INSERT INTO messages
          (conversation_id, sender_id, receiver_id, message, status)
          VALUES ($1,$2,$3,$4,'sent')
          RETURNING *
          `,
          [conversationId, senderId, receiverId, message]
        );

        const msg = res.rows[0];

        // 2️⃣ Send message ONLY to this conversation
        io.to(conversationId).emit("newMessage", msg);

        // 3️⃣ Delivered ✓✓ (only if receiver online)
        if (onlineUsers.has(receiverId)) {
          await pool.query(
            `UPDATE messages SET status='delivered' WHERE id=$1`,
            [msg.id]
          );

          io.to(senderId).emit("messageStatus", {
            messageId: msg.id,
            status: "delivered",
          });
        }
      } catch (err) {
        console.error("sendMessage error:", err.message);
      }
    }
  );

  /* ================= SEEN ================= */
  socket.on("seen", async ({ conversationId, userId }) => {
    try {
      const res = await pool.query(
        `
        UPDATE messages
        SET status='seen'
        WHERE conversation_id=$1
          AND receiver_id=$2
          AND status!='seen'
        RETURNING id, sender_id
        `,
        [conversationId, userId]
      );

      // notify sender only
      res.rows.forEach((m) => {
        io.to(m.sender_id).emit("messageStatus", {
          messageId: m.id,
          status: "seen",
        });
      });
    } catch (err) {
      console.error("seen error:", err.message);
    }
  });

  /* ================= DISCONNECT ================= */
  socket.on("disconnect", () => {
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }

    io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
    console.log("❌ Socket disconnected:", socket.id);
  });
});

server.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});
