"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { useSocket } from "@/src/context/SocketContext";

interface ChatPreview {
  id: string;
  name: string;
  lastMessage: string;
  profilePicture?: string;
  hasUnreadMessages?: boolean;
}

interface Message {
  id: string;
  sender: "me" | "friend";
  text: string;
  readAt?: string | null;
  senderId?: number;
}

interface FriendProfile {
  id: number;
  username: string;
  uniqueId: string;
  isOnline?: boolean;
  profile?: {
    profilePicture?: string;
  };
}

interface FriendStatus {
  userId: number;
  isOnline: boolean;
}

interface FriendSearchResult extends FriendProfile {
  friendshipStatus: "none" | "friends" | "request_sent" | "request_received";
}

interface FriendRequest {
  id: number;
  from: FriendProfile;
}

interface SocketMessage {
  id: string;
  conversationId: number;
  senderId: number;
  content: string;
  createdAt: string;
  readAt?: string | null;
}

interface ReadMessageEvent {
  messageId: string;
  readerId: number;
}

interface TypingEvent {
  conversationId: number;
  userId: number;
  isTyping: boolean;
}

interface ConversationUser {
  userId: number;
  user: {
    id: number;
    username: string;
    profile?: {
      profilePicture?: string;
    };
  };
}

interface ConversationResponse {
  id: number;
  name?: string | null;
  users?: ConversationUser[];
  participants?: ConversationUser[];
  messages: { content: string }[];
}

interface MessageWithSender extends SocketMessage {
  sender?: {
    id: number;
    username: string;
    uniqueId?: string;
    profile?: {
      profilePicture?: string;
    };
  };
}

