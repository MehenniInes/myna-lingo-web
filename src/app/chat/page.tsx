"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser, getToken } from "@/lib/api";
import { getChatSocket } from "@/lib/chatSocket";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type User = { id: string; fullName: string; role: string };
type Conversation = { user: User; lastMessage: string; lastMessageAt: string };
type Message = { 
  id: string; 
  senderId: string; 
  receiverId: string; 
  content: string | null; 
  type: string; 
  fileUrl?: string; 
  fileName?: string; 
  createdAt: string; 
  isRead?: boolean 
};

export default function ChatPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [activeChat, setActiveChat] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showUsers, setShowUsers] = useState(false);
  const [uploading, setUploading] = useState(false); // 👈 حالة الرفع
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socket = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // 👈 الـ Ref ديال زر الملفات

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push("/login"); return; }
    setCurrentUser(u);
    loadConversations();
    loadUsers();

    socket.current = getChatSocket();
    
    socket.current.on("new_message", (msg: Message) => {
      if (
        (msg.senderId === u.id && msg.receiverId === activeChat?.id) ||
        (msg.senderId === activeChat?.id && msg.receiverId === u.id)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
      loadConversations();
    });

    socket.current.on("messages_read", ({ by }: { by: string }) => {
      if (activeChat && by === activeChat.id) {
        setMessages((prev) =>
          prev.map((m) => (m.senderId === u.id ? { ...m, isRead: true } : m))
        );
      }
    });

    return () => {
      socket.current?.off("new_message");
      socket.current?.off("messages_read");
    };
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadConversations() {
    try {
      const data = await api<Conversation[]>("/chat/conversations", { auth: true });
      setConversations(data);
    } catch (e) { console.error(e); }
  }

  async function loadUsers() {
    try {
      const data = await api<User[]>("/chat/users", { auth: true });
      setAvailableUsers(data);
    } catch (e) { console.error(e); }
  }

  async function openChat(user: User) {
    setActiveChat(user);
    setShowUsers(false);
    try {
      const history = await api<Message[]>(`/chat/history/${user.id}`, { auth: true });
      setMessages(history);
      socket.current?.emit("mark_read", { senderId: user.id });
    } catch (e) { console.error(e); }
  }

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;
    
    socket.current?.emit("send_message", {
      receiverId: activeChat.id,
      content: newMessage,
      type: "TEXT",
    });
    setNewMessage("");
  }

  // 👈 دالة رفع الملفات
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeChat) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/chat/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      const isImage = file.type.startsWith("image/");

      // صيفط الرسالة عبر WebSocket
      socket.current?.emit("send_message", {
        receiverId: activeChat.id,
        content: "",
        type: isImage ? "IMAGE" : "FILE",
        fileUrl: data.url,
        fileName: data.fileName,
      });

    } catch (err) {
      alert("Error uploading file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (!currentUser) return null;

  return (
    <main className="min-h-screen bg-cream flex">
      {/* Sidebar */}
      <div className="w-1/3 border-r bg-white p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Messages</h2>
          <button 
            onClick={() => setShowUsers(!showUsers)}
            className="bg-myna-orange text-white px-3 py-1 rounded-lg text-sm font-bold"
          >
            {showUsers ? "Cancel" : "+ New Chat"}
          </button>
        </div>

        {showUsers ? (
          <div className="space-y-2 overflow-y-auto">
            <p className="text-xs text-gray-500 mb-2">Select a user to start chatting:</p>
            {availableUsers.map((u) => (
              <div
                key={u.id}
                onClick={() => openChat(u)}
                className="p-3 rounded-xl cursor-pointer hover:bg-gray-50 border"
              >
                <p className="font-bold">{u.fullName}</p>
                <p className="text-xs text-gray-500">{u.role}</p>
              </div>
            ))}
            {availableUsers.length === 0 && <p className="text-sm text-gray-500">No users found.</p>}
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto flex-1">
            {conversations.map((c) => (
              <div
                key={c.user.id}
                onClick={() => openChat(c.user)}
                className={`p-3 rounded-xl cursor-pointer ${activeChat?.id === c.user.id ? "bg-myna-orange/10" : "hover:bg-gray-50"}`}
              >
                <p className="font-bold">{c.user.fullName}</p>
                <p className="text-xs text-gray-500 truncate">{c.lastMessage}</p>
              </div>
            ))}
            {conversations.length === 0 && <p className="text-sm text-gray-500">No conversations yet.</p>}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <>
            <div className="p-4 bg-white border-b font-bold text-lg">
              {activeChat.fullName} <span className="text-sm font-normal text-gray-500">({activeChat.role})</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m) => {
                const isMe = m.senderId === currentUser.id;
                return (
                  <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] p-3 rounded-2xl ${isMe ? "bg-myna-orange text-white rounded-tr-sm" : "bg-white text-gray-800 rounded-tl-sm shadow-sm"}`}>
                      
                      {/* 👈 عرض حسب نوع الرسالة */}
                      {m.type === "IMAGE" && m.fileUrl ? (
                        <img 
                          src={`${API_URL}${m.fileUrl}`} 
                          alt="attachment" 
                          className="max-w-full rounded-lg mb-2"
                        />
                      ) : m.type === "FILE" && m.fileUrl ? (
                        <a 
                          href={`${API_URL}${m.fileUrl}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className={`flex items-center gap-2 p-2 rounded-lg mb-2 ${isMe ? "bg-white/20" : "bg-gray-100"}`}
                        >
                          📎 {m.fileName || "Download File"}
                        </a>
                      ) : (
                        <p>{m.content}</p>
                      )}

                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className={`text-[10px] ${isMe ? "text-white/70" : "text-gray-400"}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && (
                          <span className="text-[10px] text-white/90 font-bold ml-1">
                            {m.isRead ? "✓✓ Seen" : "✓ Sent"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 bg-white border-t flex gap-2 items-center">
              {/* 👈 زر رفع الملفات */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept="image/*,application/pdf,application/zip" 
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="p-2 text-gray-500 hover:text-myna-orange disabled:opacity-50"
                title="Attach file"
              >
                {uploading ? "⏳" : "📎"}
              </button>

              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-myna-orange"
              />
              <button type="submit" className="bg-myna-orange text-white px-6 py-2 rounded-full font-bold">
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </main>
  );
}