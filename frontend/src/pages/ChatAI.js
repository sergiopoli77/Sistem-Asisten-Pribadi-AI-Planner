import React, { useState, useEffect, useRef } from "react";
import "../assets/chatai.css";
import { db } from "../config/firebase";
import { ref, push, set } from "firebase/database";

const ChatAI = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "👋 Halo! Saya AI Planner Assistant. Saya siap membantu Anda mengatur jadwal, memberikan rekomendasi waktu produktif, dan menjawab pertanyaan seputar perencanaan kegiatan Anda!",
      timestamp: new Date().toISOString(),
    },
  ]);
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
    const newSessionId = `session_${Date.now()}`;
    setSessionId(newSessionId);
  }, []);

  // Firebase reference untuk chat user
  const chatRef = ref(db, `chats/${username}`);

  // Simpan chat ke Firebase
  const saveChatToFirebase = (newMessages) => {
    if (!sessionId) return;

    const chatData = {
      sessionId,
      date: new Date().toISOString(),
      messages: newMessages,
      lastMessage: newMessages[newMessages.length - 1].text,
    };

    const newChatRef = push(chatRef);
    set(newChatRef, chatData);
  };

  // Handle send message
  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = {
      sender: "user",
      text: input.trim(),
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    // Simulasi delay AI response
    setTimeout(() => {
      const aiReply = generateAiResponse(input.trim());
      const aiMessage = {
        sender: "ai",
        text: aiReply.text,
        timestamp: new Date().toISOString(),
        actions: aiReply.actions,
      };

      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);
      setIsTyping(false);

      // Simpan percakapan ke Firebase
      saveChatToFirebase(finalMessages);

      // Jika AI generate jadwal, simpan ke schedules
      if (aiReply.schedules) {
        saveSchedulesToFirebase(aiReply.schedules);
      }
    }, 1500);
  };

  // Generate AI Response dengan konteks lebih baik
  const generateAiResponse = (message) => {
    const lower = message.toLowerCase();

    // Jadwal Belajar
    if (lower.includes("jadwal belajar") || lower.includes("buat jadwal belajar")) {
      const schedules = [
        { time: "08:00", duration: "2 jam", activity: "Belajar React & JavaScript", priority: "Tinggi" },
        { time: "10:30", duration: "30 menit", activity: "Istirahat & Snack", priority: "Rendah" },
        { time: "11:00", duration: "2 jam", activity: "Praktik Coding Project", priority: "Tinggi" },
        { time: "14:00", duration: "1 jam", activity: "Review Materi & Catatan", priority: "Sedang" },
      ];

      return {
        text: `✅ Sempurna! Saya sudah membuatkan jadwal belajar untuk Anda:\n\n${schedules
          .map((s) => `⏰ ${s.time} - ${s.activity} (${s.duration})`)
          .join("\n")}\n\n📅 Jadwal ini sudah otomatis ditambahkan ke daftar kegiatan Anda. Anda bisa melihatnya di menu Jadwal!`,
        schedules,
        actions: ["Lihat Jadwal", "Ubah Waktu"],
      };
    }

    // Olahraga
    if (lower.includes("olahraga") || lower.includes("workout")) {
      const schedules = [
        { time: "06:00", duration: "45 menit", activity: "Jogging Pagi", priority: "Sedang" },
        { time: "16:00", duration: "1 jam", activity: "Gym / Home Workout", priority: "Sedang" },
        { time: "19:00", duration: "30 menit", activity: "Yoga & Stretching", priority: "Rendah" },
      ];

      return {
        text: `💪 Bagus! Ini jadwal olahraga yang saya rekomendasikan:\n\n${schedules
          .map((s) => `⏰ ${s.time} - ${s.activity} (${s.duration})`)
          .join("\n")}\n\n🏃 Konsistensi adalah kunci! Jadwal sudah ditambahkan untuk Anda.`,
        schedules,
      };
    }

    // Meeting/Rapat
    if (lower.includes("rapat") || lower.includes("meeting")) {
      return {
        text: "📊 Untuk meeting, saya sarankan:\n\n⏰ Pagi (09:00-11:00): Produktivitas tinggi, cocok untuk diskusi strategis\n⏰ Siang (13:00-14:00): Post-lunch meeting, lebih santai\n⏰ Sore (16:00-17:00): Wrap up meeting harian\n\nWaktu mana yang paling cocok untuk Anda?",
      };
    }

    // Produktivitas
    if (lower.includes("produktif") || lower.includes("fokus")) {
      return {
        text: "🎯 Tips produktivitas dari AI Planner:\n\n1️⃣ Gunakan teknik Pomodoro (25 menit kerja, 5 menit istirahat)\n2️⃣ Prioritaskan 3 tugas penting setiap hari\n3️⃣ Hindari multitasking\n4️⃣ Blokir waktu untuk deep work\n5️⃣ Istirahat yang cukup!\n\nMau saya buatkan jadwal berbasis Pomodoro?",
      };
    }

    // Libur/Break
    if (lower.includes("libur") || lower.includes("istirahat") || lower.includes("break")) {
      return {
        text: "🌴 Istirahat sangat penting! Beberapa ide:\n\n✨ Weekend getaway\n📚 Me-time dengan hobi\n👨‍👩‍👧 Quality time keluarga\n🎮 Gaming & entertainment\n\nSaya akan menandai waktu libur Anda. Kapan Anda ingin istirahat?",
      };
    }

    // Terima kasih
    if (lower.includes("terima kasih") || lower.includes("thanks")) {
      return {
        text: "😊 Sama-sama! Senang bisa membantu Anda. Jangan ragu untuk bertanya kapan saja!",
      };

    }
    // Bantuan/Help
    if (lower.includes("bantuan") || lower.includes("help") || lower.includes("bisa apa")) {
      return {
        text: "🤖 Saya bisa membantu Anda dengan:\n\n📅 Membuat jadwal kegiatan otomatis\n⏰ Rekomendasi waktu optimal untuk aktivitas\n💡 Tips produktivitas & time management\n📊 Analisis pola kegiatan Anda\n🎯 Prioritas tugas harian\n\nApa yang bisa saya bantu hari ini?",
      };
    }

    // Default response
    return {
      text: "🤔 Hmm, saya belum sepenuhnya memahami maksud Anda. Bisa dijelaskan lebih detail?\n\nContoh yang bisa saya bantu:\n• \"Buatkan jadwal belajar\"\n• \"Rekomendasi waktu olahraga\"\n• \"Jadwal meeting minggu ini\"\n• \"Tips produktif\"",
    };
  };

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
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.sender}`}>
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
                    {msg.actions.map((action, i) => (
                      <button key={i} className="action-btn">
                        {action}
                      </button>
                    ))}
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