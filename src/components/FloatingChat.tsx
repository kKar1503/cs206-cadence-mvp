"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Star,
} from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface Listing {
  id: string;
  title: string;
  artist: string;
  images: string;
  imageUrl: string | null;
  isSold: boolean;
  sellerId: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender?: User;
  isRead: boolean;
}

interface ConversationSummary {
  id: string;
  otherUser: User;
  listing: Listing;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
  listingId: string;
}

interface OpenChat {
  conversationId: string;
  otherUser: User;
  listing: Listing;
  messages: Message[];
  isMinimized: boolean;
}

export function FloatingChat() {
  const { data: session } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [openChats, setOpenChats] = useState<OpenChat[]>([]);
  const [showChatList, setShowChatList] = useState(false);
  const [newMessages, setNewMessages] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState<Record<string, boolean>>({});
  const messagesEndRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Listen for new chat requests
  useEffect(() => {
    const handleNewChatRequest = (event: Event) => {
      const customEvent = event as CustomEvent<{ otherUserId: string; listingId: string }>;

      if (!session?.user?.id) {
        router.push("/auth/signin");
        return;
      }

      const { otherUserId, listingId } = customEvent.detail;

      void (async () => {
        try {
          // Create or get conversation
          const res = await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ otherUserId, listingId }),
          });

          if (res.ok) {
            const conv = await res.json() as { id: string; otherUser: User; listingId: string };

            // Fetch the full conversation with listing details
            await fetchConversations();

            // Find and open the conversation
            const fullConv = conversations.find(c => c.id === conv.id);
            if (fullConv) {
              await openChat(fullConv);
            }
          }
        } catch (error) {
          console.error("Error starting new chat:", error);
        }
      })();
    };

    window.addEventListener("startNewChat", handleNewChatRequest);
    return () => {
      window.removeEventListener("startNewChat", handleNewChatRequest);
    };
  }, [session, router, conversations]);

  // Fetch conversations on mount and set up polling
  useEffect(() => {
    if (!session?.user?.id) return;

    void fetchConversations();

    // Poll for new messages every 5 seconds
    pollIntervalRef.current = setInterval(() => {
      void fetchConversations();
      // Refresh open chats
      openChats.forEach((chat) => {
        void fetchMessages(chat.conversationId);
      });
    }, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [session, openChats]);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json() as ConversationSummary[];
        setConversations(data);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (res.ok) {
        const data = await res.json() as { messages: Message[] };
        setOpenChats((prev) =>
          prev.map((chat) =>
            chat.conversationId === conversationId
              ? { ...chat, messages: data.messages }
              : chat
          )
        );
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const openChat = async (conversation: ConversationSummary) => {
    // Check if chat is already open
    const existingChat = openChats.find(
      (chat) => chat.conversationId === conversation.id
    );

    if (existingChat) {
      // Unminimize if minimized
      setOpenChats((prev) =>
        prev.map((chat) =>
          chat.conversationId === conversation.id
            ? { ...chat, isMinimized: false }
            : chat
        )
      );
      return;
    }

    // Fetch messages for this conversation
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/messages`);
      if (res.ok) {
        const data = await res.json() as { messages: Message[] };

        // Limit to 3 open chats
        const newOpenChats = openChats.slice(-2);

        setOpenChats([
          ...newOpenChats,
          {
            conversationId: conversation.id,
            otherUser: conversation.otherUser,
            listing: conversation.listing,
            messages: data.messages,
            isMinimized: false,
          },
        ]);
      }
    } catch (error) {
      console.error("Error opening chat:", error);
    }

    setShowChatList(false);
  };

  const closeChat = (conversationId: string) => {
    setOpenChats((prev) =>
      prev.filter((chat) => chat.conversationId !== conversationId)
    );
  };

  const toggleMinimize = (conversationId: string) => {
    setOpenChats((prev) =>
      prev.map((chat) =>
        chat.conversationId === conversationId
          ? { ...chat, isMinimized: !chat.isMinimized }
          : chat
      )
    );
  };

  const sendMessage = async (conversationId: string) => {
    const content = newMessages[conversationId];
    if (!content?.trim() || isSending[conversationId]) return;

    setIsSending((prev) => ({ ...prev, [conversationId]: true }));

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const message = await res.json() as Message;
        setOpenChats((prev) =>
          prev.map((chat) =>
            chat.conversationId === conversationId
              ? { ...chat, messages: [...chat.messages, message] }
              : chat
          )
        );
        setNewMessages((prev) => ({ ...prev, [conversationId]: "" }));

        // Scroll to bottom
        setTimeout(() => {
          messagesEndRefs.current[conversationId]?.scrollIntoView({
            behavior: "smooth",
          });
        }, 100);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending((prev) => ({ ...prev, [conversationId]: false }));
    }
  };

  const getFirstImage = (images: string, imageUrl: string | null): string => {
    try {
      const parsed = JSON.parse(images) as string[];
      return parsed[0] ?? imageUrl ?? "https://placehold.co/400x400/fc6736/ffffff?text=No+Image";
    } catch {
      return imageUrl ?? "https://placehold.co/400x400/fc6736/ffffff?text=No+Image";
    }
  };

  const totalUnread = conversations.reduce(
    (sum, conv) => sum + conv.unreadCount,
    0
  );

  if (!session?.user?.id) return null;

  return (
    <>
      {/* Chat List Button */}
      <div className="fixed bottom-4 right-4 z-50 flex items-end gap-3">
        {/* Open chat windows */}
        {openChats.map((chat) => (
          <Card
            key={chat.conversationId}
            className="w-80 shadow-lg py-0 gap-0"
            style={{ marginBottom: 0 }}
          >
            <CardHeader className="flex flex-row items-center justify-between p-4 bg-primary text-primary-foreground">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-foreground text-primary text-xs font-semibold">
                  {(chat.otherUser.name ?? "A").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-sm truncate">
                    {chat.otherUser.name ?? "Anonymous"}
                  </CardTitle>
                  <p className="text-xs truncate opacity-90">{chat.listing.title}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => toggleMinimize(chat.conversationId)}
                >
                  {chat.isMinimized ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => closeChat(chat.conversationId)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            {!chat.isMinimized && (
              <CardContent className="p-0">
                {/* Listing Info Card */}
                <div className="p-3 border-b bg-background">
                  <Link href={`/listings/${chat.listing.id}`} target="_blank">
                    <div className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md">
                        <Image
                          src={getFirstImage(chat.listing.images, chat.listing.imageUrl)}
                          alt={chat.listing.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{chat.listing.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{chat.listing.artist}</p>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>
                        {chat.listing.isSold && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            Sold
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Review Button for Buyers */}
                  {chat.listing.isSold &&
                   chat.listing.sellerId !== session.user.id && (
                    <Link href={`/users/${chat.listing.sellerId}?review=true`} target="_blank">
                      <Button variant="outline" size="sm" className="w-full mt-2 gap-2">
                        <Star className="h-4 w-4" />
                        Leave a Review for Seller
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Messages */}
                <div className="h-80 overflow-y-auto p-3 space-y-3 bg-muted/30">
                  {chat.messages.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      No messages yet
                    </p>
                  ) : (
                    chat.messages.map((message) => {
                      const isOwnMessage = message.senderId === session.user.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                              isOwnMessage
                                ? "bg-primary text-primary-foreground"
                                : "bg-background"
                            }`}
                          >
                            <p>{message.content}</p>
                            <p
                              className={`mt-1 text-xs ${
                                isOwnMessage
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {new Date(message.createdAt).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "numeric",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div
                    ref={(el) => {
                      messagesEndRefs.current[chat.conversationId] = el;
                    }}
                  />
                </div>

                {/* Input */}
                <div className="p-3 border-t">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void sendMessage(chat.conversationId);
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessages[chat.conversationId] ?? ""}
                      onChange={(e) =>
                        setNewMessages((prev) => ({
                          ...prev,
                          [chat.conversationId]: e.target.value,
                        }))
                      }
                      disabled={isSending[chat.conversationId]}
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={
                        (isSending[chat.conversationId] ?? false) ||
                        !newMessages[chat.conversationId]?.trim()
                      }
                    >
                      {isSending[chat.conversationId] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {/* Chat list toggle button */}
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg relative"
          onClick={() => setShowChatList(!showChatList)}
        >
          <MessageCircle className="h-6 w-6" />
          {totalUnread > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center"
            >
              {totalUnread > 9 ? "9+" : totalUnread}
            </Badge>
          )}
        </Button>
      </div>

      {/* Chat List Popup */}
      {showChatList && (
        <Card className="fixed bottom-24 right-4 z-40 w-80 shadow-lg py-0 gap-0">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-base">Messages</CardTitle>
          </CardHeader>
          <CardContent className={`p-0 overflow-y-auto ${conversations.length === 0 ? '' : 'max-h-80'}`}>
            {conversations.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                No conversations yet
              </p>
            ) : (
              <div className="divide-y">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => openChat(conv)}
                    className="w-full p-3 hover:bg-muted/50 text-left transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md">
                        <Image
                          src={getFirstImage(conv.listing.images, conv.listing.imageUrl)}
                          alt={conv.listing.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm truncate">
                            {conv.otherUser.name ?? "Anonymous"}
                          </p>
                          {conv.unreadCount > 0 && (
                            <Badge
                              variant="destructive"
                              className="h-5 min-w-5 px-1.5 text-xs"
                            >
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mb-1">
                          {conv.listing.title}
                        </p>
                        {conv.lastMessage && (
                          <p className="text-xs text-muted-foreground truncate">
                            {conv.lastMessage.senderId === session.user.id
                              ? "You: "
                              : ""}
                            {conv.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
