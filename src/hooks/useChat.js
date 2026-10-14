import { useState, useEffect, useCallback, useRef } from "react";
import { fetchChats, fetchMessages, createOrGetChat } from "../api/chatApi";
import {
  connectSocket,
  sendMessage,
  subscribeToMessages,
  unsubscribeFromMessages,
} from "../utils/socket";

// Conversation list and the open thread, for the customer and owner chat pages.
// Loading and error flags are exposed for both the list and the open thread so a failed
// request shows a message with a retry instead of looking like "no conversations".
export function useChat(currentUser, venueId = null) {
  const [chats, setChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(Boolean(currentUser));
  const [chatsError, setChatsError] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState(false);
  const [startError, setStartError] = useState(false);
  const activeRef = useRef(null);
  const requestId = useRef(0);
  const userId = currentUser?._id;

  const reloadChats = useCallback(() => {
    if (!userId) return;
    setChatsLoading(true);
    setChatsError(false);
    fetchChats(venueId)
      .then((list) => setChats(Array.isArray(list) ? list : []))
      .catch(() => setChatsError(true))
      .finally(() => setChatsLoading(false));
  }, [userId, venueId]);

  useEffect(() => {
    if (!userId) return undefined;
    reloadChats();
    connectSocket(userId);
    return () => unsubscribeFromMessages();
  }, [userId, reloadChats]);

  useEffect(() => {
    activeRef.current = activeChat;
    subscribeToMessages((newMessage) => {
      if (activeChat && newMessage.chatId === activeChat._id) {
        setMessages((prev) => [...prev, newMessage]);
      }
      // Keep the list preview current for any conversation
      setChats((prev) =>
        prev.map((c) =>
          c._id === newMessage.chatId
            ? { ...c, lastMessage: { text: newMessage.text, timestamp: newMessage.timestamp } }
            : c
        )
      );
    });

    return () => unsubscribeFromMessages();
  }, [activeChat]);

  const loadMessagesFor = useCallback((chat) => {
    const id = ++requestId.current;
    setMessagesLoading(true);
    setMessagesError(false);
    fetchMessages(chat._id)
      .then((list) => {
        if (id === requestId.current) setMessages(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (id === requestId.current) setMessagesError(true);
      })
      .finally(() => {
        if (id === requestId.current) setMessagesLoading(false);
      });
  }, []);

  const loadMessages = useCallback(
    (chat) => {
      setActiveChat(chat);
      setMessages([]);
      loadMessagesFor(chat);
    },
    [loadMessagesFor]
  );

  const retryMessages = useCallback(() => {
    if (activeRef.current) loadMessagesFor(activeRef.current);
  }, [loadMessagesFor]);

  const sendNewMessage = (text) => {
    if (!activeChat) return;
    const message = {
      chatId: activeChat._id,
      sender: currentUser._id,
      receiver: activeChat.participants.find((p) => p._id !== currentUser._id)?._id,
      text,
      timestamp: new Date().toISOString(),
    };
    sendMessage(message);
    setMessages((prev) => [...prev, message]);
    setChats((prev) =>
      prev.map((c) => (c._id === message.chatId ? { ...c, lastMessage: { text, timestamp: message.timestamp } } : c))
    );
  };

  // Stable, so effects that start a chat do not run again on every render.
  const startChatWith = useCallback(
    async (participantId) => {
      setStartError(false);
      try {
        const chat = await createOrGetChat(participantId, venueId);
        setChats((prev) => (prev.some((c) => c._id === chat._id) ? prev : [...prev, chat]));
        loadMessages(chat);
        return chat; // Return chat so caller can use it
      } catch {
        setStartError(true);
        return null;
      }
    },
    [venueId, loadMessages]
  );

  // Lets a small-screen layout go back from a thread to the conversation list.
  const closeChat = useCallback(() => setActiveChat(null), []);

  return {
    chats,
    chatsLoading,
    chatsError,
    reloadChats,
    activeChat,
    messages,
    messagesLoading,
    messagesError,
    retryMessages,
    startError,
    loadMessages,
    sendNewMessage,
    startChatWith,
    closeChat,
  };
}
