const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const messageSchema = new mongoose.Schema({
  chat: { type: ObjectId, ref: "Chat", required: true },
  sender: { type: ObjectId, ref: "User", required: true },
  senderUsername: { type: String },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

messageSchema.index({ chat: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
