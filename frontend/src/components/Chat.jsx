import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_URL } from "./config.jsx";

const Chat = ({ currentUser }) => {
  const { chatId } = useParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedChat, setSelectedChat] = useState(chatId || null);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!currentUser?.username) return;
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useEffect(() => {
    if (selectedChat) fetchMessages(selectedChat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat]);

  useEffect(() => {
    if (chatId) setSelectedChat(chatId);
  }, [chatId]);

  const selectedConversation = useMemo(() => {
    if (!selectedChat) return null;
    return conversations.find((c) => c._id === selectedChat) || null;
  }, [conversations, selectedChat]);

  const otherUsername =
    selectedConversation?.otherUser?.username ||
    selectedConversation?.otherUser?.profile?.username ||
    "Unknown";

  const scrollToBottom = (smooth = true) => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
      });
    }, 50);
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch(
        `${API_URL}/chats?username=${encodeURIComponent(currentUser.username)}`
      );
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setConversations([]);
    }
  };

  const fetchMessages = async (id) => {
    try {
      const res = await fetch(`${API_URL}/chats/${id}/messages`); // ✅ no trailing space
      const data = await res.json(); // ✅ correct

      setMessages(Array.isArray(data) ? data : []);

      // mark read
      await fetch(`${API_URL}/chats/${id}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser.username }),
      });

      // refresh conversations
      fetchConversations();
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
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

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  // Refresh button: same functionality, only styled
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

  if (!currentUser)
    return <div style={{ padding: 20 }}>Please log in to use chats.</div>;

  return (
    <div style={ui.page}>
      <div style={ui.shell}>
        {/* Top Bar (Reddit-like) */}
        <div style={ui.topBar}>
          <div style={ui.topLeft}>
            <div style={ui.redditDot} aria-hidden="true" />
            <div style={ui.topTitle}>Chats</div>

            <div style={ui.topIcons}>
              <button style={ui.iconBtn} title="New chat" type="button">
                ✉️
              </button>
              <button style={ui.iconBtn} title="Options" type="button">
                ⚙️
              </button>
              <button style={ui.iconBtn} title="More" type="button">
                ⋯
              </button>
            </div>
          </div>

          <div style={ui.topCenter}>
            {selectedChat ? (
              <div style={ui.topUser}>
                <div style={ui.avatarSmall}>
                  {(otherUsername || "U").charAt(0).toUpperCase()}
                </div>
                <div style={ui.topUserName}>{otherUsername}</div>
              </div>
            ) : (
              <div style={ui.topCenterEmpty} />
            )}
          </div>

          <div style={ui.topRight} />
        </div>

        {/* Body */}
        <div style={ui.body}>
          {/* Left: Threads */}
          <aside style={ui.sidebar}>
            <div style={ui.sidebarHeader}>
              <button
                type="button"
                title="Back"
                style={ui.backBtn}
                onClick={() => {
                  setSelectedChat(null);
                  navigate("/chats");
                }}
              >
                ←
              </button>

              <div style={ui.sidebarHeaderTitle}>Threads</div>

              {/* Refresh (same functionality, better shape) */}
              <button
                type="button"
                onClick={handleRefresh}
                style={ui.refreshBtn}
                title="Refresh"
              >
                ⟳
              </button>
            </div>

            <div style={ui.threadList}>
              {conversations.length === 0 ? (
                <div style={ui.emptyThreads}>No threads yet.</div>
              ) : (
                conversations.map((c) => {
                  const active = selectedChat === c._id;
                  const name = c.otherUser?.username || "Unknown";
                  return (
                    <div
                      key={c._id}
                      onClick={() => {
                        setSelectedChat(c._id);
                        navigate(`/chats/${c._id}`);
                      }}
                      style={{
                        ...ui.threadRow,
                        ...(active ? ui.threadRowActive : {}),
                      }}
                    >
                      <div style={ui.threadRowMain}>
                        <div style={ui.threadName}>{name}</div>
                        {c.unread && (
                          <div style={ui.unreadDot} title="Unread" />
                        )}
                      </div>

                      <div style={ui.threadLast}>
                        {c.lastMessage || "No messages yet"}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* Right: Conversation */}
          <main style={ui.main}>
            {!selectedChat ? (
              <div style={ui.selectHint}>
                Select a thread to start messaging.
              </div>
            ) : (
              <>
                <div style={ui.messagesArea}>
                  {messages.map((m) => {
                    const mine = m.senderUsername === currentUser.username;
                    return (
                      <div
                        key={m._id}
                        style={{
                          ...ui.msgRow,
                          justifyContent: mine ? "flex-end" : "flex-start",
                        }}
                      >
                        <div
                          style={{
                            ...ui.bubble,
                            ...(mine ? ui.bubbleMine : ui.bubbleTheirs),
                          }}
                        >
                          <div style={ui.bubbleName}>{m.senderUsername}</div>
                          <div style={ui.bubbleText}>{m.content}</div>
                          <div style={ui.bubbleTime}>
                            {new Date(m.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Bottom Composer (Reddit-like) */}
                <div style={ui.composerWrap}>
                  {messages.length === 0 && (
                    <div style={ui.invitePill}>
                      Send an invite message to start chatting! 👋
                    </div>
                  )}

                  <div style={ui.composer}>
                    <input
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={handleInputKeyDown} // ✅ Enter sends
                      placeholder="Message"
                      style={ui.input}
                    />

                    <button
                      onClick={handleSend}
                      type="button"
                      style={{
                        ...ui.sendBtn,
                        ...(text.trim() ? {} : ui.sendBtnDisabled),
                      }}
                      title="Send"
                      aria-label="Send"
                      disabled={!text.trim()}
                    >
                      {/* Paper-plane style */}
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          d="M3 11.5L21 3L12.5 21L11 13L3 11.5Z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

const ui = {
  page: {
    width: "100%",
    background: "#ffffff",
    padding: "16px",
  },
  shell: {
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    overflow: "hidden",
    background: "#ffffff",
    height: "calc(100vh - 120px)",
    minHeight: "560px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
  },

  topBar: {
    height: "52px",
    display: "grid",
    gridTemplateColumns: "340px 1fr 260px",
    alignItems: "center",
    background: "#ffffff",
    borderBottom: "1px solid #e5e7eb",
    padding: "0 12px",
  },
  topLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  redditDot: {
    width: 18,
    height: 18,
    borderRadius: 999,
    background: "#ff4500",
  },
  topTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#111827",
  },
  topIcons: {
    marginLeft: 12,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  iconBtn: {
    height: 30,
    width: 30,
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    fontSize: 14,
    color: "#111827",
  },

  topCenter: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingLeft: 8,
  },
  topCenterEmpty: {
    height: 1,
  },
  topUser: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  avatarSmall: {
    width: 26,
    height: 26,
    borderRadius: 999,
    background: "#f3f4f6",
    border: "1px solid #e5e7eb",
    display: "grid",
    placeItems: "center",
    color: "#111827",
    fontWeight: 700,
    fontSize: 12,
  },
  topUserName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#111827",
  },
  topRight: {},

  body: {
    display: "grid",
    gridTemplateColumns: "340px 1fr",
    height: "calc(100% - 52px)",
  },

  sidebar: {
    borderRight: "1px solid #e5e7eb",
    background: "#ffffff",
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  sidebarHeader: {
    height: 48,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 12px",
  },
  backBtn: {
    height: 32,
    width: 32,
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    cursor: "pointer",
    fontSize: 16,
    color: "#111827",
    display: "grid",
    placeItems: "center",
  },
  sidebarHeaderTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#111827",
    flex: 1,
  },
  refreshBtn: {
    height: 32,
    width: 32,
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    cursor: "pointer",
    color: "#111827",
    display: "grid",
    placeItems: "center",
    fontSize: 16,
  },

  threadList: {
    overflowY: "auto",
    padding: "4px 6px 8px",
  },
  emptyThreads: {
    padding: "12px",
    color: "#6b7280",
    fontSize: 13,
  },
  threadRow: {
    padding: "10px 10px",
    borderRadius: 10,
    cursor: "pointer",
    userSelect: "none",
  },
  threadRowActive: {
    background: "#f3f4f6",
  },
  threadRowMain: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  threadName: {
    fontSize: 13,
    fontWeight: 600,
    color: "#111827",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: "#2563eb",
    flexShrink: 0,
  },
  threadLast: {
    marginTop: 6,
    fontSize: 12,
    color: "#6b7280",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  main: {
    background: "#ffffff",
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  selectHint: {
    flex: 1,
    display: "grid",
    placeItems: "center",
    color: "#6b7280",
    fontSize: 14,
  },
  messagesArea: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 16px 0",
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
    background: "#e5f0ff",
    color: "#111827",
  },
  bubbleTheirs: {
    background: "#f3f4f6",
    color: "#111827",
  },
  bubbleName: {
    fontSize: 11,
    fontWeight: 700,
    color: "#374151",
    marginBottom: 4,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: "18px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  bubbleTime: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 6,
  },

  composerWrap: {
    padding: "12px 16px 16px",
    borderTop: "1px solid #e5e7eb",
    background: "#ffffff",
  },
  invitePill: {
    background: "#eef0f2",
    borderRadius: 999,
    padding: "10px 12px",
    fontSize: 12,
    color: "#374151",
    marginBottom: 10,
    border: "1px solid #e5e7eb",
  },
  composer: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#eef0f2",
    border: "1px solid #e5e7eb",
    borderRadius: 999,
    padding: "8px 10px",
  },
  input: {
    flex: 1,
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: 13,
    padding: "6px 8px",
    color: "#111827",
  },
  sendBtn: {
    height: 34,
    width: 34,
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    color: "#6b7280",
  },
  sendBtnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
};

export default Chat;
