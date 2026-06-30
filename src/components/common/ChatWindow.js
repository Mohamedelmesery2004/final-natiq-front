import { useState, useRef, useEffect } from "react";
import "./ChatWindow.css";

export default function ChatWindow({
  messages = [],
  onSend,
  userName = "",
  userStatus = "Online",
  headerRight = null,
  currentUser = "agent",
}) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function handleSend(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;
    onSend?.(text);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="cw-container">
      <header className="cw-header">
        <div className="cw-header-left">
          <div className="cw-avatar">{initials || "?"}</div>
          <div className="cw-user-info">
            <span className="cw-user-name">{userName}</span>
            <span className="cw-user-status">{userStatus}</span>
          </div>
        </div>
        <div className="cw-header-right">{headerRight}</div>
      </header>

      <div className="cw-messages">
        {messages.map((msg) => {
          const sent = msg.from === currentUser;
          return (
            <div
              key={msg.id}
              className={`cw-row ${sent ? "cw-row-sent" : "cw-row-received"}`}
            >
              <div
                className={`cw-bubble ${sent ? "cw-bubble-sent" : "cw-bubble-received"}`}
              >
                <span className="cw-text">{msg.text}</span>
                {msg.time && <span className="cw-time">{msg.time}</span>}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form className="cw-input-bar" onSubmit={handleSend}>
        <textarea
          ref={textareaRef}
          className="cw-input"
          placeholder="Type a message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          type="submit"
          className={`cw-send-btn ${input.trim() ? "cw-send-active" : ""}`}
          disabled={!input.trim()}
          aria-label="Send message"
        >
          <svg
            className="cw-send-icon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2 .01 7z"
              fill="currentColor"
            />
          </svg>
        </button>
      </form>
    </div>
  );
}
