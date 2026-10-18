"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";
import { getChatSocket } from "@/lib/chatSocket";

type User = { id: string; fullName: string; role: string };
type Conversation = { user: User; lastMessage: string; lastMessageAt: string };
// 👇 زدنا isRead فـ النوع
type Message = { id: string; senderId: string; receiverId: string; content: string; createdAt: string; isRead?: boolean };

export default function ChatPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [activeChat, setActiveChat] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showUsers, setShowUsers] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socket = useRef<any>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push("/login"); return; }
    setCurrentUser(u);
    loadConversations();
    loadUsers();

    socket.current = getChatSocket();
    
       socket.current.on("messages_read", ({ by }: { by: string }) => {
      console.log(`[Socket] Received messages_read from user: ${by}. Active chat is: ${activeChat?.id}`);
      
      if (activeChat && by === activeChat.id) {
        console.log("✅ Marking messages as read in UI");
        setMessages((prev) =>
          prev.map((m) => (m.senderId === u.id ? { ...m, isRead: true } : m))
        );
      }
    });

    // 👇 ملي كيوصل إشعار بلي الرسائل تقرات، كنعلمو الرسائل ديالنا بـ isRead: true
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
      
      // ملي كتحل الشات، علم السيرفر بلي قريتي الرسائل
      socket.current?.emit("mark_read", { senderId: user.id });
    } catch (e) { console.error(e); }
  }

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;
    
    socket.current?.emit("send_message", {
      receiverId: activeChat.id,
      content: newMessage,
    });
    setNewMessage("");
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
                      <p>{m.content}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className={`text-[10px] ${isMe ? "text-white/70" : "text-gray-400"}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {/* 👇 هنا كنعرضو الحالة من الرسالة نفسها m.isRead */}
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

            <form onSubmit={sendMessage} className="p-4 bg-white border-t flex gap-2">
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