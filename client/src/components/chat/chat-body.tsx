import { useChat } from "@/hooks/use-chat";
import { useSocket } from "@/hooks/use-socket";
import type { MessageType } from "@/types/chat.type";
import { useEffect, useRef } from "react";
import ChatBodyMessage from "./chat-body-message";

interface Props {
  chatId: string | null;
  messages: MessageType[];
  onReply: (message: MessageType) => void;
}

const ChatBody = ({ chatId, messages, onReply }: Props) => {
  const { socket } = useSocket();
  const { addNewMessage, addOrUpdateMessage } = useChat();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const aiChunkRef = useRef<string>(""); // useRef avoids closure issues

  // --- Handle new incoming user/system messages ---
  useEffect(() => {
    if (!chatId || !socket) return;

    const handleNewMessage = (msg: MessageType) => {
      addNewMessage(chatId, msg);
    };

    socket.on("message:new", handleNewMessage);
    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [socket, chatId, addNewMessage]);

  // --- Handle AI streaming messages ---
  useEffect(() => {
    if (!chatId || !socket) return;

    const handleAIStream = ({
      chatId: streamChatId,
      chunk,
      done,
      message,
    }: any) => {
      if (streamChatId !== chatId) return;

      const lastMsg = messages.at(-1);
      if (!lastMsg) return;

      // When AI starts streaming a new response — reset ref
      if (!aiChunkRef.current && !done && chunk?.trim()) {
        //console.log("When AI starts streaming a new response is:",)
        aiChunkRef.current = "";
        console.log("When AI starts streaming a new response is:",aiChunkRef.current);
      }

      if (chunk?.trim() && !done) {
        aiChunkRef.current += chunk;
        console.log("aiChunkRef.current is:",aiChunkRef.current);
        addOrUpdateMessage(
          chatId,
          {
            ...lastMsg,
            content: aiChunkRef.current,
            streaming: true,
          } as MessageType,
          lastMsg._id
        );
      }

      // When AI finishes sending message
      if (done) {
        addOrUpdateMessage(
          chatId,
          {
            ...message,
            streaming: false,
          } as MessageType,
          message._id
        );

        aiChunkRef.current = ""; // reset after completion
        console.log("✅ AI Completed full message:", message);
      }
    };

    socket.on("chat:ai", handleAIStream);

    return () => {
      socket.off("chat:ai", handleAIStream);
    };
  }, [socket, chatId, messages, addOrUpdateMessage]);

  // --- Auto-scroll to bottom on new messages ---
  useEffect(() => {
    if (!messages.length) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col px-3 py-2">
      {messages.map((message) => (
        <ChatBodyMessage key={message._id || Math.random()} message={message} onReply={onReply} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatBody;
