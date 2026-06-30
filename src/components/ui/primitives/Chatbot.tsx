'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  ChatBubbleLeftRightIcon, 
  XMarkIcon,
  PaperAirplaneIcon,
  BookOpenIcon,
  MagnifyingGlassIcon,
  SpeakerWaveIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const quickQuestions = [
  { icon: BookOpenIcon, text: "Find books on personal growth", query: "Show me books on personal development" },
  { icon: SpeakerWaveIcon, text: "Recommend audiobooks", query: "Recommend some popular audiobooks" },
  { icon: MagnifyingGlassIcon, text: "Search by category", query: "What book categories do you have?" },
  { icon: UserIcon, text: "How to subscribe?", query: "How do I get a premium subscription?" },
];

// Smart keyword-based response system
interface ResponsePattern {
  keywords: string[];
  response: string;
}

const responsePatterns: ResponsePattern[] = [
  {
    keywords: ['book', 'personal', 'development', 'growth', 'improvement'],
    response: "We have excellent books on personal growth! 📚 Check out our 'Personal Development' category featuring titles like 'How to Become a People Magnet', 'React to Nothing', and '6-Month Success Plan'. Visit /books to browse all titles!"
  },
  {
    keywords: ['audiobook', 'audio', 'listen', 'hear', 'sound'],
    response: "Our top audiobooks include: 🎧 'Art of Mental Training', 'Anxiety Relief', and Hindi titles like 'Vichar Kranti'. You can explore all audiobooks at /audiobooks. Many include sample previews!"
  },
  {
    keywords: ['category', 'categories', 'genre', 'type', 'kind'],
    response: "We offer books across multiple categories: 📖 Communication, Psychology, Mindset & Belief, Habits, Business, and more. We also have audiobooks in Hindi and English. Browse all at /books!"
  },
  {
    keywords: ['subscription', 'plan', 'premium', 'price', 'cost', 'pay', 'payment', 'money', 'rate'],
    response: "You can subscribe to our Premium plan for unlimited access to all books and audiobooks! 💎 Visit /subscription to see our plans starting at affordable rates. Premium members get exclusive content and early access to new releases!"
  },
  {
    keywords: ['price', 'prices', 'cost', 'how much', 'expensive', 'cheap', 'buy', 'purchase'],
    response: "Our books have various price points to suit every budget! 💰 Many start from just ₹99. Visit /books to see individual pricing, or check /subscription for unlimited access plans that offer great value!"
  },
  {
    keywords: ['about', 'what is', 'tell me', 'this app', 'ebook', 'application', 'website', 'uniqueiit'],
    response: "UniqueIIT Research Center is your one-stop destination for books and audiobooks! 🎯 We curate high-quality content across personal development, business, psychology, and more. Whether you prefer reading or listening, we have something for everyone!"
  },
  {
    keywords: ['help', 'support', 'contact', 'email', 'phone', 'reach'],
    response: "Need help? 🤝 You can reach us at support@uniqueiit.com or use the contact form on our website. We're here to assist you with any questions about books, subscriptions, or technical issues!"
  },
  {
    keywords: ['hindi', 'urdu', 'language', 'hindi book', 'hindi audio'],
    response: "Yes! We have content in Hindi too! 🇮🇳 Check out Hindi audiobooks like 'Vichar Kranti' and other regional language content. Visit /audiobooks and filter by language!"
  },
  {
    keywords: ['free', 'trial', 'sample', 'preview', 'try'],
    response: "Many of our audiobooks come with free samples! 🎁 You can preview before you buy. We also occasionally run promotions - sign up for our newsletter to stay updated on free content and discounts!"
  }
];

const defaultResponses = [
  "I'd be happy to help! Could you tell me more specifically what you're looking for? Try asking about books, audiobooks, categories, or subscription plans! 📚",
  "Great question! I can help you find books, explore audiobooks, or learn about subscription plans. What would you like to know more about? 🤔",
  "Thanks for reaching out! I can assist with book recommendations, audiobook suggestions, pricing info, or subscription details. What interests you? 💡",
  "I'm here to help! Try asking about specific topics like 'personal development books', 'audiobooks in Hindi', or 'subscription prices' for better results! 🎯"
];

function getSmartResponse(input: string): string {
  const lowerInput = input.toLowerCase();
  
  // Check for keyword matches
  for (const pattern of responsePatterns) {
    if (pattern.keywords.some(keyword => lowerInput.includes(keyword))) {
      return pattern.response;
    }
  }
  
  // Return random default response for variety
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for open chatbot event
  useEffect(() => {
    const handleOpenChatbot = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };

    window.addEventListener('openChatbot', handleOpenChatbot);
    return () => window.removeEventListener('openChatbot', handleOpenChatbot);
  }, []);

  // Initial welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = "Welcome to UniqueIIT Research Center! 📚🎧 I'm here to help you discover books and audiobooks that can transform your life. What are you interested in? Personal growth, communication skills, or perhaps something else?";
      addBotMessage(welcomeMessage);
    }
  }, [isOpen]);

  const addBotMessage = (text: string) => {
    setIsTyping(true);
    setTimeout(() => {
      const newMessage: Message = {
        id: Date.now().toString(),
        text,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleSendMessage = (text: string = inputValue.trim()) => {
    if (!text) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Get smart bot response based on keywords
    const response = getSmartResponse(text);
    addBotMessage(response);
  };

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const minimizeChatbot = () => {
    setIsMinimized(true);
  };

  const restoreChatbot = () => {
    setIsMinimized(false);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={toggleChatbot}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-4 rounded-full shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-110 group animate-pulse"
          aria-label="Open chat"
        >
          <ChatBubbleLeftRightIcon className="w-6 h-6" />
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
            !
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 flex flex-col ${
          isMinimized ? 'w-80 h-16' : 'w-[420px] h-[620px]'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-2xl flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h3 className="font-semibold text-sm">UniqueIIT Assistant</h3>
                <p className="text-xs text-blue-100">Book & Audiobook Guide</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!isMinimized && (
                <button
                  onClick={minimizeChatbot}
                  className="text-white/80 hover:text-white transition-colors"
                  aria-label="Minimize chat"
                >
                  <span className="text-lg leading-none">−</span>
                </button>
              )}
              <button
                onClick={isMinimized ? restoreChatbot : toggleChatbot}
                className="text-white/80 hover:text-white transition-colors"
                aria-label={isMinimized ? "Restore chat" : "Close chat"}
              >
                {isMinimized ? (
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                ) : (
                  <XMarkIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-800 rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl rounded-bl-none px-4 py-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Questions */}
              {messages.length <= 2 && (
                <div className="px-4 pb-2">
                  <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {quickQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(q.query)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs hover:bg-blue-100 transition-colors"
                      >
                        <q.icon className="w-3 h-3" />
                        {q.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask about books, audiobooks..."
                    className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || isTyping}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 text-center mt-2">
                  Powered by UniqueIIT Research Center
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
