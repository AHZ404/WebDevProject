import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_URL } from "./config.jsx";

const Chat = ({ currentUser }) => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedChat, setSelectedChat] = useState(chatId || null);
  const [text, setText] = useState("");
  const bottomRef = useRef();

  useEffect(() => {
    if (!currentUser?.username) return;
    fetchConversations();
  }, [currentUser]);

  useEffect(() => {
    if (selectedChat) fetchMessages(selectedChat);
  }, [selectedChat]);

  useEffect(() => {
    if (chatId) setSelectedChat(chatId);
  }, [chatId]);

  const fetchConversations = async () => {
    try {
      const res = await fetch(
        `${API_URL}/chats?username=${encodeURIComponent(currentUser.username)}`
      );
      const data = await res.json();
      setConversations(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (id) => {
    try {
      const res = await fetch(`${API_URL}/chats/${id}/messages`);
      const data = await res.json();
      setMessages(data || []);
      // mark read
      await fetch(`${API_URL}/chats/${id}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser.username }),
      });
      // refresh conversations
      fetchConversations();
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        50
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async () => {
    if (!text.trim() || !selectedChat) return;
    try {
      await fetch(`${API_URL}/chats/${selectedChat}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderUsername: currentUser.username,
          content: text.trim(),
        }),
      });
      setText("");
      fetchMessages(selectedChat);
      fetchConversations();
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ NEW:: Refresh button should refresh the currently open chat messages too
  const handleRefresh = async () => {
    try {
      if (selectedChat) {
        await fetchMessages(selectedChat); // this already refreshes conversations + scrolls
      } else {
        await fetchConversations(); // if no chat selected, refresh list only
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!currentUser)
    return <div style={{ padding: 20 }}>Please log in to use chats.</div>;

  return (
    <div style={{ display: "flex", height: "80vh", gap: 16, padding: 16 }}>
      <div
        style={{
          width: 300,
          borderRight: "1px solid #343536",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            marginBottom: 12,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <strong>Messages</strong>
          <button onClick={handleRefresh}>Refresh</button>
        </div>

        {conversations.map((c) => (
          <div
            key={c._id}
            onClick={() => {
              setSelectedChat(c._id);
              navigate(`/chats/${c._id}`);
            }}
            style={{
              padding: 10,
              cursor: "pointer",
              background: selectedChat === c._id ? "#272729" : "transparent",
              borderBottom: "1px solid #343536",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>{c.otherUser?.username || "Unknown"}</div>
              {c.unread && <div style={{ color: "#ff4500" }}>●</div>}
            </div>
            <div style={{ fontSize: 12, color: "#818384", marginTop: 6 }}>
              {c.lastMessage || "No messages yet"}
            </div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {!selectedChat ? (
          <div style={{ padding: 20 }}>Select a conversation.</div>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
              {messages.map((m) => (
                <div
                  key={m._id}
                  style={{
                    marginBottom: 8,
                    display: "flex",
                    justifyContent:
                      m.senderUsername === currentUser.username
                        ? "flex-end"
                        : "flex-start",
                  }}
                >
                  <div
                    style={{
                      background:
                        m.senderUsername === currentUser.username
                          ? "#0079d3"
                          : "#272729",
                      color: "#fff",
                      padding: "8px 12px",
                      borderRadius: 8,
                      maxWidth: "70%",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: "#e6eef7",
                        marginBottom: 4,
                      }}
                    >
                      {m.senderUsername}
                    </div>
                    <div>{m.content}</div>
                    <div
                      style={{ fontSize: 10, color: "#c7c9cc", marginTop: 6 }}
                    >
                      {new Date(m.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                padding: 12,
                borderTop: "1px solid #343536",
              }}
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message"
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: 6,
                  background: "#121212",
                  border: "1px solid #343536",
                  color: "#fff",
                }}
              />
              <button
                onClick={handleSend}
                style={{
                  padding: "8px 12px",
                  background: "#ff4500",
                  border: "none",
                  color: "#fff",
                  borderRadius: 6,
                }}
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Chat;