export default function ChatPage() {
  const [activeChat, setActiveChat] = useState<ChatPreview | null>(null);
  const [messages, setMessages] = useState<Record<number, Message[]>>({});
  const [draft, setDraft] = useState("");
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [friendProfiles, setFriendProfiles] = useState<Record<number, FriendProfile>>({});
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentMessages = activeChat ? messages[Number(activeChat.id)] || [] : [];

  const [view, setView] = useState<"chats" | "friends" | "requests">("chats");
  const [chatSearch, setChatSearch] = useState("");
  const [friendSearch, setFriendSearch] = useState("");
  const [friendResults, setFriendResults] = useState<FriendSearchResult[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [friendsList, setFriendsList] = useState<FriendProfile[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const { socket } = useSocket();
  const { getToken, user } = useAuth();

  // Filter chats
  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(chatSearch.toLowerCase()) ||
    chat.id.includes(chatSearch)
  );

  // Auto-scroll to bottom when messages change or typing indicator appears
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, typingUsers]);

  // Get friend profile for read receipts - find the OTHER person in the current conversation
  const getFriendInConversation = (): FriendProfile | null => {
    if (!activeChat) return null;
    
    // Get the conversation ID
    const conversationId = Number(activeChat.id);
    
    // Look through current messages to find the friend's senderId
    const messagesForConv = messages[conversationId] || [];
    const friendMessage = messagesForConv.find(msg => 
      msg.sender === "friend" && msg.senderId && msg.senderId !== Number(user?.id)
    );
    
    if (friendMessage && friendMessage.senderId) {
      return friendProfiles[friendMessage.senderId] || null;
    }
    
    // Fallback: try to extract from activeChat name
    // Find friend profile that matches the chat name
    const matchingFriend = Object.values(friendProfiles).find(friend => 
      friend.username === activeChat.name
    );
    
    return matchingFriend || null;
  };

  // Check if user is typing
  const isUserTyping = (conversationId: number): boolean => {
    if (!activeChat || Number(activeChat.id) !== conversationId) return false;
    return typingUsers.size > 0;
  };

  // Get typing user names
  const getTypingUserNames = (): string[] => {
    return Array.from(typingUsers)
      .map(userId => friendProfiles[userId]?.username)
      .filter(Boolean);
  };

  // --- Fetch all conversations for sidebar ---
  const fetchConversations = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch("http://localhost:4000/conversations", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) return;

      const data: ConversationResponse[] = await res.json();
      const convs: ChatPreview[] = data.map((c) => {
        const currentUserId = user ? Number(user.id) : undefined;
        const other = 
        c.users?.find((u) => u.userId !== currentUserId)?.user ||
        c.participants?.find((p) => p.userId !== currentUserId)?.user;
        
        // Store friend profile for later use
        if (other) {
          setFriendProfiles(prev => ({
            ...prev,
            [other.id]: {
              id: other.id,
              username: other.username,
              uniqueId: (other as ConversationUser['user'] & { uniqueId?: string }).uniqueId || "", 
              profile: other.profile
            }
          }));
        }

        return {
          id: String(c.id),
          name: other?.username || c.name || "Unknown",
          lastMessage: c.messages[0]?.content || "",
          profilePicture: other?.profile?.profilePicture,
        };
      });
      setChats(convs);
    } catch (err) {
      console.error("❌ Failed to fetch conversations:", err);
    }
  }, [getToken, user]);

  // --- Fetch messages for a conversation ---
  const fetchMessages = useCallback(
    async (conversationId: number, friendName?: string) => {
      try {
        const token = await getToken();
        if (!token) return;

        const res = await fetch(`http://localhost:4000/conversations/${conversationId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        if (!res.ok) {
          console.error("❌ Failed to fetch messages");
          return;
        }
        const data: SocketMessage[] = await res.json();

        // Store friend profiles from message senders
        data.forEach((msg: MessageWithSender) => {
          if (msg.senderId !== Number(user?.id) && msg.sender) {
            setFriendProfiles(prev => ({
              ...prev,
              [msg.sender!.id]: {
                id: msg.sender!.id,
                username: msg.sender!.username,
                uniqueId: msg.sender!.uniqueId || "",
                profile: msg.sender!.profile
              }
            }));
          }
        });

        setMessages((prev) => ({
          ...prev,
          [conversationId]: data.map((m) => ({
            id: m.id,
            sender: m.senderId === Number(user?.id) ? "me" : "friend",
            text: m.content,
            readAt: m.readAt,
            senderId: m.senderId,
          })),
        }));

        // Mark messages as read when opening conversation
        if (data.length > 0) {
          data.forEach((msg) => {
            if (msg.senderId !== Number(user?.id) && !msg.readAt) {
              socket?.emit("message:read", { 
                messageId: msg.id, 
                conversationId: conversationId 
              });
            }
          });
          
          // Clear unread status for this conversation
          setChats(prev => {
            const updatedChats = prev.map(chat => 
              chat.id === String(conversationId) 
                ? { ...chat, hasUnreadMessages: false }
                : chat
            );
            return updatedChats;
          });
          
          // Update unread counter
          const hadUnreadMessages = chats.find(chat => chat.id === String(conversationId))?.hasUnreadMessages;
          if (hadUnreadMessages) {
            setUnreadMessagesCount(prev => Math.max(0, prev - 1));
          }
        }

        // Update chat preview
        if (data.length > 0) {
          const last = data[data.length - 1];
          setChats((prev) => {
            const exists = prev.find((c) => c.id === String(last.conversationId));
            if (exists) {
              return prev.map((c) =>
                c.id === String(last.conversationId)
                  ? { ...c, lastMessage: last.content }
                  : c
              );
            } else {
              return [
                ...prev,
                {
                  id: String(last.conversationId),
                  name: friendName || "Unknown",
                  lastMessage: last.content,
                },
              ];
            }
          });
        }
      } catch (err) {
        console.error("❌ Error fetching messages:", err);
      }
    },
    [getToken, user, socket]
  );

  // --- Send message ---
  const handleSendMessage = () => {
    if (!draft.trim() || !activeChat) return;
    socket?.emit("message:send", {
      conversationId: Number(activeChat.id),
      content: draft,
    });
    setDraft("");
    // Scroll to bottom after sending
    setTimeout(scrollToBottom, 100);
  };

  // --- Handle typing ---
  const handleTyping = (value: string) => {
    setDraft(value);
    
    if (!activeChat) return;
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Emit typing start
    socket?.emit("typing:start", { 
      conversationId: Number(activeChat.id)
    });
    
    // Set timeout to emit typing stop after 1 second of no typing
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit("typing:stop", { 
        conversationId: Number(activeChat.id)
      });
    }, 1000);
  };

  // --- Open chat with friend ---
  const handleOpenChatFromFriend = async (friend: FriendProfile) => {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch("http://localhost:4000/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ participantId: friend.id }),
        credentials: "include",
      });

      const conversation = await res.json();
      const chatPreview: ChatPreview = {
        id: String(conversation.id),
        name: friend.username,
        lastMessage: conversation.messages?.[0]?.content || "",
        profilePicture: friend.profile?.profilePicture,
      };

      setActiveChat(chatPreview);
      setView("chats");
      fetchMessages(conversation.id, friend.username);
      await fetchConversations();
    } catch (err) {
      console.error("❌ Failed to open chat:", err);
    }
  };

  const updateFriendStatus = useCallback((userId: number, isOnline: boolean) => {
    setFriendsList(prev => prev.map(friend => 
      friend.id === userId 
        ? { ...friend, isOnline } 
        : friend
    ));
  }, []);

  const setInitialFriendStatuses = useCallback((statuses: FriendStatus[]) => {
    setFriendsList(prev => prev.map(friend => {
      const status = statuses.find(s => s.userId === friend.id);
      return status ? { ...friend, isOnline: status.isOnline } : friend;
    }));
  }, []);

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
        setRequests((prev) => prev.filter((req) => req.id !== requestId));
        const newFriend = requests.find((req) => req.id === requestId)?.from;
        if (newFriend) {
          setFriendsList((prev) => [...prev, { ...newFriend, isOnline: false }]);
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

  const fetchFriendsAndRequests = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getToken();
      if (!token) return;

      const friendsRes = await fetch(
        `http://localhost:4000/users/${user.id}/friends`,
        {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        }
      );
      
      if (!friendsRes.ok) {
        throw new Error(`Failed to fetch friends: ${friendsRes.status}`);
      }
      
      const friendsData = await friendsRes.json();
      setFriendsList(friendsData);

      // Store friend profiles
      friendsData.forEach((friend: FriendProfile) => {
        setFriendProfiles(prev => ({
          ...prev,
          [friend.id]: friend
        }));
      });

      const requestsRes = await fetch(
        `http://localhost:4000/friends/requests`,
        {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        }
      );
      
      if (!requestsRes.ok) {
        throw new Error(`Failed to fetch requests: ${requestsRes.status}`);
      }
      
      const requestsData = await requestsRes.json();
      setRequests(requestsData);
    } catch (err) {
      console.error("❌ Failed to fetch friends and requests:", err);
    }
  }, [user, getToken]);

  // Effects
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
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
    }, 300);

    return () => clearTimeout(delay);
  }, [friendSearch, getToken]);

  useEffect(() => {
    if (view === "friends" || view === "requests") {
      fetchFriendsAndRequests();
    }
  }, [view, user, fetchFriendsAndRequests]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("friend:status:update", updateFriendStatus);
    socket.on("friends:initial:status", setInitialFriendStatuses);

    socket.on("connect_error", (err: Error) => {
      console.error("Socket connect error:", err.message);
    });

    socket.on("connect", () => {
      console.log("Socket connected successfully");
    });

    socket.on("message:read", ({ messageId, readerId }: ReadMessageEvent) => {
      setMessages(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(convId => {
          updated[Number(convId)] = updated[Number(convId)].map(msg =>
            msg.id === messageId ? { ...msg, readAt: new Date().toISOString() } : msg
          );
        });
        return updated;
      });
    });

    socket.on("typing:start", ({ conversationId, userId }: TypingEvent) => {
      if (activeChat && Number(activeChat.id) === conversationId) {
        setTypingUsers(prev => new Set(prev).add(userId));
      }
    });

    socket.on("typing:stop", ({ conversationId, userId }: TypingEvent) => {
      if (activeChat && Number(activeChat.id) === conversationId) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    socket.on("message:receive", (message: SocketMessage) => {
      setMessages(prev => {
        const chatMessages = prev[message.conversationId] || [];
        return {
          ...prev,
          [message.conversationId]: [
            ...chatMessages,
            { 
              id: message.id, 
              sender: message.senderId === Number(user?.id) ? "me" : "friend", 
              text: message.content,
              readAt: message.readAt,
              senderId: message.senderId,
            },
          ],
        };
      });

      // Check if message should be marked as unread
      const isMessageFromOther = message.senderId !== Number(user?.id);
      const isConversationActive = activeChat && Number(activeChat.id) === message.conversationId;
      const isUserInChatsView = view === "chats";
      
      // Update chat preview with the latest message and unread status
      setChats(prev => {
        const existingChatIndex = prev.findIndex(chat => chat.id === String(message.conversationId));
        if (existingChatIndex !== -1) {
          // Update existing chat with new last message
          const updatedChats = [...prev];
          const shouldMarkAsUnread = isMessageFromOther && (!isConversationActive || !isUserInChatsView);
          
          updatedChats[existingChatIndex] = {
            ...updatedChats[existingChatIndex],
            lastMessage: message.content,
            hasUnreadMessages: shouldMarkAsUnread ? true : updatedChats[existingChatIndex].hasUnreadMessages
          };
          return updatedChats;
        }
        return prev;
      });

      // Update unread messages counter
      if (isMessageFromOther && (!isConversationActive || !isUserInChatsView)) {
        setUnreadMessagesCount(prev => prev + 1);
      }

      // Auto-mark as read if conversation is active and user is in chats view
      if (activeChat && Number(activeChat.id) === message.conversationId && message.senderId !== Number(user?.id)) {
        socket.emit("message:read", { 
          messageId: message.id, 
          conversationId: message.conversationId 
        });
      }
    });

    // Cleanup
    return () => {
      socket.off("friend:status:update");
      socket.off("friends:initial:status");
      socket.off("connect_error");
      socket.off("connect");
      socket.off("message:read");
      socket.off("typing:start");
      socket.off("typing:stop");
      socket.off("disconnect");
      socket.off("message:receive");
    };
  }, [socket, user, updateFriendStatus, setInitialFriendStatuses, activeChat]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Clear typing users when changing conversations
  useEffect(() => {
    setTypingUsers(new Set());
  }, [activeChat]);

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
            (filteredChats.length > 0 ? (
              filteredChats.map((chat) => (
                <li
                  key={chat.id}
                  onClick={() => {
                    setActiveChat(chat);
                    fetchMessages(Number(chat.id), chat.name);
                  }}
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
                    <Avatar
                      src={chat.profilePicture}
                      username={chat.name}
                      size="w-10 h-10"
                    />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className={`font-semibold ${chat.hasUnreadMessages ? 'font-bold' : ''}`}>
                      {chat.name}
                    </span>
                    <span
                      className={`text-sm truncate ${
                        activeChat?.id === chat.id
                          ? "text-brand-white/80"
                          : chat.hasUnreadMessages 
                            ? "text-foreground font-semibold" 
                            : "text-foreground/70"
                      }`}
                    >
                      {chat.lastMessage}
                    </span>
                  </div>
                </li>
              ))
            ) : (
              <li className="text-sm text-foreground/70 text-center py-4">
                No chats found.
              </li>
            ))}

          {view === "friends" &&
            (friendsList.length > 0 ? (
              friendsList.map((friend) => (
                <li
                  key={friend.id}
                  onClick={() => handleOpenChatFromFriend(friend)}
                  className="flex items-center gap-3 p-3.5 rounded-xl transition-all hover:bg-foreground/10 hover:shadow-sm cursor-pointer"
                >
                  <div className="relative">
                    <Avatar
                      src={friend.profile?.profilePicture}
                      username={friend.username}
                      size="w-10 h-10"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background transition-colors ${
                        friend.isOnline ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                  </div>
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
            const hasPendingRequests = name === "requests" && requests.length > 0;
            const hasUnreadMessages = name === "chats" && unreadMessagesCount > 0;

            return (
              <button
                key={name}
                onClick={() => {
                  setView(name as "chats" | "friends" | "requests");
                  setChatSearch("");
                  setFriendSearch("");
                  // Clear active chat when switching away from chats view
                  if (name !== "chats") {
                    setActiveChat(null);
                  }
                }}
                className={`flex-1 flex flex-col items-center py-2 rounded-lg cursor-pointer transition-colors ${
                  isActive ? "bg-foreground/5" : ""
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-6 h-6 mb-1 transition-colors ${
                      isActive ? "text-brand-red" : "text-foreground/80"
                    }`}
                  />
                  {hasPendingRequests && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-400 border-2 border-background" />
                  )}
                  {hasUnreadMessages && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold border-2 border-background">
                      {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs transition-colors ${
                    isActive ? "text-brand-red font-semibold" : "text-foreground/80"
                  }`}
                >
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </span>
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
                {currentMessages.map((msg, index) => {
                  const isLastMessage = index === currentMessages.length - 1;
                  const isMyMessage = msg.sender === "me";
                  const showReadReceipt = isMyMessage && isLastMessage && msg.readAt;
                  const friendProfile = showReadReceipt ? getFriendInConversation() : null;

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMyMessage ? "justify-end" : "justify-start"}`}
                    >
                      <div className="flex items-end gap-1">
                        <div
                          className={`max-w-xs px-4 py-2 rounded-2xl text-sm shadow ${
                            isMyMessage
                              ? "bg-brand-red text-brand-white rounded-br-sm"
                              : "bg-foreground/10 text-foreground rounded-bl-sm"
                          }`}
                        >
                          {msg.text}
                        </div>
                        {showReadReceipt && friendProfile && (
                          <div className="mb-1">
                            <Avatar
                              src={friendProfile.profile?.profilePicture}
                              username={friendProfile.username}
                              size="w-4 h-4"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* Typing indicator */}
                {isUserTyping(Number(activeChat.id)) && (
                  <div className="flex justify-start">
                    <div className="max-w-xs px-4 py-2 rounded-2xl text-sm bg-foreground/10 text-foreground rounded-bl-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Invisible element to scroll to */}
                <div ref={messagesEndRef} />
              </div>
              <div className="mt-4 flex">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 border border-foreground/30 rounded-lg p-2 bg-background"
                />
                <button
                  onClick={handleSendMessage}
                  className="ml-2 px-4 py-2 bg-brand-red text-brand-white rounded-lg"
                >
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