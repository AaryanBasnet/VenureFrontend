import { useContext } from "react";
import { ArrowLeft, MessageCircle } from "lucide-react";
import ChatList from "../../components/ChatList";
import ChatBox from "../../components/ChatBox";
import { AuthContext } from "../../auth/AuthProvider";
import { useChat } from "../../hooks/useChat";
import { PageHeader, EmptyState } from "../../components/dashboard/ui";

export default function OwnerChatPage() {
  const { user } = useContext(AuthContext);
  const { chats, activeChat, messages, loadMessages, sendNewMessage, closeChat } = useChat(user);

  const customerName =
    activeChat?.participants
      ?.filter((p) => p._id !== user?._id)
      .map((p) => p.name)
      .filter(Boolean)
      .join(", ") || "Customer";

  return (
    <>
      <PageHeader
        eyebrow="Messages"
        title="Customer conversations"
        description="Questions from customers who messaged you from your venue pages."
      />

      <div className="grid h-[calc(100vh-17rem)] min-h-[480px] overflow-hidden rounded-card-xl border border-line bg-white grid-cols-[minmax(0,1fr)] md:grid-cols-[320px_minmax(0,1fr)]">
        <div className={`${activeChat ? "hidden md:block" : ""} min-h-0 border-line md:border-r`}>
          {chats.length === 0 ? (
            <EmptyState icon={MessageCircle} title="No conversations yet">
              No conversations yet. When a customer messages you from your venue page, it appears here.
            </EmptyState>
          ) : (
            <ChatList chats={chats} activeChat={activeChat} onSelect={loadMessages} currentUserId={user?._id} />
          )}
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
                <h2 className="truncate font-display text-h5 font-normal text-ink">{customerName}</h2>
              </div>
              <div className="min-h-0 flex-1">
                <ChatBox
                  key={activeChat._id}
                  messages={messages}
                  onSend={sendNewMessage}
                  activeChat={activeChat}
                  currentUserId={user?._id}
                />
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
    </>
  );
}
