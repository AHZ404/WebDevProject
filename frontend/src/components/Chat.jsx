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

  // Refresh behavior stays EXACTLY the same (only styled)
  const handleRefresh = async () => {
    try {
      if (selectedChat) {
        await fetchMessages(selectedChat);
      } else {
        await fetchConversations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ Send on Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const selectedConversation = conversations.find((c) => c._id === selectedChat);
  const headerTitle =
    selectedConversation?.otherUser?.username ||
    (selectedChat ? "Chat" : "Threads");

  if (!currentUser)
    return <div style={{ padding: 20 }}>Please log in to use chats.</div>;

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        {/* LEFT: Threads */}
        <div style={styles.left}>
          <div style={styles.leftTop}>
            <div style={styles.leftTitleRow}>
              <div style={styles.redditDot} aria-hidden>
                🟠
              </div>
              <div style={styles.leftTitle}>Chats</div>
            </div>

            {/* Refresh button (same functionality, better style) */}
            <button
              onClick={handleRefresh}
              style={styles.refreshBtn}
              title="Refresh"
            >
              Refresh
            </button>
          </div>

          <div style={styles.sectionHeader}>Threads</div>

          <div style={styles.threadList}>
            {conversations.map((c) => {
              const active = selectedChat === c._id;
              return (
                <div
                  key={c._id}
                  onClick={() => {
                    setSelectedChat(c._id);
                    navigate(`/chats/${c._id}`);
                  }}
                  style={{
                    ...styles.threadItem,
                    ...(active ? styles.threadItemActive : null),
                  }}
                >
                  <div style={styles.threadRow}>
                    <div style={styles.threadName}>
                      {c.otherUser?.username || "Unknown"}
                    </div>
                    {c.unread && <div style={styles.unreadDot} title="Unread" />}
                  </div>

                  <div style={styles.threadPreview}>
                    {c.lastMessage || "No messages yet"}
                  </div>
                </div>
              );
            })}

            {conversations.length === 0 && (
              <div style={styles.emptyThreads}>No threads yet.</div>
            )}
          </div>
        </div>

        {/* RIGHT: Conversation */}
        <div style={styles.right}>
          <div style={styles.header}>
            <div style={styles.headerTitle}>{headerTitle}</div>
          </div>

          {!selectedChat ? (
            <div style={styles.emptyChat}>
              Select a thread to start chatting.
            </div>
          ) : (
            <>
              <div style={styles.messages}>
                {messages.map((m) => {
                  const mine = m.senderUsername === currentUser.username;
                  return (
                    <div
                      key={m._id}
                      style={{
                        ...styles.msgRow,
                        justifyContent: mine ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          ...styles.bubble,
                          ...(mine ? styles.bubbleMine : styles.bubbleTheirs),
                        }}
                      >
                        <div style={styles.bubbleMeta}>
                          <span style={styles.bubbleUser}>
                            {m.senderUsername}
                          </span>
                          <span style={styles.bubbleTime}>
                            {new Date(m.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div style={styles.bubbleText}>{m.content}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input bar like Reddit (send arrow) */}
              <div style={styles.composerWrap}>
                <div style={styles.composer}>
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message"
                    style={styles.input}
                  />

                  <button
                    onClick={handleSend}
                    style={{
                      ...styles.sendBtn,
                      opacity: text.trim() ? 1 : 0.5,
                      cursor: text.trim() ? "pointer" : "not-allowed",
                    }}
                    title="Send"
                    disabled={!text.trim()}
                    aria-label="Send"
                  >
                    {/* Arrow icon similar to Reddit */}
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 12L21 3L14 21L11 13L3 12Z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>
                </div>
                <div style={styles.helperText}>
                  Send an invite message to start chatting! 👋
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    background: "#ffffff",
    minHeight: "calc(100vh - 60px)",
    padding: 0,
  },

  shell: {
    height: "calc(100vh - 60px)",
    display: "flex",
    borderTop: "1px solid #e5e7eb",
  },

  /* LEFT PANEL */
  left: {
    width: 320,
    borderRight: "1px solid #e5e7eb",
    background: "#ffffff",
    display: "flex",
    flexDirection: "column",
  },

  leftTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 14px 10px 14px",
  },

  leftTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  redditDot: {
    fontSize: 14,
    lineHeight: "14px",
  },

  leftTitle: {
    fontWeight: 700,
    fontSize: 16,
    color: "#111827",
  },

  refreshBtn: {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    color: "#111827",
    fontWeight: 600,
    fontSize: 12,
    cursor: "pointer",
  },

  sectionHeader: {
    padding: "8px 14px",
    fontSize: 12,
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },

  threadList: {
    overflowY: "auto",
    paddingBottom: 10,
  },

  threadItem: {
    padding: "12px 14px",
    cursor: "pointer",
    borderTop: "1px solid #f3f4f6",
  },

  threadItemActive: {
    background: "#f3f4f6",
  },

  threadRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  threadName: {
    fontWeight: 650,
    color: "#111827",
    fontSize: 14,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#ff4500",
    flex: "0 0 auto",
  },

  threadPreview: {
    marginTop: 6,
    fontSize: 12,
    color: "#6b7280",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  emptyThreads: {
    padding: 14,
    color: "#6b7280",
    fontSize: 13,
  },

  /* RIGHT PANEL */
  right: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "#ffffff",
  },

  header: {
    height: 52,
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    padding: "0 16px",
  },

  headerTitle: {
    fontWeight: 700,
    color: "#111827",
    fontSize: 14,
  },

  emptyChat: {
    padding: 20,
    color: "#6b7280",
    fontSize: 14,
  },

  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 16px 8px 16px",
    background: "#ffffff",
  },

  msgRow: {
    display: "flex",
    marginBottom: 10,
  },

  bubble: {
    maxWidth: "70%",
    borderRadius: 14,
    padding: "10px 12px",
    border: "1px solid #e5e7eb",
  },

  bubbleMine: {
    background: "#f3f4f6",
    color: "#111827",
  },

  bubbleTheirs: {
    background: "#ffffff",
    color: "#111827",
  },

  bubbleMeta: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 6,
  },

  bubbleUser: {
    fontWeight: 700,
    fontSize: 12,
    color: "#111827",
  },

  bubbleTime: {
    fontSize: 11,
    color: "#6b7280",
    whiteSpace: "nowrap",
  },

  bubbleText: {
    fontSize: 14,
    lineHeight: 1.35,
    wordBreak: "break-word",
  },

  /* COMPOSER */
  composerWrap: {
    borderTop: "1px solid #e5e7eb",
    padding: "10px 16px 14px 16px",
    background: "#ffffff",
  },

  composer: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },

  input: {
    width: "100%",
    height: 44,
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#f3f4f6",
    padding: "0 48px 0 14px",
    outline: "none",
    fontSize: 14,
    color: "#111827",
  },

  sendBtn: {
    position: "absolute",
    right: 8,
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: "none",
    background: "#e5e7eb",
    color: "#111827",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  helperText: {
    marginTop: 8,
    fontSize: 12,
    color: "#6b7280",
  },
};

export default Chat;
