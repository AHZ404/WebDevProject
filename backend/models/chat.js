const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const chatSchema = new mongoose.Schema({
  participants: [{ type: ObjectId, ref: "User", required: true }],
  participantUsernames: [{ type: String, required: true }],
  lastMessage: { type: String, default: "" },
  unreadFor: [{ type: ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Ensure one chat per pair by creating a unique index on participants when sorted
chatSchema.index(
  { participants: 1 },
  { unique: true, partialFilterExpression: { participants: { $size: 2 } } }
);

const Chat = mongoose.model("Chat", chatSchema);
module.exports = Chat;
