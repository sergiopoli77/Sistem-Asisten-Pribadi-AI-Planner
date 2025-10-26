import React, { useEffect, useState } from "react";
import { getDatabase, ref, onValue, remove } from "firebase/database";
import "../assets/Riwayat.css";

const Riwayat = () => {
  const [chatList, setChatList] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  // currentUser akan dibaca dari localStorage (diset saat login)
  const [currentUser, setCurrentUser] = useState(null);
  const db = getDatabase();

  // Ambil username/uid dari localStorage saat komponen mount
  useEffect(() => {
    try {
      const u = localStorage.getItem("username");
      if (u) setCurrentUser(u);
      else {
        if (typeof window !== "undefined") {
          alert("Kamu belum login! Silakan masuk terlebih dahulu.");
          window.location.href = "/login";
        }
      }
    } catch (e) {
      console.warn("Gagal membaca localStorage untuk username:", e);
      if (typeof window !== "undefined") window.location.href = "/login";
    }
  }, []);

  // Ambil riwayat chat setelah currentUser tersedia
  useEffect(() => {
    if (!currentUser) return;

    const chatRef = ref(db, `chatHistory/${currentUser}`);
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const chats = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
        }));
        setChatList(chats);
      } else {
        setChatList([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, currentUser]);

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
  };

  const handleDeleteChat = (id) => {
    if (window.confirm("Yakin ingin menghapus riwayat chat ini?")) {
      remove(ref(db, `chatHistory/${currentUser}/${id}`));
      if (selectedChat?.id === id) setSelectedChat(null);
    }
  };

  if (loading) return <p>Memuat riwayat chat...</p>;

  return (
    <div className="riwayat-container">
      {/* Sidebar kiri */}
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h2>💬 Riwayat Chat</h2>
          <p className="subtitle">Lihat kembali percakapan dengan AI</p>
        </div>
        <div className="chat-list">
          {chatList.length === 0 ? (
            <p className="no-chat">Belum ada riwayat chat</p>
          ) : (
            chatList.map((chat) => (
              <div
                key={chat.id}
                className={`chat-item ${selectedChat?.id === chat.id ? "active" : ""}`}
                onClick={() => handleSelectChat(chat)}
              >
                <div className="chat-info">
                  <span className="chat-icon">🤖</span>
                  <div className="chat-meta">
                    <h4>{chat.title || "Chat tanpa judul"}</h4>
                    <p>{new Date(chat.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChat(chat.id);
                  }}
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Panel kanan */}
      <div className="chat-view">
        {selectedChat ? (
          <>
            <div className="chat-view-header">
              <h3>{selectedChat.title || "Percakapan Tanpa Judul"}</h3>
              <p>{new Date(selectedChat.date).toLocaleString()}</p>
            </div>
            <div className="chat-messages">
              {selectedChat.messages?.map((msg, index) => (
                <div
                  key={index}
                  className={`chat-bubble ${msg.sender === "user" ? "user" : "ai"}`}
                >
                  {msg.sender === "ai" && <span className="bot-icon">🤖</span>}
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="chat-empty">
            <p>Pilih salah satu chat untuk melihat isinya 📜</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Riwayat;
