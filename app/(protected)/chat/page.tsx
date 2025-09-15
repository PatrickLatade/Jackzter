  "use client";

  import { useState } from "react";
  import { ChatBubbleBottomCenterIcon, UserGroupIcon, InboxIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
  import { useAuth } from "@/src/hooks/useAuth";
  import { useEffect } from "react";

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

  interface FriendSearchResult {
  id: string;
  username: string;
  uniqueId: string;
  profile?: {
    profilePicture?: string;
  };
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

    const [search, setSearch] = useState("");
    const [view, setView] = useState<"chats" | "friends" | "requests">("chats");
    const [chatSearch, setChatSearch] = useState("");
    const [friendSearch, setFriendSearch] = useState("");
    const [friendResults, setFriendResults] = useState<FriendSearchResult[]>([]);
    const [loadingFriends, setLoadingFriends] = useState(false);
    const { getToken } = useAuth();


    // Filtered chats based on search input
    const filteredChats = chats.filter(chat =>
      chat.name.toLowerCase().includes(chatSearch.toLowerCase()) ||
      chat.id.includes(chatSearch)
    );

    //Effects
    useEffect(() => {
    const fetchFriends = async () => {
      if (!friendSearch.trim()) {
        setFriendResults([]);
        return;
      }
      try {
        setLoadingFriends(true);
        const token = await getToken();
        const res = await fetch(`http://localhost:4000/users/search?q=${encodeURIComponent(friendSearch)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });
        const data = await res.json();
        setFriendResults(data);
      } catch (err) {
        console.error("❌ Friend search failed:", err);
      } finally {
        setLoadingFriends(false);
      }
    };

      fetchFriends();
    }, [friendSearch, getToken]);

    return (
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-1/3 border-r border-foreground/20 bg-background p-4 flex flex-col">
          {/* Search */}
          {view !== "requests" && (
            <div className="mb-4 relative">
              <MagnifyingGlassIcon className="w-5 h-5 text-foreground/50 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={view === "chats" ? "Search Chats..." : "Search Friends..."}
                value={view === "chats" ? chatSearch : friendSearch}
                onChange={(e) =>
                  view === "chats" ? setChatSearch(e.target.value) : setFriendSearch(e.target.value)
                }
                className="w-full pl-10 pr-3 py-2 rounded-full bg-foreground/5 text-sm placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand-red focus:bg-background transition"
              />
            </div>
          )}

          {/* Chats / Friends / Requests */}
          <h2 className="text-lg font-bold mb-4 text-brand-red capitalize">{view}</h2>
          <ul className="space-y-2 flex-1 overflow-y-auto">
            {view === "chats" &&
              filteredChats.map((chat) => (
                <li
                  key={chat.id}
                  onClick={() => setActiveChat(chat)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all ${
                    activeChat?.id === chat.id
                      ? "bg-brand-red text-brand-white shadow-md border-l-4 border-brand-red"
                      : "hover:bg-foreground/10 hover:shadow-sm"
                  }`}
                >
                  <div
                    className={`w-10 h-10 flex items-center justify-center rounded-full font-bold shadow-sm ${
                      activeChat?.id === chat.id
                        ? "bg-brand-white text-brand-red"
                        : "bg-foreground/20 text-foreground"
                    }`}
                  >
                    {chat.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-semibold">{chat.name}</span>
                    <span
                      className={`text-sm truncate ${
                        activeChat?.id === chat.id
                          ? "text-brand-white/80"
                          : "text-foreground/70"
                      }`}
                    >
                      {chat.lastMessage}
                    </span>
                  </div>
                </li>
              ))}

            {view === "friends" && (
              <li className="text-sm text-foreground/70">
                {/* later: map filteredFriends here */}
                Friends list goes here...
              </li>
            )}

            {view === "requests" && (
              <li className="text-sm text-foreground/70">
                Friend requests go here...
              </li>
            )}
          </ul>

          {/* Bottom toggle */}
          <div className="mt-4 flex border-t border-foreground/10 pt-2">
            {[
              { name: "chats", icon: ChatBubbleBottomCenterIcon },
              { name: "friends", icon: UserGroupIcon },
              { name: "requests", icon: InboxIcon },
            ].map(({ name, icon: Icon }) => {
              const isActive = view === name;
              return (
                <button
                  key={name}
                  onClick={() => {
                    setView(name as "chats" | "friends" | "requests");
                    setChatSearch("");   // clear chat search when switching
                    setFriendSearch(""); // clear friend search when switching
                  }}
                  className={`flex-1 flex flex-col items-center py-2 rounded-lg cursor-pointer transition-colors ${
                    isActive ? "bg-foreground/5" : ""
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 mb-1 transition-colors ${
                      isActive ? "text-brand-red" : "text-foreground/80"
                    }`}
                  />
                  <span
                    className={`text-xs transition-colors ${
                      isActive ? "text-brand-red font-semibold" : "text-foreground/80"
                    }`}
                  >
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </span>
                  {/* Active indicator */}
                  {isActive && (
                    <div className="mt-1 w-6 h-0.5 bg-brand-red rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Chat window */}
        <main className="flex-1 p-4 flex flex-col bg-background">
          {view === "chats" && activeChat ? (
            // --- Show chat messages if in chats view & a chat is selected ---
            <>
              <div className="border-b border-foreground/20 pb-2 mb-4 font-bold text-lg text-brand-red">
                Chat with {activeChat.name}
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 p-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-2xl text-sm shadow ${
                        msg.sender === "me"
                          ? "bg-brand-red text-brand-white rounded-br-sm"
                          : "bg-foreground/10 text-foreground rounded-bl-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 border border-foreground/30 rounded-lg p-2 bg-background"
                  disabled
                />
                <button className="ml-2 px-4 py-2 bg-brand-red text-brand-white rounded-lg" disabled>
                  Send
                </button>
              </div>
            </>
          ) : view === "friends" ? (
            // --- Friends view uses chat window for search results ---
            <div className="flex-1 overflow-y-auto space-y-3">
              {loadingFriends && (
                <div className="text-center text-foreground/50">Searching...</div>
              )}

              {!loadingFriends && friendSearch && friendResults.length === 0 && (
                <div className="text-center text-foreground/50">No users found</div>
              )}

              {!loadingFriends && !friendSearch && (
                <div className="flex-1 flex items-center justify-center opacity-70">
                  Search results will appear here
                </div>
              )}

              {friendResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-foreground/5 hover:bg-foreground/10 transition"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={user.profile?.profilePicture || "/default-avatar.png"}
                      alt={user.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold">{user.username}</div>
                      <div className="text-xs text-foreground/60">@{user.uniqueId}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => console.log("Add friend:", user.id)}
                    className="px-3 py-1 bg-brand-red text-white text-sm rounded-lg hover:bg-brand-red/90 transition"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          ) : (
            // --- Requests fallback ---
            <div className="flex-1 flex items-center justify-center opacity-70">
              Friend requests will appear here
            </div>
          )}
        </main>
      </div>
    );
  }
