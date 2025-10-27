import React, { useEffect, useState, useRef } from "react";
import { getDatabase, ref, onValue, remove, update } from "firebase/database";
import "../assets/Riwayat.css";
import ConfirmModal from "../components/ConfirmModal";

const RiwayatChat = () => {
  const [chatList, setChatList] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("all");
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const chatViewRef = useRef(null);
  const [showConfirmDeleteId, setShowConfirmDeleteId] = useState(null);
  const [showConfirmDeleteAll, setShowConfirmDeleteAll] = useState(false);

  const db = getDatabase();

  // Ambil username dari localStorage
  useEffect(() => {
    try {
      const u = localStorage.getItem("username");
      if (u) {
        setCurrentUser(u);
      } else {
        alert("Kamu belum login! Silakan masuk terlebih dahulu.");
        window.location.href = "/login";
      }
    } catch (e) {
      console.warn("Gagal membaca localStorage:", e);
      window.location.href = "/login";
    }
  }, []);

  // Ambil riwayat chat
  useEffect(() => {
    if (!currentUser) return;

    const chatRef = ref(db, `chats/${currentUser}`);
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const chats = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
        }));

        // Sort by date (newest first)
        chats.sort((a, b) => new Date(b.date) - new Date(a.date));
        setChatList(chats);
      } else {
        setChatList([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, currentUser]);

  // Auto scroll to bottom when chat selected
  useEffect(() => {
    if (chatViewRef.current) {
      chatViewRef.current.scrollTop = chatViewRef.current.scrollHeight;
    }
  }, [selectedChat]);

  // Handle select chat
  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setEditingChatId(null);
  };

  // Continue chat: dispatch event so Dashboard can switch to ChatAI with this chat
  const handleContinueChat = (chat, e) => {
    if (e) e.stopPropagation();
    try {
      // dispatch custom event
      window.dispatchEvent(new CustomEvent('continueChat', { detail: chat }));
      // also set a fallback in localStorage in case other tab needs it
      localStorage.setItem('continueChat', JSON.stringify(chat));
    } catch (err) {
      console.warn('Unable to dispatch continueChat event, using localStorage fallback', err);
      localStorage.setItem('continueChat', JSON.stringify(chat));
    }
  };

  // Handle delete chat
  const handleDeleteChat = (id, e) => {
    if (e) e.stopPropagation();
    setShowConfirmDeleteId(id);
  };

  const confirmDeleteChat = (id) => {
    try {
      remove(ref(db, `chats/${currentUser}/${id}`));
    } catch (err) {
      console.warn('Failed removing chat node:', err);
    }
    try {
      remove(ref(db, `chatHistory/${currentUser}/${id}`));
    } catch (err) {
      // ignore
    }
    if (selectedChat?.id === id) setSelectedChat(null);
    setShowConfirmDeleteId(null);
  };

  // Handle delete all chats
  const handleDeleteAll = () => {
    if (chatList.length === 0) {
      alert("Tidak ada chat untuk dihapus");
      return;
    }

    // show in-app confirmation modal instead of native confirm
    setShowConfirmDeleteAll(true);
  };

  const confirmDeleteAll = () => {
    setShowConfirmDeleteAll(false);
    // remove everything under chats and chatHistory for this user
    try {
      remove(ref(db, `chats/${currentUser}`));
    } catch (err) {
      console.warn('Failed to remove chats root:', err);
      // fallback: remove one-by-one
      chatList.forEach((chat) => {
        try { remove(ref(db, `chats/${currentUser}/${chat.id}`)); } catch (e) {}
      });
    }
    try {
      remove(ref(db, `chatHistory/${currentUser}`));
    } catch (err) {
      console.warn('Failed to remove chatHistory root:', err);
    }
    setSelectedChat(null);
    alert("✅ Semua riwayat chat berhasil dihapus!");
  };

  // Handle edit chat title
  const handleEditTitle = (chat) => {
    setEditingChatId(chat.id);
    setEditTitle(chat.title || generateChatTitle(chat));
  };

  // Save edited title
  const handleSaveTitle = async (chatId) => {
    if (!editTitle.trim()) {
      alert("Judul tidak boleh kosong!");
      return;
    }

    try {
      await update(ref(db, `chats/${currentUser}/${chatId}`), {
        title: editTitle.trim(),
      });
      setEditingChatId(null);
    } catch (error) {
      console.error("Error updating title:", error);
      alert("Gagal mengubah judul!");
    }
  };

  // Generate title from first message
  const generateChatTitle = (chat) => {
    if (chat.messages && chat.messages.length > 0) {
      const firstUserMessage = chat.messages.find((m) => m.sender === "user");
      if (firstUserMessage) {
        return firstUserMessage.text.substring(0, 40) + "...";
      }
    }
    return "Percakapan tanpa judul";
  };

  // Filter chats
  const filteredChats = chatList.filter((chat) => {
    // Search filter
    const title = chat.title || generateChatTitle(chat);
    const matchSearch = title.toLowerCase().includes(searchTerm.toLowerCase());

    // Date filter
    let matchDate = true;
    if (filterDate !== "all") {
      const chatDate = new Date(chat.date);
      const today = new Date();
      const diffTime = today - chatDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (filterDate === "today") {
        matchDate = diffDays === 0;
      } else if (filterDate === "week") {
        matchDate = diffDays <= 7;
      } else if (filterDate === "month") {
        matchDate = diffDays <= 30;
      }
    }

    return matchSearch && matchDate;
  });

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format relative time
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 1) return "Baru saja";
    if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays === 1) return "Kemarin";
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  // Export chat
  const handleExportChat = () => {
    if (!selectedChat) return;

    const chatText = selectedChat.messages
      .map((msg) => {
        const sender = msg.sender === "user" ? "Anda" : "AI Assistant";
        return `[${sender}]: ${msg.text}`;
      })
      .join("\n\n");

    const blob = new Blob([chatText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${selectedChat.id}.txt`;
    a.click();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Memuat riwayat chat...</p>
      </div>
    );
  }

  return (
    <div className="riwayat-container">
      {/* Confirm modals */}
      <ConfirmModal
        open={!!showConfirmDeleteId}
        title="Hapus Riwayat"
        message={`Yakin ingin menghapus riwayat chat ini?`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={() => confirmDeleteChat(showConfirmDeleteId)}
        onCancel={() => setShowConfirmDeleteId(null)}
      />
      <ConfirmModal
        open={showConfirmDeleteAll}
        title="Hapus Semua Riwayat"
        message={`⚠️ Anda akan menghapus SEMUA riwayat chat. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus Semua"
        cancelLabel="Batal"
        onConfirm={confirmDeleteAll}
        onCancel={() => setShowConfirmDeleteAll(false)}
      />
      {/* Sidebar - Chat List */}
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <div className="header-title">
            <h2>💬 Riwayat Chat</h2>
            <p className="subtitle">
              {chatList.length} percakapan tersimpan
            </p>
          </div>
          {chatList.length > 0 && (
            <button className="btn-delete-all" onClick={handleDeleteAll} title="Hapus semua chat">
              🗑️
            </button>
          )}
        </div>

        {/* Search & Filter */}
        <div className="sidebar-controls">
          <div className="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Cari chat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          >
            <option value="all">Semua Waktu</option>
            <option value="today">Hari Ini</option>
            <option value="week">Minggu Ini</option>
            <option value="month">Bulan Ini</option>
          </select>
        </div>

        {/* Chat List */}
        <div className="chat-list">
          {filteredChats.length === 0 ? (
            <div className="empty-state-sidebar">
              <div className="empty-icon">📭</div>
              <p>Tidak ada chat ditemukan</p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                className={`chat-item ${selectedChat?.id === chat.id ? "active" : ""}`}
                onClick={() => handleSelectChat(chat)}
              >
                <div className="chat-icon-wrapper">
                  <span className="chat-icon">🤖</span>
                </div>

                <div className="chat-info">
                  {editingChatId === chat.id ? (
                    <input
                      type="text"
                      className="edit-title-input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => handleSaveTitle(chat.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveTitle(chat.id);
                        if (e.key === "Escape") setEditingChatId(null);
                      }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <h4>{chat.title || generateChatTitle(chat)}</h4>
                  )}
                  <p className="chat-date">{formatRelativeTime(chat.date)}</p>
                  <p className="chat-preview">
                    {chat.lastMessage?.substring(0, 50) || "Tidak ada pesan"}...
                  </p>
                </div>

                <div className="chat-actions">
                  <button
                    className="action-btn continue"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContinueChat(chat);
                    }}
                    title="Lanjutkan percakapan"
                  >
                    ▶️
                  </button>
                  <button
                    className="action-btn edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditTitle(chat);
                    }}
                    title="Edit judul"
                  >
                    ✏️
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                    title="Hapus chat"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main View - Chat Messages */}
      <div className="chat-view">
        {selectedChat ? (
          <>
            <div className="chat-view-header">
              <div className="header-info">
                <h3>{selectedChat.title || generateChatTitle(selectedChat)}</h3>
                <p>{formatTimestamp(selectedChat.date)}</p>
              </div>
              <div className="header-actions">
                <button className="btn-export" onClick={handleExportChat} title="Export chat">
                  📥 Export
                </button>
                <button
                  className="btn-delete"
                  onClick={(e) => handleDeleteChat(selectedChat.id, e)}
                  title="Hapus chat"
                >
                  🗑️ Hapus
                </button>
              </div>
            </div>

            <div className="chat-messages" ref={chatViewRef}>
              {selectedChat.messages && selectedChat.messages.length > 0 ? (
                selectedChat.messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`message-wrapper ${msg.sender === "user" ? "user" : "ai"}`}
                  >
                    {msg.sender === "ai" && (
                      <div className="message-avatar">
                        <div className="bot-icon">🤖</div>
                      </div>
                    )}

                    <div className="message-bubble">
                      <p className="message-text">
                        {msg.text.split("\n").map((line, i) => (
                          <React.Fragment key={i}>
                            {line}
                            {i < msg.text.split("\n").length - 1 && <br />}
                          </React.Fragment>
                        ))}
                      </p>
                      {msg.timestamp && (
                        <span className="message-time">
                          {new Date(msg.timestamp).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>

                    {msg.sender === "user" && (
                      <div className="message-avatar user-avatar">
                        <div className="user-icon">
                          {currentUser.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-messages">
                  <p>Tidak ada pesan dalam percakapan ini</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="chat-empty">
            <div className="empty-icon-large">💬</div>
            <h3>Belum ada chat yang dipilih</h3>
            <p>Pilih salah satu percakapan di sebelah kiri untuk melihat isinya</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiwayatChat;