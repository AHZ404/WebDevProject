const Chat = require("../models/chat");
const Message = require("../models/message");
const User = require("../models/user");

// Helper: get user by username
const findUserByUsername = async (username) => {
  if (!username) return null;
  return await User.findOne({ username });
};

// Start or return existing chat between two users
const startChat = async (req, res) => {
  try {
    const { currentUsername, otherUsername } = req.body;
    if (!currentUsername || !otherUsername)
      return res.status(400).json({ message: "Missing usernames" });
    if (currentUsername === otherUsername)
      return res
        .status(400)
        .json({ message: "Cannot start chat with yourself" });

    const userA = await findUserByUsername(currentUsername);
    const userB = await findUserByUsername(otherUsername);
    if (!userA || !userB)
      return res.status(404).json({ message: "User not found" });

    // Sort ids to keep uniqueness
    const participants = [userA._id, userB._id].sort();

    // Try to find existing chat
    let chat = await Chat.findOne({ participants });
    if (chat) return res.json(chat);

    // Create new chat
    chat = await Chat.create({
      participants,
      participantUsernames: [userA.username, userB.username],
      lastMessage: "",
      unreadFor: [],
    });
    return res.status(201).json(chat);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get list of chats for user
const getChatsForUser = async (req, res) => {
  try {
    const username = req.query.username;
    if (!username) return res.status(400).json({ message: "Missing username" });
    const user = await findUserByUsername(username);
    if (!user) return res.status(404).json({ message: "User not found" });

    const chats = await Chat.find({ participants: user._id })
      .sort({ updatedAt: -1 })
      .lean();

    // For each chat, compute the other participant and unread flag
    const enhanced = await Promise.all(
      chats.map(async (c) => {
        const otherId = c.participants.find((id) => !id.equals(user._id));
        const otherUser = await User.findById(otherId).select(
          "username profile"
        );
        return {
          ...c,
          otherUser: otherUser
            ? { username: otherUser.username, profile: otherUser.profile }
            : null,
          unread: c.unreadFor.some((u) => u.equals(user._id)),
        };
      })
    );

    return res.json(enhanced);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get messages for a chat
const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!chatId) return res.status(400).json({ message: "Missing chatId" });
    const messages = await Message.find({ chat: chatId })
      .sort({ createdAt: 1 })
      .lean();
    return res.json(messages);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Send message in chat
const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { senderUsername, content } = req.body;
    if (!chatId || !senderUsername || !content)
      return res.status(400).json({ message: "Missing data" });

    const sender = await findUserByUsername(senderUsername);
    if (!sender) return res.status(404).json({ message: "Sender not found" });

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    // Create message
    const message = await Message.create({
      chat: chat._id,
      sender: sender._id,
      senderUsername: sender.username,
      content,
    });

    // Update chat: lastMessage, updatedAt, unreadFor -> mark unread for the other participant only
    const otherId = chat.participants.find((id) => !id.equals(sender._id));
    chat.lastMessage = content;
    chat.updatedAt = new Date();
    // Ensure unreadFor contains otherId and not the sender
    chat.unreadFor = [otherId];
    await chat.save();

    return res.status(201).json(message);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Mark chat as read for user
const markRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { username } = req.body;
    if (!chatId || !username)
      return res.status(400).json({ message: "Missing data" });
    const user = await findUserByUsername(username);
    if (!user) return res.status(404).json({ message: "User not found" });

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    chat.unreadFor = chat.unreadFor.filter((u) => !u.equals(user._id));
    await chat.save();
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  startChat,
  getChatsForUser,
  getMessages,
  sendMessage,
  markRead,
};
