/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import type { UserType } from "@/types/auth.type";
import type {
  ChatType,
  CreateChatType,
  CreateMessageType,
  MessageType,
} from "@/types/chat.type";
import { API } from "@/lib/axios-client";
import { toast } from "sonner";
import { useAuth } from "./use-auth";
import { generateUUID } from "@/lib/helper";

interface ChatState {
  chats: ChatType[];
  users: UserType[];
  singleChat: {
    chat: ChatType;
    messages: MessageType[];
  } | null;

  currentAIStreamId: string | null; // tracks which AI message is currently streaming

  isChatsLoading: boolean;
  isUsersLoading: boolean;
  isCreatingChat: boolean;
  isSingleChatLoading: boolean;
  isSendingMsg: boolean;

  fetchAllUsers: () => void;
  fetchChats: () => void;
  createChat: (payload: CreateChatType) => Promise<ChatType | null>;
  fetchSingleChat: (chatId: string) => void;
  sendMessage: (payload: CreateMessageType, isAIChat?: boolean) => void;

  addNewChat: (newChat: ChatType) => void;
  updateChatLastMessage: (chatId: string, lastMessage: MessageType) => void;
  addNewMessage: (chatId: string, message: MessageType) => void;
  addOrUpdateMessage: (
    chatId: string,
    message: MessageType,
    tempId?: string
  ) => void;
}

export const useChat = create<ChatState>()((set, get) => ({
  chats: [],
  users: [],
  singleChat: null,
  currentAIStreamId: null,

  isChatsLoading: false,
  isUsersLoading: false,
  isCreatingChat: false,
  isSingleChatLoading: false,
  isSendingMsg: false,

  fetchAllUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const { data } = await API.get("/user/all");
      set({ users: data.users });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  fetchChats: async () => {
    set({ isChatsLoading: true });
    try {
      const { data } = await API.get("/chat/all");
      set({ chats: data.chats });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch chats");
    } finally {
      set({ isChatsLoading: false });
    }
  },

  createChat : async (payload: CreateChatType) => {
    set({ isCreatingChat: true });
    try {
      const response = await API.post("/chat/create", payload);
      get().addNewChat(response.data.chat);
      toast.success("Chat created successfully");
      return response.data.chat;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create chat");
      return null;
    } finally {
      set({ isCreatingChat: false });
    }
  },

  fetchSingleChat: async (chatId: string) => {
    set({ isSingleChatLoading: true });
    try {
      const { data } = await API.get(`/chat/${chatId}`);
      set({ singleChat: data, currentAIStreamId: null }); // reset AI stream tracking
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch chat");
    } finally {
      set({ isSingleChatLoading: false });
    }
  },

  sendMessage: async (payload: CreateMessageType, isAIChat?: boolean) => {
    set({ isSendingMsg: true });
    const { chatId, replyTo, content, image } = payload;
    const { user } = useAuth.getState();
    const chat = get().singleChat?.chat;
    const aiSender = chat?.participants.find((p) => p.isAI);

    if (!chatId || !user?._id) return;

    const tempUserId = generateUUID();
    const tempAIId = generateUUID();

    const tempMessage: MessageType = {
      _id: tempUserId,
      chatId,
      content: content || "",
      image: image || null,
      sender: user,
      replyTo: replyTo || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: !isAIChat ? "sending..." : "",
    };

    get().addOrUpdateMessage(chatId, tempMessage, tempUserId);

    if (isAIChat && aiSender) {
      const tempAIMessage: MessageType = {
        _id: tempAIId,
        chatId,
        content: "",
        sender: aiSender,
        image: null,
        replyTo: null,
        streaming: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      get().addOrUpdateMessage(chatId, tempAIMessage, tempAIId);
      set({ currentAIStreamId: tempAIId }); // Track which message is streaming
    }

    try {
      const { data } = await API.post("/chat/message/send", {
        chatId,
        content,
        image,
        replyToId: replyTo?._id,
      });

      const { userMessage, aiResponse } = data;
      get().addOrUpdateMessage(chatId, userMessage, tempUserId);

      if (isAIChat && aiResponse) {
        get().addOrUpdateMessage(chatId, aiResponse, tempAIId);
        set({ currentAIStreamId: aiResponse._id });
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to send message");
    } finally {
      set({ isSendingMsg: false });
    }
  },

  addNewChat: (newChat: ChatType) => {
  set((state) => {
    const existingChat = state.chats.find((c) => c._id === newChat._id);

    if (existingChat) {
      // Merge correctly to avoid replacing data with stale or empty one
      const mergedChat = {
        ...existingChat,
        ...newChat,
        lastMessage: newChat.lastMessage || existingChat.lastMessage,
      };

      // Move to top
      return {
        chats: [mergedChat, ...state.chats.filter((c) => c._id !== newChat._id)],
      };
    }

    // Add new chat normally
    return { chats: [newChat, ...state.chats] };
  });
},
 

  // addNewChat: (newChat: ChatType) => {
  //   set((state) => {
  //     const exists = state.chats.find((c) => c._id === newChat._id);
  //     const chats = exists
  //       ? [newChat, ...state.chats.filter((c) => c._id !== newChat._id)]
  //       : [newChat, ...state.chats];
  //     return { chats };
  //   });
  // },

  // updateChatLastMessage: (chatId, lastMessage) => {
  //   set((state) => {
  //     const chat = state.chats.find((c) => c._id === chatId);
  //     if (!chat) return state;
  //     return {
  //       chats: [
  //         { ...chat, lastMessage },
  //         ...state.chats.filter((c) => c._id !== chatId),
  //       ],
  //     };
  //   });
  // },

  updateChatLastMessage: (chatId, lastMessage) => {
  set((state) => {
    const existingChat = state.chats.find((c) => c._id === chatId);
    if (!existingChat) return state;

    // Prevent duplicate or same message updates
    if (existingChat.lastMessage?._id === lastMessage?._id) {
      return state;
    }

    const updatedChat = { ...existingChat, lastMessage };
    return {
      chats: [updatedChat, ...state.chats.filter((c) => c._id !== chatId)],
    };
  });
},

  addNewMessage: (chatId, message) => {
    const chat = get().singleChat;
    if (chat?.chat._id === chatId) {
      set({
        singleChat: {
          chat: chat.chat,
          messages: [...chat.messages, message],
        },
      });
    }
  },

  addOrUpdateMessage: (chatId, msg, tempId) => {
    const singleChat = get().singleChat;
    if (!singleChat || singleChat.chat._id !== chatId) return;

    const messages = singleChat.messages;
    const msgIndex = tempId
      ? messages.findIndex((m) => m._id === tempId)
      : messages.findIndex((m) => m._id === msg._id);

    const updatedMessages =
      msgIndex !== -1
        ? messages.map((m, i) => (i === msgIndex ? { ...msg } : m))
        : [...messages, msg];

    set({
      singleChat: {
        chat: singleChat.chat,
        messages: updatedMessages,
      },
    });
  },
}));
