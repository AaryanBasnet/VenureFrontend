// Backwards-compatible re-export bridge.
// The canonical singleton now lives in src/lib/socket.js.
// All existing imports (useChat, legacy hooks) continue to resolve to the
// same single io() instance — no duplicate connections.
export {
  connectSocket,
  sendMessage,
  markChatSeen,
  subscribeToSeen,
  unsubscribeFromSeen,
  subscribeToMessages,
  unsubscribeFromMessages,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  disconnectSocket,
  default,
} from "../lib/socket";
