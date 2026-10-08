import { useState, useRef, useEffect } from "react";
import "./App.css";

const INITIAL_MESSAGE = {
  sender: "bot",
  text: "Hello! 👋 I'm the MCE College AI Assistant. Ask me anything about Malnad College of Engineering, Hassan!",
};

function App() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (messageText) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || isLoading) return;

    const userMessage = {
      sender: "user",
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      let response;
      try {
        response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: textToSend }),
        });
      } catch {
        // Fallback to direct backend URL if proxy isn't available
        response = await fetch("http://localhost:5000/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: textToSend }),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: data.reply || "Sorry, I couldn't process your request.",
          image: data.image || null,
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Sorry, I cannot connect to the backend server right now. Please ensure the backend is running on http://localhost:5000.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const resetChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setInput("");
  };

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <div className="logo-icon">M</div>
          <div>
            <h1>MCE AI Assistant</h1>
            <p>Malnad College of Engineering, Hassan</p>
          </div>
        </div>

        <div className="header-actions">
          <button className="clear-btn" onClick={resetChat} title="Reset chat">
            🔄 New Chat
          </button>
          <div className="status">
            <span></span>
            Online
          </div>
        </div>
      </header>

      <main className="chat-container">
        {messages.length === 1 && (
          <div className="welcome">
            <div className="bot-icon">🤖</div>
            <h2>Welcome to MCE AI Assistant</h2>
            <p>Ask me anything about Malnad College of Engineering, Hassan.</p>

            <div className="suggestions">
              <button
                onClick={() => handleSend("What courses are offered at MCE?")}
              >
                🎓 Courses
              </button>
              <button
                onClick={() => handleSend("What is the admission process?")}
              >
                📝 Admissions
              </button>
              <button
                onClick={() => handleSend("Tell me about placements")}
              >
                💼 Placements
              </button>
              <button
                onClick={() => handleSend("Tell me about hostel facilities")}
              >
                🏠 Hostel
              </button>
            </div>
          </div>
        )}

        <div className="messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message-row ${message.sender}`}
            >
              {message.sender === "bot" && (
                <div className="small-bot-icon">🤖</div>
              )}

              <div className="message">
                {message.text}

                {message.image && (
                  <img
                    src={message.image}
                    alt={
                      message.image.includes("/admission/")
                        ? "MCE Admission Route 2026-27"
                        : "MCE Boys Hostel weekly menu"
                    }
                    className={
                      message.image.includes("/admission/")
                        ? "admission-route-image"
                        : "hostel-menu-image"
                    }
                  />
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message-row bot">
              <div className="small-bot-icon">🤖</div>
              <div className="message typing-indicator">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      <div className="input-area">
        <div className="input-box">
          <input
            type="text"
            placeholder="Ask anything about MCE Hassan (Courses, Admissions, Placements, Hostel)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />

          <button
            className="send-button"
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
          >
            ➤
          </button>
        </div>

        <p className="disclaimer">
          MCE AI Assistant • Official Information for Malnad College of Engineering, Hassan
        </p>
      </div>
    </div>
  );
}

export default App;