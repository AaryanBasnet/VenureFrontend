import api from "../api/api";

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5051";

// One connection shared for the whole app, created the first time something needs it. The socket.io client is a
// separate download (about 25 KB gzipped), so visitors who only browse never pay for it: calls made before it has
// arrived are queued and replayed in order.
//
// The server authenticates every handshake. Because the API may live on another site (where the HTTP-only cookie isn't
// sent), we fetch a short-lived socket token over the authenticated REST API. Passing `auth` as a function re-runs it
// on every reconnect, so a fresh token is used each time.
let instance = null;
let loading = null;
const queue = [];

const load = () => {
  loading ??= import("socket.io-client").then(({ io }) => {
    instance = io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
      auth: (cb) => {
        api
          .get("/auth/socket-token")
          .then((res) => cb({ token: res.data.data.token }))
          .catch(() => cb({}));
      },
    });
    queue.splice(0).forEach((run) => run(instance));
    return instance;
  });
  return loading;
};

const whenReady = (run) => {
  if (instance) run(instance);
  else {
    queue.push(run);
    load();
  }
};

/**
 * Opens the connection. The server places the user in their private room based on the
 * verified token, so no user id is sent from the client.
 */
export const connectSocket = () => {
  whenReady((socket) => {
    if (!socket.connected && !socket.active) socket.connect();
  });
};

// Only chatId and text are used by the server; sender/receiver come from the session and chat
export const sendMessage = ({ chatId, text }) => whenReady((socket) => socket.emit("sendMessage", { chatId, text }));

// Tell the server the open conversation has been read; the sender is then told "seen"
export const markChatSeen = (chatId) => whenReady((socket) => socket.emit("markSeen", { chatId }));
export const subscribeToSeen = (callback) => whenReady((socket) => socket.on("messagesSeen", callback));
export const unsubscribeFromSeen = () => off("messagesSeen");

export const subscribeToMessages = (callback) => whenReady((socket) => socket.on("receiveMessage", callback));
export const unsubscribeFromMessages = () => off("receiveMessage");

export const subscribeToNotifications = (callback) => whenReady((socket) => socket.on("newNotification", callback));
export const unsubscribeFromNotifications = () => off("newNotification");

// Removing listeners never needs to start the download: if it has not begun, nothing was added
function off(event, callback) {
  if (instance || loading) whenReady((socket) => (callback ? socket.off(event, callback) : socket.off(event)));
}

export const disconnectSocket = () => {
  if (instance || loading) {
    whenReady((socket) => {
      if (socket.connected || socket.active) socket.disconnect();
    });
  }
};

// The same calls as a socket.io socket, for code that listens to events directly
const socketFacade = {
  on: (event, callback) => whenReady((socket) => socket.on(event, callback)),
  off,
  emit: (event, ...args) => whenReady((socket) => socket.emit(event, ...args)),
};

export default socketFacade;
