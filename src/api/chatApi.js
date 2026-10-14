import instance from "./api";

// The backend wraps every response as { success, data }; these return just the data.

// Get all chats for logged-in user, optionally filtered by venueId
export const fetchChats = async (venueId) => {
  const query = venueId ? `?venueId=${venueId}` : "";
  return (await instance.get(`/chats${query}`)).data.data;
};

// Get or create chat between user and participant, scoped to a venue
export const createOrGetChat = async (participantId, venueId) =>
  (await instance.post("/chats", { participantId, venueId })).data.data;

// Get messages for a specific chat
export const fetchMessages = async (chatId) => (await instance.get(`/chats/${chatId}/messages`)).data.data;
