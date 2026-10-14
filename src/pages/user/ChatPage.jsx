import { useContext, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { ArrowLeft, MessageCircle } from "lucide-react";
import ChatList from "../../components/ChatList";
import ChatBox from "../../components/ChatBox";
import { AuthContext } from "../../auth/AuthProvider";
import { useChat } from "../../hooks/useChat";

export default function ChatPage() {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const participantId = new URLSearchParams(location.search).get("user");
  const openChatId = location.state?.chatId;
  const autoOpened = useRef(false);
  const { chats, activeChat, messages, loadMessages, sendNewMessage, startChatWith, closeChat } = useChat(user);

  useEffect(() => {
    if (participantId && user?._id) startChatWith(participantId);
  }, [participantId, user?._id, startChatWith]);

  // Arriving from "Message the venue": open that conversation straight away.
  useEffect(() => {
    if (!openChatId || autoOpened.current) return;
    const chat = chats.find((c) => c._id === openChatId);
    if (chat) {
      autoOpened.current = true;
      loadMessages(chat);
    }
  }, [openChatId, chats, loadMessages]);

  const otherNames = activeChat?.participants?.filter((p) => p._id !== user?._id).map((p) => p.name).filter(Boolean).join(", ");

  return (
    <div className="bg-cream">
    <div className="container-site pb-16 pt-8">
      <p className="font-body text-eyebrow uppercase text-gold-800">Messages</p>
      <h1 className="mt-2 font-display text-h2 font-light text-ink">Your conversations</h1>

      <div className="mt-6 grid h-[min(75vh,720px)] min-h-[460px] overflow-hidden rounded-card-xl border border-line bg-white md:grid-cols-[320px_1fr]">
        <div className={`${activeChat ? "hidden md:block" : ""} min-h-0 border-line md:border-r`}>
          <ChatList chats={chats} activeChat={activeChat} onSelect={loadMessages} currentUserId={user?._id} />
        </div>

        <div className={`${activeChat ? "flex" : "hidden md:flex"} min-h-0 flex-col`}>
          {activeChat ? (
            <>
              <div className="flex items-center gap-3 border-b border-line bg-white px-4 py-3">
                <button
                  type="button"
                  onClick={closeChat}
                  aria-label="Back to conversations"
                  className="rounded-full p-2 text-taupe hover:bg-sand hover:text-ink focus-visible:outline-2 focus-visible:outline-ink md:hidden"
                >
                  <ArrowLeft aria-hidden="true" className="size-5" />
                </button>
                <h2 className="truncate font-display text-h5 font-normal text-ink">{otherNames || "Conversation"}</h2>
              </div>
              <div className="min-h-0 flex-1">
                <ChatBox messages={messages} onSend={sendNewMessage} activeChat={activeChat} currentUserId={user?._id} />
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center bg-cream p-8 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-gold-100 text-gold-800">
                <MessageCircle aria-hidden="true" className="size-6" strokeWidth={1.5} />
              </span>
              <p className="mt-4 font-display text-h5 font-normal text-ink">Choose a conversation</p>
              <p className="mt-1 font-body text-small text-taupe">Pick one from the list to read and reply.</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
