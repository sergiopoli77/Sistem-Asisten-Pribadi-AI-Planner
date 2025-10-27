import React, { useState, useEffect, useRef } from "react";
import "../assets/chatai.css";
import { db } from "../config/firebase";
import { ref, push, set, update, remove } from "firebase/database";

const ChatAI = ({ initialChat }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const chatBoxRef = useRef(null);

  // Ambil username dari localStorage
  const username = localStorage.getItem("username") || "guest";

  // Auto scroll to bottom
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Generate session ID saat mount
  useEffect(() => {
    // If we have an incoming initialChat (user chose Continue), load it
    if (initialChat && initialChat.messages && initialChat.messages.length) {
      setMessages(initialChat.messages);
      setSessionId(initialChat.sessionId || initialChat.id || `session_${Date.now()}`);
      setCurrentChatId(initialChat.id || null);
      return;
    }

    // otherwise create a new session and show welcome
    const newSessionId = `session_${Date.now()}`;
    setSessionId(newSessionId);
    setMessages([
      {
        sender: "ai",
        text: "👋 Halo! Saya AI Planner Assistant. Saya siap membantu Anda mengatur jadwal, memberikan rekomendasi waktu produktif, dan menjawab pertanyaan seputar perencanaan kegiatan Anda!",
        timestamp: new Date().toISOString(),
      },
    ]);
  }, [initialChat]);

  // Firebase reference untuk chat user
  const chatRef = ref(db, `chats/${username}`);

  // Simpan chat ke Firebase
  const saveChatToFirebase = async (newMessages) => {
    if (!sessionId) return;
    // Firebase Realtime Database disallows `undefined` values. Ensure we
    // remove any undefined properties (or replace them) before writing.
    const sanitizeForFirebase = (value) => {
      if (Array.isArray(value)) return value.map(sanitizeForFirebase);
      if (value && typeof value === "object") {
        const out = {};
        Object.keys(value).forEach((k) => {
          const v = value[k];
          if (v === undefined) return; // skip undefined properties
          out[k] = sanitizeForFirebase(v);
        });
        return out;
      }
      return value;
    };

    const safeMessages = newMessages.map((m) => sanitizeForFirebase(m));

    const chatData = {
      sessionId,
      date: new Date().toISOString(),
      messages: safeMessages,
      lastMessage: safeMessages[safeMessages.length - 1]?.text || "",
    };

    // If continuing an existing chat, update that record instead of pushing a new one
    try {
      if (currentChatId) {
        const existingRef = ref(db, `chats/${username}/${currentChatId}`);
        // update only messages/date/lastMessage to preserve metadata like title
        await update(existingRef, {
          messages: chatData.messages,
          date: chatData.date,
          lastMessage: chatData.lastMessage,
        });
        return;
      }
    } catch (e) {
      // fall back to push if update fails
      console.warn('Failed to update existing chat, falling back to push:', e);
    }

    const newChatRef = push(chatRef);
    set(newChatRef, chatData);
  };

  // helper: try extract text from backend AI response
  const extractTextFromAiResponse = (data) => {
    if (!data) return '';
    // if backend returned normalized ai.text
    if (typeof data.ai === 'string') return data.ai;
    if (data.ai && typeof data.ai === 'object') {
      // Common shapes
      try {
        // v1 style: candidates -> output -> content -> text
        const cand = data.ai.candidates?.[0];
        if (cand) {
          if (typeof cand === 'string') return cand;
          const text1 = cand.output?.[0]?.content?.[0]?.text || cand.output?.[0]?.content?.text;
          if (text1) return text1;
          const cont = cand.content || cand;
          if (typeof cont === 'string') return cont;
        }

        // direct output
        const out = data.ai.output?.[0]?.content?.text || data.ai.output?.[0]?.content;
        if (out) return out;
      } catch (e) {
        // ignore
      }
      // fallback to stringified
      return JSON.stringify(data.ai);
    }
    return '';
  };

  // parse lines like '⏰ 08:00 - Belajar React (2 jam)' or '08:00 - Activity (30 menit)'
  const parseSchedulesFromText = (text) => {
    if (!text) return [];
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const parsed = [];
    const timeLineRegex = /(?:.*?)(\d{1,2}:\d{2})\s*[-–—]\s*(.+?)(?:\s*\(([^)]+)\))?$/;

    for (const line of lines) {
      const m = line.match(timeLineRegex);
      if (m) {
        const time = m[1];
        const activity = m[2].trim();
        const duration = m[3] ? m[3].trim() : '1 jam';
        parsed.push({ time, activity, duration, priority: 'Sedang' });
      }
    }
    return parsed;
  };

  // Handle send message (calls backend AI, falls back to local generator)
  const handleSend = async () => {
    if (!input.trim()) return;

    const prompt = input.trim();

    const userMessage = {
      sender: 'user',
      text: prompt,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    // Try backend AI first
    try {
      // send last N messages as history so backend AI can use conversation context
      const HISTORY_LENGTH = 12;
      const historyToSend = newMessages.slice(-HISTORY_LENGTH).map((m) => ({ sender: m.sender, text: m.text }));

      const resp = await fetch('http://localhost:4000/api/ai/generate-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, username, history: historyToSend }),
      });

      if (!resp.ok) throw new Error(`AI service responded ${resp.status}`);
      const data = await resp.json();

      const aiText = data?.ai?.text || extractTextFromAiResponse(data) || JSON.stringify(data.ai || data);
      const parsedSchedules = data?.ai?.parsedSchedules?.length ? data.ai.parsedSchedules : parseSchedulesFromText(aiText);

  // No auto-add: we always keep manual add option when parsedSchedules exist.

      const aiMessage = {
        sender: 'ai',
        text: aiText,
        timestamp: new Date().toISOString(),
        // always offer manual add button when parsed schedules exist
        actions: parsedSchedules.length ? ['Tambahkan ke Jadwal'] : [],
        parsedSchedules,
      };

      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);
      setIsTyping(false);

      // Save chat to Firebase
      saveChatToFirebase(finalMessages);

      // NOTE: we intentionally DO NOT auto-save schedules anymore.
      // The AI will always show a 'Tambahkan ke Jadwal' button when parsedSchedules exist.
    } catch (err) {
        console.warn('AI backend error:', err);
        const errorText = '⚠️ Maaf, layanan AI sedang bermasalah. Silakan coba lagi beberapa saat.';
        const aiMessage = {
          sender: 'ai',
          text: errorText,
          timestamp: new Date().toISOString(),
          actions: [],
          parsedSchedules: [],
        };

        const finalMessages = [...newMessages, aiMessage];
        setMessages(finalMessages);
        setIsTyping(false);
        // Save the chat containing the error message so user has context
        saveChatToFirebase(finalMessages);
    }
  };

  // Generate AI Response dengan konteks lebih baik
  // NOTE: generateAiResponse removed - using pure AI backend. Local fallback responses were removed.

  // Simpan jadwal AI ke Firebase
  const saveSchedulesToFirebase = (schedules) => {
    const scheduleRef = ref(db, `schedules/${username}`);
    const today = new Date().toISOString().split("T")[0];

    schedules.forEach((item) => {
      const scheduleData = {
        kegiatan: item.activity,
        tanggal: today,
        waktuMulai: item.time,
        waktuSelesai: calculateEndTime(item.time, item.duration),
        lokasi: "Tidak ditentukan",
        prioritas: item.priority || "Sedang",
        catatan: "Dibuat oleh AI Assistant",
        status: "Belum Dilaksanakan",
        createdAt: new Date().toISOString(),
        createdBy: "AI",
      };

      const newRef = push(scheduleRef);
      set(newRef, scheduleData);
    });
  };

  // Hitung waktu selesai
  const calculateEndTime = (startTime, duration) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const durationMinutes = parseDuration(duration);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
  };

  // Parse duration string
  const parseDuration = (duration) => {
    if (duration.includes("jam")) {
      const hours = parseFloat(duration);
      return hours * 60;
    }
    if (duration.includes("menit")) {
      return parseFloat(duration);
    }
    return 60; // default 1 jam
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  // Quick suggestions
  const quickSuggestions = [
    "Buatkan jadwal belajar",
    "Rekomendasi waktu olahraga",
    "Tips produktif",
    "Jadwal meeting",
  ];

  const handleQuickSuggestion = (suggestion) => {
    setInput(suggestion);
  };

  return (
    <div className="chat-ai-container">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-content">
          <div className="chat-header-icon">
            <div className="ai-avatar">🤖</div>
            <div className="status-indicator"></div>
          </div>
          <div className="chat-header-text">
            <h1>AI Planner Assistant</h1>
            <p className="chat-subtitle">
              <span className="status-dot">●</span> Online - Siap membantu Anda
            </p>
          </div>
        </div>
        <div className="chat-stats">
          <div className="stat-item">
            <span className="stat-icon">💬</span>
            <span className="stat-value">{messages.length}</span>
            <span className="stat-label">Pesan</span>
          </div>
          {/* New Chat button removed per request */}
          <div className="stat-item stat-action">
            <button
              className="btn-clear-chat"
              onClick={async () => {
                  if (!messages || messages.length === 0) return;
                  const ok = window.confirm('Hapus percakapan saat ini? Ini akan mengosongkan chat pada tampilan.');
                  if (!ok) return;

                  // If this chat was persisted remotely, remove it so it doesn't reappear
                  if (currentChatId) {
                    try {
                      const existingRef = ref(db, `chats/${username}/${currentChatId}`);
                      await remove(existingRef);
                    } catch (e) {
                      console.warn('Failed to remove existing chat from Firebase:', e);
                      // proceed with local reset even if remote delete fails
                    }
                  }

                  // reset chat locally
                  const newSessionId = `session_${Date.now()}`;
                  setSessionId(newSessionId);
                  setCurrentChatId(null);
                  setMessages([
                    {
                      sender: 'ai',
                      text: '👋 Halo! Saya AI Planner Assistant. Saya siap membantu Anda mengatur jadwal dan menjawab pertanyaan Anda.',
                      timestamp: new Date().toISOString(),
                    },
                  ]);
                }}
              title="Clear conversation"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Quick Suggestions */}
      {messages.length <= 2 && (
        <div className="quick-suggestions">
          <p className="suggestions-title">💡 Coba tanyakan:</p>
          <div className="suggestions-grid">
            {quickSuggestions.map((suggestion, index) => (
              <button
                key={index}
                className="suggestion-chip"
                onClick={() => handleQuickSuggestion(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Box */}
      <div className="chat-box" ref={chatBoxRef}>
        {messages.map((msg, msgIndex) => (
          <div key={msgIndex} className={`chat-message ${msg.sender}`}>
            {msg.sender === "ai" && (
              <div className="message-avatar">
                <div className="bot-icon">🤖</div>
              </div>
            )}

            <div className="message-content">
              <div className="message-bubble">
                <p className="message-text">
                  {msg.text.split("\n").map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < msg.text.split("\n").length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </p>

                {msg.actions && (
                  <div className="message-actions">
                    {msg.actions.map((action, actIndex) => {
                      if (action === 'Tambahkan ke Jadwal') {
                        return (
                          <button
                            key={actIndex}
                            className="action-btn"
                            onClick={() => {
                              const parsed = msg.parsedSchedules || [];
                              if (!parsed.length) {
                                alert('Tidak ada jadwal terdeteksi untuk ditambahkan.');
                                return;
                              }
                              // save schedules to Firebase
                              saveSchedulesToFirebase(parsed);

                              // update the message to remove the action and add confirmation
                              setMessages((prev) => {
                                const cp = [...prev];
                                const target = { ...(cp[msgIndex] || {}) };
                                target.actions = [];
                                target.text = (target.text || '') + '\n\n✅ Jadwal berhasil ditambahkan. Cek menu Jadwal.';
                                cp[msgIndex] = target;
                                // persist updated chat
                                try { saveChatToFirebase(cp); } catch (e) { /* ignore */ }
                                return cp;
                              });

                              alert('✅ Jadwal berhasil ditambahkan. Cek menu Jadwal.');
                            }}
                          >
                            {action}
                          </button>
                        );
                      }

                      return (
                        <button key={actIndex} className="action-btn">
                          {action}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <span className="message-time">{formatTime(msg.timestamp)}</span>
            </div>

            {msg.sender === "user" && (
              <div className="message-avatar user-avatar">
                <div className="user-icon">
                  {username.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="chat-message ai">
            <div className="message-avatar">
              <div className="bot-icon">🤖</div>
            </div>
            <div className="message-content">
              <div className="message-bubble typing-indicator">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="chat-input-section">
        <div className="input-wrapper">
          <textarea
            className="chat-input"
            placeholder="💬 Tanyakan sesuatu pada AI Assistant..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows="1"
          />
          <button
            className={`send-btn ${input.trim() ? "active" : ""}`}
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
        <p className="input-hint">
          Tekan <kbd>Enter</kbd> untuk kirim • <kbd>Shift + Enter</kbd> untuk baris baru
        </p>
      </div>
    </div>
  );
};
export default ChatAI;