"use client";

import { useState, useEffect } from "react";
import {
  ChatBubbleBottomCenterIcon,
  UserGroupIcon,
  InboxIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/src/hooks/useAuth";
import Avatar from "@/src/components/Avatar";

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

interface FriendProfile {
  id: number;
  username: string;
  uniqueId: string;
  profile?: {
    profilePicture?: string;
  };
}

// Updated interface for search results
interface FriendSearchResult extends FriendProfile {
  friendshipStatus: "none" | "friends" | "request_sent" | "request_received";
}

interface FriendRequest {
  id: number;
  from: FriendProfile;
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

  const [view, setView] = useState<"chats" | "friends" | "requests">("chats");
  const [chatSearch, setChatSearch] = useState("");
  const [friendSearch, setFriendSearch] = useState("");
  const [friendResults, setFriendResults] = useState<FriendSearchResult[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [friendsList, setFriendsList] = useState<FriendProfile[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const { getToken, user } = useAuth();

  // Filtered chats based on search input
  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(chatSearch.toLowerCase()) ||
    chat.id.includes(chatSearch)
  );

  // Friend actions
  const handleSendRequest = async (toId: number) => {
    try {
      const token = await getToken();
      const res = await fetch("http://localhost:4000/friends/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ toId }),
        credentials: "include",
      });

      if (res.ok) {
        // Optimistically update the search results to show "Pending"
        setFriendResults((prev) =>
          prev.map((f) =>
            f.id === toId ? { ...f, friendshipStatus: "request_sent" } : f
          )
        );
        console.log("Friend request sent!");
      } else {
        const data = await res.json();
        console.error("❌ Failed to send request:", data.error);
      }
    } catch (err) {
      console.error("❌ Send request failed:", err);
    }
  };

  const handleAcceptRequest = async (requestId: number, fromId: number) => {
    try {
      const token = await getToken();
      const res = await fetch(
        `http://localhost:4000/friends/accept/${requestId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        }
      );

      if (res.ok) {
        // Remove the request from the list
        setRequests((prev) => prev.filter((req) => req.id !== requestId));
        // Add the new friend to the friends list
        const newFriend = requests.find((req) => req.id === requestId)?.from;
        if (newFriend) {
          setFriendsList((prev) => [...prev, newFriend]);
        }
        console.log("Friend request accepted!");
      } else {
        const data = await res.json();
        console.error("❌ Failed to accept request:", data.error);
      }
    } catch (err) {
      console.error("❌ Accept request failed:", err);
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      const token = await getToken();
      const res = await fetch(
        `http://localhost:4000/friends/reject/${requestId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        }
      );

      if (res.ok) {
        // Remove the request from the list
        setRequests((prev) => prev.filter((req) => req.id !== requestId));
        console.log("Friend request rejected!");
      } else {
        const data = await res.json();
        console.error("❌ Failed to reject request:", data.error);
      }
    } catch (err) {
      console.error("❌ Reject request failed:", err);
    }
  };

  const fetchFriendsAndRequests = async () => {
    if (!user) return;
    try {
      const token = await getToken();
      if (!token) return;

      // Fetch friends
      const friendsRes = await fetch(
        `http://localhost:4000/users/${user.id}/friends`,
        {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        }
      );
      if (friendsRes.ok) {
        const friendsData = await friendsRes.json();
        setFriendsList(friendsData);
      } else {
        console.error("❌ Failed to fetch friends");
      }

      // Fetch requests
      const requestsRes = await fetch(
        `http://localhost:4000/friends/requests`,
        {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        }
      );
      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setRequests(requestsData);
      } else {
        console.error("❌ Failed to fetch requests");
      }
    } catch (err) {
      console.error("❌ Failed to fetch friends and requests:", err);
    }
  };

  // Effects
  useEffect(() => {
    // This effect runs whenever the search input changes
    const delay = setTimeout(() => {
      const fetchFriends = async () => {
        if (!friendSearch.trim()) {
          setFriendResults([]);
          return;
        }
        try {
          setLoadingFriends(true);
          const token = await getToken();
          const res = await fetch(
            `http://localhost:4000/users/search?q=${encodeURIComponent(friendSearch)}`,
            {
              headers: { Authorization: `Bearer ${token}` },
              credentials: "include",
            }
          );
          const data = await res.json();
          setFriendResults(data);
        } catch (err) {
          console.error("❌ Friend search failed:", err);
        } finally {
          setLoadingFriends(false);
        }
      };

      fetchFriends();
    }, 300); // wait 300ms after user stops typing

    return () => clearTimeout(delay);
  }, [friendSearch, getToken]);

  useEffect(() => {
    // This effect runs when the view changes or on initial load
    if (view === "friends" || view === "requests") {
      fetchFriendsAndRequests();
    }
  }, [view, user]); // Refetch when view changes or user loads

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
              placeholder={view === "chats" ? "Search Chats..." : "Search Users..."}
              value={view === "chats" ? chatSearch : friendSearch}
              onChange={(e) =>
                view === "chats" ? setChatSearch(e.target.value) : setFriendSearch(e.target.value)
              }
              className="w-full pl-10 pr-3 py-2 rounded-full bg-foreground/5 text-sm placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand-red focus:bg-background transition"
            />
          </div>
        )}

        {/* Chats / Friends / Requests */}
        <h2 className="text-lg font-bold mb-4 text-brand-red capitalize">
          {view === "requests" ? `Requests (${requests.length})` : view}
        </h2>
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

            {view === "friends" &&
              (friendsList.length > 0 ? (
                friendsList.map((friend) => (
                  <li
                    key={friend.id}
                    className="flex items-center gap-3 p-3.5 rounded-xl transition-all hover:bg-foreground/10 hover:shadow-sm"
                  >
                    <Avatar
                      src={friend.profile?.profilePicture}
                      username={friend.username}
                      size="w-10 h-10"
                    />
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-semibold">{friend.username}</span>
                      <span className="text-sm truncate text-foreground/70">
                        @{friend.uniqueId}
                      </span>
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-sm text-foreground/70 text-center py-4">
                  No friends yet. Search for users to add!
                </li>
              ))}

          {view === "requests" &&
            (requests.length > 0 ? (
              requests.map((request) => (
                <li
                  key={request.id}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-xl transition-all hover:bg-foreground/10 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={request.from.profile?.profilePicture}
                      username={request.from.username}
                      size="w-10 h-10"
                    />
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-semibold">
                        {request.from.username}
                      </span>
                      <span className="text-sm truncate text-foreground/70">
                        @{request.from.uniqueId}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptRequest(request.id, request.from.id)}
                      className="p-1 rounded-full text-green-500 hover:text-green-400 transition"
                      title="Accept"
                    >
                      <CheckCircleIcon className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      className="p-1 rounded-full text-red-500 hover:text-red-400 transition"
                      title="Reject"
                    >
                      <XCircleIcon className="w-6 h-6" />
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <li className="text-sm text-foreground/70 text-center py-4">
                No friend requests at this time.
              </li>
            ))}
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
                  setChatSearch("");
                  setFriendSearch("");
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
          {view === "chats" ? (
            activeChat ? (
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
            ) : (
              <div className="flex-1 flex items-center justify-center text-foreground/60">
                Click a chat to start a conversation
              </div>
            )
          ) : view === "friends" ? (
          // --- Friends view uses chat window for search results ---
          <div className="flex-1 overflow-y-auto space-y-3">
            {loadingFriends && friendSearch && (
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
                  <Avatar
                    src={user.profile?.profilePicture}
                    username={user.username}
                    size="w-10 h-10"
                  />
                  <div>
                    <div className="font-semibold">{user.username}</div>
                    <div className="text-xs text-foreground/60">@{user.uniqueId}</div>
                  </div>
                </div>

                {user.friendshipStatus === "none" && (
                  <button
                    onClick={() => handleSendRequest(user.id)}
                    className="px-3 py-1 bg-brand-red text-white text-sm rounded-lg 
                              hover:bg-brand-red/90 active:scale-95 transition 
                              cursor-pointer shadow-md"
                  >
                    Add
                  </button>
                )}

                {user.friendshipStatus === "request_sent" && (
                  <button
                    disabled
                    className="px-3 py-1 bg-foreground/30 text-white text-sm rounded-lg cursor-not-allowed"
                  >
                    Pending
                  </button>
                )}

                {user.friendshipStatus === "request_received" && (
                  <button
                    disabled
                    className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg cursor-not-allowed"
                  >
                    Accept
                  </button>
                )}

                {user.friendshipStatus === "friends" && (
                  <button
                    disabled
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg cursor-not-allowed"
                  >
                    Friends
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          // --- Requests view ---
          <div className="flex-1 overflow-y-auto space-y-3">
            {requests.length === 0 && (
              <div className="flex-1 flex items-center justify-center opacity-70">
                You have no pending friend requests.
              </div>
            )}
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 rounded-xl bg-foreground/5 hover:bg-foreground/10 transition"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={request.from.profile?.profilePicture}
                    username={request.from.username}
                    size="w-10 h-10"
                  />
                  <div>
                    <div className="font-semibold">{request.from.username}</div>
                    <div className="text-xs text-foreground/60">@{request.from.uniqueId}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptRequest(request.id, request.from.id)}
                    className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-400 transition"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request.id)}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-400 transition"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}