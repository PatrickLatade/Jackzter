"use client";

import { useState } from "react";

interface ChatPreview {
  id: string;
  name: string;
  lastMessage: string;
}

interface Message {
  id: string;
  sender: "me" | "friend";
  text: string;
}

export default function ChatPage() {
  const [chats] = useState<ChatPreview[]>([
    { id: "1", name: "Alice", lastMessage: "See you tomorrow!" },
    { id: "2", name: "Bob", lastMessage: "Let's catch up later." },
    { id: "3", name: "Charlie", lastMessage: "Hey! Long time no chat." },
  ]);

  const [activeChat, setActiveChat] = useState<ChatPreview | null>(null);
  const [messages] = useState<Message[]>([
    { id: "m1", sender: "friend", text: "Hey! How are you?" },
    { id: "m2", sender: "me", text: "I’m good, thanks. You?" },
    { id: "m3", sender: "friend", text: "Doing great! Want to hang out tomorrow?" },
    { id: "m4", sender: "me", text: "Sure, let’s do it!" },
  ]);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-1/3 border-r border-foreground/20 bg-background p-4">
        <h2 className="text-lg font-bold mb-4 text-brand-red">Chats</h2>
        <ul className="space-y-2">
          {chats.map((chat) => (
            <li
              key={chat.id}
              onClick={() => setActiveChat(chat)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                activeChat?.id === chat.id ? "bg-brand-red text-brand-white" : "hover:bg-foreground/10"
              }`}
            >
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-full font-bold ${
                  activeChat?.id === chat.id ? "bg-brand-white text-brand-red" : "bg-foreground/20 text-foreground"
                }`}
              >
                {chat.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="font-semibold">{chat.name}</span>
                <span className={`text-sm truncate ${activeChat?.id === chat.id ? "text-brand-white/80" : "text-foreground/70"}`}>
                  {chat.lastMessage}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      {/* Chat window */}
      <main className="flex-1 p-4 flex flex-col bg-background">
        {activeChat ? (
          <>
            <div className="border-b border-foreground/20 pb-2 mb-4 font-bold text-lg text-brand-red">
              Chat with {activeChat.name}
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 p-2">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm shadow ${
                    msg.sender === "me" ? "bg-brand-red text-brand-white rounded-br-sm" : "bg-foreground/10 text-foreground rounded-bl-sm"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex">
              <input type="text" placeholder="Type a message..." className="flex-1 border border-foreground/30 rounded-lg p-2 bg-background" disabled />
              <button className="ml-2 px-4 py-2 bg-brand-red text-brand-white rounded-lg" disabled>Send</button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center opacity-70">
            Select a chat to start messaging
          </div>
        )}
      </main>
    </div>
  );
}
