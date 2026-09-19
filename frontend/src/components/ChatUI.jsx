import { useState, useRef, useEffect } from "react";

// Point this at your FastAPI backend (adjust for dev vs. production).
const API_BASE_URL = "http://localhost:8000";

/**
 * broGPT chat UI.
 *
 * Talks to POST {API_BASE_URL}/chat with { query, chat_history }.
 * Expects back either:
 *   { type: "message", reply: "..." }
 *   { type: "plan", data: { topic, summary, sources, tools_used, schedule } }
 *
 * chat_history is kept as an array of [role, content] pairs, matching
 * what agent_setup.py's prompt placeholder expects.
 */
export default function ChatUI() {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      type: "message",
      content:
        "Yo, what's up bro! Tell me your goal and let's build you a plan.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [planReady, setPlanReady] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function sendMessage() {
    const query = input.trim();
    if (!query || loading || planReady) return;

    const chat_history = messages
      .filter((m) => m.type === "message")
      .map((m) => [m.role === "user" ? "human" : "ai", m.content]);

    setMessages((prev) => [...prev, { role: "user", type: "message", content: query }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, chat_history }),
      });

      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();

      if (data.type === "plan") {
        setMessages((prev) => [...prev, { role: "ai", type: "plan", content: data.data }]);
        setPlanReady(true);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "ai", type: "message", content: data.reply },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          type: "message",
          content: "Connection dropped, bro. Check the backend and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="bro-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap');

        .bro-root {
          --bg: #121210;
          --panel: #1b1b17;
          --bubble-ai: #24241e;
          --accent: #d6ff3f;
          --accent-warm: #ff5a36;
          --text: #f1eee6;
          --muted: #8c897c;
          --hairline: #33322a;

          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 480px;
          max-width: 620px;
          margin: 0 auto;
          background: var(--bg);
          color: var(--text);
          font-family: 'Inter', system-ui, sans-serif;
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid var(--hairline);
        }

        .bro-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          padding: 18px 22px 14px;
          border-bottom: 1px solid var(--hairline);
          background: var(--panel);
        }

        .bro-wordmark {
          font-family: 'Bebas Neue', 'Inter', sans-serif;
          font-size: 28px;
          letter-spacing: 0.04em;
          color: var(--accent);
          line-height: 1;
        }

        .bro-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--muted);
        }

        .bro-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: ${'var(--accent)'};
          box-shadow: 0 0 0 3px rgba(214, 255, 63, 0.15);
        }

        .bro-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .bro-bubble {
          max-width: 80%;
          padding: 11px 15px;
          font-size: 14.5px;
          line-height: 1.5;
          border-radius: 3px;
          white-space: pre-wrap;
        }

        .bro-bubble.ai {
          align-self: flex-start;
          background: var(--bubble-ai);
          border: 1px solid var(--hairline);
        }

        .bro-bubble.user {
          align-self: flex-end;
          background: transparent;
          border: 1px solid var(--accent);
          color: var(--text);
        }

        .bro-typing {
          align-self: flex-start;
          display: flex;
          gap: 4px;
          padding: 13px 15px;
        }

        .bro-typing span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--muted);
          animation: bro-bounce 1.1s infinite ease-in-out;
        }
        .bro-typing span:nth-child(2) { animation-delay: 0.15s; }
        .bro-typing span:nth-child(3) { animation-delay: 0.3s; }

        @keyframes bro-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-4px); opacity: 1; }
        }

        .bro-plan {
          align-self: stretch;
          border: 1px solid var(--accent);
          background: var(--panel);
        }

        .bro-plan-head {
          padding: 16px 18px 12px;
          border-bottom: 1px solid var(--hairline);
        }

        .bro-plan-topic {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px;
          letter-spacing: 0.02em;
          color: var(--accent);
          margin: 0 0 6px;
        }

        .bro-plan-summary {
          font-size: 13.5px;
          color: var(--muted);
          margin: 0;
          line-height: 1.5;
        }

        .bro-plan-row {
          display: grid;
          grid-template-columns: 96px 1fr;
          gap: 14px;
          padding: 12px 18px;
          border-bottom: 1px solid var(--hairline);
          font-size: 13.5px;
        }
        .bro-plan-row:last-child { border-bottom: none; }

        .bro-plan-day {
          color: var(--accent-warm);
          font-weight: 600;
        }

        .bro-plan-desc {
          color: var(--text);
          line-height: 1.5;
        }

        .bro-inputbar {
          display: flex;
          gap: 10px;
          padding: 14px 16px;
          border-top: 1px solid var(--hairline);
          background: var(--panel);
        }

        .bro-input {
          flex: 1;
          background: var(--bg);
          border: 1px solid var(--hairline);
          border-radius: 3px;
          color: var(--text);
          padding: 10px 13px;
          font-size: 14px;
          font-family: inherit;
          resize: none;
          outline: none;
        }
        .bro-input:focus {
          border-color: var(--accent);
        }
        .bro-input::placeholder { color: var(--muted); }

        .bro-send {
          background: var(--accent-warm);
          color: #14140d;
          border: none;
          border-radius: 3px;
          padding: 0 20px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: filter 0.15s ease;
        }
        .bro-send:hover:not(:disabled) { filter: brightness(1.08); }
        .bro-send:disabled {
          background: var(--hairline);
          color: var(--muted);
          cursor: not-allowed;
        }
      `}</style>

      <div className="bro-header">
        <span className="bro-wordmark">broGPT</span>
        <span className="bro-status">
          <span className="bro-status-dot" />
          {planReady ? "plan delivered" : "session active"}
        </span>
      </div>

      <div className="bro-messages" ref={scrollRef}>
        {messages.map((m, i) =>
          m.type === "plan" ? (
            <div className="bro-plan" key={i}>
              <div className="bro-plan-head">
                <p className="bro-plan-topic">{m.content.topic}</p>
                <p className="bro-plan-summary">{m.content.summary}</p>
              </div>
              {Object.entries(m.content.schedule || {}).map(([day, desc]) => (
                <div className="bro-plan-row" key={day}>
                  <span className="bro-plan-day">{day}</span>
                  <span className="bro-plan-desc">{desc}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className={`bro-bubble ${m.role}`} key={i}>
              {m.content}
            </div>
          )
        )}

        {loading && (
          <div className="bro-typing">
            <span /><span /><span />
          </div>
        )}
      </div>

      <div className="bro-inputbar">
        <textarea
          className="bro-input"
          rows={1}
          placeholder={planReady ? "Plan's done, bro." : "Type your answer..."}
          value={input}
          disabled={planReady || loading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="bro-send"
          onClick={sendMessage}
          disabled={planReady || loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
