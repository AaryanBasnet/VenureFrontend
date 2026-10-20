import { io } from "socket.io-client";
import api from "../api/api";

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5051";

// Module-level singleton — one connection shared for the entire app lifetime.
// autoConnect: false means AuthProvider controls when the connection opens.
//
// The server authenticates every handshake. Because the API may live on another site
// (where the HTTP-only cookie isn't sent), we fetch a short-lived socket token over the
// authenticated REST API. Passing `auth` as a function re-runs it on every reconnect,
// so a fresh token is used each time.
const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  auth: (cb) => {
    api
      .get("/auth/socket-token")
      .then((res) => cb({ token: res.data.data.token }))
      .catch(() => cb({}));
  },
});

/**
 * Opens the connection. The server places the user in their private room based on the
 * verified token, so no user id is sent from the client.
 */
export const connectSocket = () => {
  if (!socket.connected && !socket.active) {
    socket.connect();
  }
};

// Only chatId and text are used by the server; sender/receiver come from the session and chat
export const sendMessage = ({ chatId, text }) => socket.emit("sendMessage", { chatId, text });

// Tell the server the open conversation has been read; the sender is then told "seen"
export const markChatSeen = (chatId) => socket.emit("markSeen", { chatId });
export const subscribeToSeen = (callback) => socket.on("messagesSeen", callback);
export const unsubscribeFromSeen = () => socket.off("messagesSeen");

export const subscribeToMessages = (callback) =>
  socket.on("receiveMessage", callback);
export const unsubscribeFromMessages = () => socket.off("receiveMessage");

export const subscribeToNotifications = (callback) =>
  socket.on("newNotification", callback);
export const unsubscribeFromNotifications = () =>
  socket.off("newNotification");

export const disconnectSocket = () => {
  if (socket.connected || socket.active) socket.disconnect();
};

export default socket;
