"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface ChatContextType {
  startNewChat: (otherUserId: string, listingId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [newChatRequest, setNewChatRequest] = useState<{
    otherUserId: string;
    listingId: string;
    timestamp: number;
  } | null>(null);

  const startNewChat = (otherUserId: string, listingId: string) => {
    setNewChatRequest({ otherUserId, listingId, timestamp: Date.now() });
  };

  return (
    <ChatContext.Provider value={{ startNewChat }}>
      {children}
      {/* Pass the request to FloatingChat via custom event */}
      {newChatRequest && (
        <ChatEventDispatcher request={newChatRequest} onDispatched={() => setNewChatRequest(null)} />
      )}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}

// Helper component to dispatch custom events
function ChatEventDispatcher({
  request,
  onDispatched,
}: {
  request: { otherUserId: string; listingId: string; timestamp: number };
  onDispatched: () => void;
}) {
  useEffect(() => {
    const event = new CustomEvent("startNewChat", { detail: request });
    window.dispatchEvent(event);
    onDispatched();
  }, [request, onDispatched]);

  return null;
}

// Add useEffect import
import { useEffect } from "react";
