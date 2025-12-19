const express = require("express");
const router = express.Router();
const {
  startChat,
  getChatsForUser,
  getMessages,
  sendMessage,
  markRead,
} = require("../controllers/chatController");

// POST /chats/start { currentUsername, otherUsername }
router.post("/start", startChat);

// GET /chats?username=alice  -> list chats for user
router.get("/", getChatsForUser);

// GET /chats/:chatId/messages
router.get("/:chatId/messages", getMessages);

// POST /chats/:chatId/messages { senderUsername, content }
router.post("/:chatId/messages", sendMessage);

// POST /chats/:chatId/read { username }
router.post("/:chatId/read", markRead);

module.exports = router;
