import { useState, useEffect, useCallback } from "react";
import {
  fetchChats,
  fetchMessages,
  createOrGetChat,
} from "../api/chatApi";
import {
  connectSocket,
  sendMessage,
  subscribeToMessages,
  unsubscribeFromMessages,
} from "../utils/socket";

export function useChat(currentUser, venueId = null) {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    fetchChats(venueId).then(setChats).catch(() => setChats([]));
    connectSocket(currentUser._id);

    return () => unsubscribeFromMessages();
  }, [currentUser, venueId]);

  useEffect(() => {
    subscribeToMessages((newMessage) => {
      if (activeChat && newMessage.chatId === activeChat._id) {
        setMessages((prev) => [...prev, newMessage]);
      }
    });

    return () => unsubscribeFromMessages();
  }, [activeChat]);

  const loadMessages = useCallback(
    (chat) => {
      setActiveChat(chat);
      fetchMessages(chat._id).then(setMessages).catch(() => setMessages([]));
    },
    []
  );

  const sendNewMessage = (text) => {
    if (!activeChat) return;
    const message = {
      chatId: activeChat._id,
      sender: currentUser._id,
      receiver: activeChat.participants.find((p) => p._id !== currentUser._id)._id,
      text,
    };
    sendMessage(message);
    setMessages((prev) => [...prev, message]);
  };

  const startChatWith = async (participantId) => {
    const chat = await createOrGetChat(participantId, venueId);
    if (!chats.find((c) => c._id === chat._id)) {
      setChats((prev) => [...prev, chat]);
    }
    loadMessages(chat);
    return chat; // Return chat so caller can use it
  };

  // Lets a small-screen layout go back from a thread to the conversation list.
  const closeChat = () => setActiveChat(null);

  return {
    chats,
    activeChat,
    messages,
    loadMessages,
    sendNewMessage,
    startChatWith,
    closeChat,
  };
}
