import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Search,
  Send,
  Settings,
  Users,
  Menu,
  X,
} from "lucide-react";
import { brainwaveSymbol } from "../assets";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI("AIzaSyCsGnw4SyIKqTjhwdJHb1WUMbGKLC2l2M4");

function ChatPage() {
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [currentMessage, setCurrentMessage] = useState("");
  const [analysisData, setAnalysisData] = useState(null);
  const [activeChat, setActiveChat] = useState(1);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const [chats, setChats] = useState(() => {
    const savedChats = localStorage.getItem("chats");
    return savedChats
      ? JSON.parse(savedChats)
      : [
          {
            id: 1,
            name: "KalRav",
            lastMessage: "",
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            unread: 2,
            avatar: { brainwaveSymbol },
            messages: [
              {
                id: 1,
                text: "Hi there! How are you feeling today?",
                sender: "other",
                time: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              },
            ],
          },
        ];
  });

  useEffect(() => {
    localStorage.setItem("chats", JSON.stringify(chats));
    scrollToBottom();
  }, [chats]);

  const activeConversation = chats.find((chat) => chat.id === activeChat);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;

    const userMessage = {
      id: activeConversation.messages.length + 1,
      text: currentMessage,
      sender: "user",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === activeChat
          ? {
              ...chat,
              messages: [...chat.messages, userMessage],
              lastMessage: currentMessage,
            }
          : chat
      )
    );

    setCurrentMessage("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/process_input",
        {
          sentence: userMessage.text,
        }
      );

      setAnalysisData(response.data);

      const contextPrompt =
        "You now need to act like a professional mental health expert...";
      const prompt =
        activeConversation.messages.length === 1
          ? contextPrompt
          : userMessage.text;
      const result = await model.generateContent(prompt);
      const resp = await result.response;
      const textres = resp.text();

      const botMessage = {
        id: activeConversation.messages.length + 2,
        text: textres,
        sender: "other",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === activeChat
            ? { ...chat, messages: [...chat.messages, botMessage] }
            : chat
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="h-screen flex bg-gray-900">
      <div className="flex-1 flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-900">
          {activeConversation.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] ${
                  message.sender === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-white"
                } px-4 py-2 rounded-lg`}
              >
                <p>{message.text}</p>
                <span className="text-xs block mt-1 text-gray-400">
                  {message.time}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSendMessage}
          className="bg-gray-800 border-t border-gray-700 p-4 flex gap-4"
        >
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-600 bg-gray-900 text-white rounded-lg focus:outline-none"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatPage;
