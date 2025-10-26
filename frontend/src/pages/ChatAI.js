import React, { useState, useEffect } from "react";
import "../assets/chatai.css";
import { db } from "../config/firebase";
import { ref, push, set, onValue } from "firebase/database";

const ChatAi = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Halo! Saya asisten perencana AI. Apa yang ingin Anda rencanakan hari ini?",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Ambil username dari localStorage (misal diset saat login)
  const username = localStorage.getItem("username") || "guest";

  // Firebase reference untuk chat user
  const chatRef = ref(db, `chats/${username}`);

  // Simpan chat ke Firebase
  const saveChatToFirebase = (newMessages) => {
    const newChat = {
      date: new Date().toISOString(),
      messages: newMessages,
    };
    push(chatRef, newChat);
  };

  // Simulasi AI Reply
  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const aiReply = generateAiPlanResponse(input);
      const newMessages = [...messages, userMessage, { sender: "ai", text: aiReply }];
      setMessages(newMessages);
      setIsTyping(false);

      // Simpan percakapan ke Firebase
      saveChatToFirebase(newMessages);
    }, 1200);
  };

  // Simulasi AI menghasilkan jadwal
  const generateAiPlanResponse = (message) => {
    const lower = message.toLowerCase();

    if (lower.includes("buatkan jadwal belajar")) {
      // Simulasi hasil jadwal
      const plan = [
        { time: "08:00", activity: "Belajar React" },
        { time: "10:00", activity: "Istirahat" },
        { time: "16:00", activity: "Olahraga sore" },
      ];

      // Simpan ke Firebase schedules
      saveAiPlanToFirebase(plan);
      return (
        "Baik! Saya sudah membuatkan jadwal:\n" +
        plan.map((p) => `${p.time} - ${p.activity}`).join("\n") +
        "\n\nJadwal ini sudah saya tambahkan ke daftar kegiatan Anda 📅"
      );
    } else if (lower.includes("rapat")) {
      return "Rapat bisa dijadwalkan pagi hari antara pukul 09.00–11.00 agar lebih produktif. Apakah waktu ini cocok?";
    } else if (lower.includes("libur")) {
      return "Baik, saya akan menandai hari tersebut sebagai hari libur dalam rencana Anda.";
    } else if (lower.includes("terima kasih")) {
      return "Sama-sama! Senang bisa membantu Anda menyusun rencana 😊";
    } else {
      return "Saya paham. Bisa Anda jelaskan lebih detail kegiatan atau waktu yang dimaksud?";
    }
  };

  // Simpan hasil jadwal AI ke Firebase schedules
  const saveAiPlanToFirebase = (plan) => {
    const scheduleRef = ref(db, `schedules/${username}`);
    plan.forEach((item) => {
      const newItem = {
        title: item.activity,
        startTime: `${new Date().toISOString().split("T")[0]}T${item.time}`,
        endTime: "",
        status: "Belum Dilaksanakan",
        createdAt: new Date().toISOString(),
      };
      const newRef = push(scheduleRef);
      set(newRef, newItem);
    });
  };

  return (
    <div className="chat-ai-container">
      <div className="chat-header">
        <h1>🤖 AI Planner</h1>
        <p className="chat-subtitle">
          Bicaralah dengan asisten AI untuk membantu menyusun rencana kegiatan Anda
        </p>
      </div>

      <div className="chat-box">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chat-message ${msg.sender === "user" ? "user" : "ai"}`}
          >
            <div className="message-bubble">
              {msg.sender === "ai" && <span className="bot-icon">🤖</span>}
              <p>
                {msg.text.split("\n").map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="chat-message ai">
            <div className="message-bubble thinking">
              <span className="bot-icon">🤖</span>
              <p>Sedang mengetik...</p>
            </div>
          </div>
        )}
      </div>

      <div className="chat-input-section">
        <input
          type="text"
          placeholder="Ketik pesan untuk AI Planner..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button className="send-btn" onClick={handleSend}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3v7l15 2-15 2z" />
          </svg>
          Kirim
        </button>
      </div>
    </div>
  );
};

export default ChatAi;
