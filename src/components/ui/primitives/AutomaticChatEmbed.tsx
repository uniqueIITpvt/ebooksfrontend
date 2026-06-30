'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { XMarkIcon, MinusIcon, ChevronUpIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface Message {
  id: string;
  role: 'bot' | 'user';
  text: string;
  time: string;
  links?: { label: string; href: string }[];
}

const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const SUGGESTED = [
  { icon: '🎧', text: 'Show me audiobooks' },
  { icon: '📚', text: 'Browse all books' },
  { icon: '📝', text: 'Show me free summaries' },
  { icon: '🛒', text: 'How do I place an order?' },
];

function getBotResponse(input: string): Omit<Message, 'id' | 'time' | 'role'> {
  const q = input.toLowerCase();

  if (q.match(/audiobook|audio book|listen/)) {
    return {
      text: 'We have a great collection of audiobooks! Browse all audiobooks, filter by category, and listen directly in your browser — no app needed.',
      links: [
        { label: '🎧 All Audiobooks', href: '/audiobooks' },
        { label: '📚 All Books', href: '/books' },
      ],
    };
  }
  if (q.match(/ebook|e-book|book(?!s)|pdf book/)) {
    return {
      text: 'Browse our full ebook collection — self-improvement, business, fiction, motivation and more. All delivered digitally!',
      links: [
        { label: '📚 All Books', href: '/books' },
        { label: '🎧 Audiobooks', href: '/audiobooks' },
      ],
    };
  }
  if (q.match(/books|browse/)) {
    return {
      text: 'Explore our full library of books and audiobooks across many categories!',
      links: [
        { label: '📚 All Books', href: '/books' },
        { label: '🎧 All Audiobooks', href: '/audiobooks' },
        { label: '📝 Free Summaries', href: '/free-summaries' },
      ],
    };
  }
  if (q.match(/category|categor|genre|topic/)) {
    return {
      text: 'We organize books and audiobooks by categories like Self Improvement, Motivation, Business, Fiction and more. Browse them here:',
      links: [
        { label: '📚 Browse Books', href: '/books' },
        { label: '🎧 Browse Audiobooks', href: '/audiobooks' },
      ],
    };
  }
  if (q.match(/order|buy|purchase|checkout|cart/)) {
    return {
      text: 'Placing an order is simple!\n1. Browse and add items to your cart\n2. Click "Place Order"\n3. Complete payment\n4. Get instant digital delivery!\n\nNeed help?',
      links: [
        { label: '🛒 Go to Cart', href: '/cart' },
        { label: '📚 Shop Books', href: '/books' },
        { label: '🎧 Shop Audiobooks', href: '/audiobooks' },
      ],
    };
  }
  if (q.match(/download|pdf|file|get book/)) {
    return {
      text: 'After purchase, your ebook is available for instant download from your order confirmation page. All ebooks are delivered digitally — no shipping required!',
      links: [
        { label: '📚 Shop Now', href: '/books' },
        { label: '🛒 Your Cart', href: '/cart' },
      ],
    };
  }
  if (q.match(/price|cost|how much|free|paid/)) {
    return {
      text: 'We offer books and audiobooks at great prices with frequent discounts. Free summaries are also available. Check out our collection:',
      links: [
        { label: '📚 Browse Books', href: '/books' },
        { label: '🎧 Browse Audiobooks', href: '/audiobooks' },
        { label: '📝 Free Summaries', href: '/free-summaries' },
      ],
    };
  }
  if (q.match(/summary|summaries/)) {
    return {
      text: 'We offer free and premium book summaries — get the key insights from bestselling books in minutes!',
      links: [
        { label: '📝 Free Summaries', href: '/free-summaries' },
        { label: '⭐ Premium Summaries', href: '/premium-summaries' },
      ],
    };
  }
  if (q.match(/login|sign in|signin/)) {
    return {
      text: 'Log in to access your purchases, wishlist, and orders.',
      links: [
        { label: '🔑 Login', href: '/user/login' },
        { label: '✍️ Sign Up', href: '/user/signup' },
      ],
    };
  }
  if (q.match(/signup|register|account|create/)) {
    return {
      text: 'Create a free account to access your purchases, wishlist, and track your orders.',
      links: [
        { label: '✍️ Sign Up Free', href: '/user/signup' },
        { label: '🔑 Already have an account? Login', href: '/user/login' },
      ],
    };
  }
  if (q.match(/help|support|contact/)) {
    return {
      text: "I'm here to help! Ask me anything about books, audiobooks, orders, or downloads.",
      links: [
        { label: '🏠 Home', href: '/' },
        { label: '📚 Books', href: '/books' },
        { label: '🎧 Audiobooks', href: '/audiobooks' },
      ],
    };
  }
  if (q.match(/hi|hello|hey|namaste|hii/)) {
    return {
      text: '👋 Hello! Welcome to UniqueIIT EbookStore. I can help you find books, audiobooks, or answer questions about your orders. What are you looking for?',
    };
  }
  if (q.match(/bestseller|best seller|popular|trending|top/)) {
    return {
      text: 'Check out our bestsellers and trending titles — handpicked for you!',
      links: [
        { label: '🔥 Popular Books', href: '/books' },
        { label: '🎧 Popular Audiobooks', href: '/audiobooks' },
      ],
    };
  }

  return {
    text: 'I can help you with books, audiobooks, summaries, orders, and more. Explore our store:',
    links: [
      { label: '📚 Books', href: '/books' },
      { label: '🎧 Audiobooks', href: '/audiobooks' },
      { label: '📝 Free Summaries', href: '/free-summaries' },
      { label: '🏠 Home', href: '/' },
    ],
  };
}

export default function AutomaticChatEmbed() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'bot',
      text: '👋 Welcome to UniqueIIT EbookStore!\n\nI can help you discover books, audiobooks, summaries and assist with orders. What are you looking for today?',
      time: now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => { setIsOpen(true); setIsMinimized(false); };
    window.addEventListener('openChatbot', handler);
    return () => window.removeEventListener('openChatbot', handler);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setStarted(true);

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: text.trim(), time: now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getBotResponse(text);
      const botMsg: Message = { id: (Date.now() + 1).toString(), role: 'bot', time: now(), ...response };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <>
      {/* ── Floating button ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open chat"
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 10,
            background: 'linear-gradient(135deg,#1e40af 0%,#4f46e5 100%)',
            borderRadius: 999, border: 'none', cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(37,99,235,.38)',
            transition: 'transform .2s, box-shadow .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(37,99,235,.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(37,99,235,.38)'; }}
        >
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,.1)', animation: 'chatBob 2s ease-in-out infinite' }}>
            <img src="/TechIITlogo.png" alt="UniqueIIT" width={38} height={38} style={{ width: 38, height: 38, objectFit: 'contain' }} />
          </div>
          <span style={{ position: 'absolute', top: 6, right: 6, width: 10, height: 10, background: '#22c55e', borderRadius: '50%', border: '2px solid #4f46e5' }} />
        </button>
      )}

      {/* ── Chat window ── */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: isMinimized ? 320 : 400,
          height: isMinimized ? 68 : 580,
          background: '#fff',
          borderRadius: 20,
          boxShadow: '0 24px 64px rgba(15,23,42,.18)',
          border: '1px solid #e2e8f0',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          transition: 'all .25s cubic-bezier(.4,0,.2,1)',
          fontFamily: 'var(--font-dm-sans,"DM Sans",sans-serif)',
        }}>

          {/* ── Header ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px', flexShrink: 0,
            background: 'linear-gradient(135deg,#1e40af 0%,#4f46e5 100%)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
                  <img src="/TechIITlogo.png" alt="UniqueIIT" width={36} height={36} style={{ width: 36, height: 36, objectFit: 'contain' }} />
                </div>
                <span style={{ position: 'absolute', bottom: -1, right: -1, width: 12, height: 12, background: '#22c55e', borderRadius: '50%', border: '2px solid #4f46e5' }} />
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>UniqueIIT Assistant</div>
                <div style={{ color: 'rgba(255,255,255,.72)', fontSize: 11, marginTop: 1 }}>
                  {isMinimized ? 'Click to open' : '● Online · Books & Audiobooks Support'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setIsMinimized(v => !v)} aria-label={isMinimized ? 'Expand' : 'Minimize'}
                style={{ background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: 7, padding: 5, cursor: 'pointer', color: '#fff', display: 'flex' }}>
                {isMinimized ? <ChevronUpIcon style={{ width: 16, height: 16 }} /> : <MinusIcon style={{ width: 16, height: 16 }} />}
              </button>
              <button onClick={() => setIsOpen(false)} aria-label="Close"
                style={{ background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: 7, padding: 5, cursor: 'pointer', color: '#fff', display: 'flex' }}>
                <XMarkIcon style={{ width: 16, height: 16 }} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* ── Messages ── */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 8px', display: 'flex', flexDirection: 'column', gap: 14, background: '#f8fafc' }}>

                {messages.map(msg => (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>

                    {/* Avatar */}
                    {msg.role === 'bot' && (
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#eff6ff', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bfdbfe' }}>
                        <img src="/TechIITlogo.png" alt="bot" width={26} height={26} style={{ width: 26, height: 26, objectFit: 'contain' }} />
                      </div>
                    )}

                    {/* Bubble */}
                    <div style={{ maxWidth: '74%' }}>
                      <div style={{
                        padding: '10px 13px',
                        borderRadius: msg.role === 'bot' ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                        background: msg.role === 'bot' ? '#fff' : '#2563eb',
                        color: msg.role === 'bot' ? '#1e293b' : '#fff',
                        fontSize: 13.5,
                        lineHeight: 1.65,
                        boxShadow: '0 1px 4px rgba(0,0,0,.06)',
                        whiteSpace: 'pre-wrap',
                      }}>
                        {msg.text}
                      </div>

                      {/* Links */}
                      {msg.links && msg.links.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                          {msg.links.map((lk, li) => (
                            <Link key={li} href={lk.href}
                              onClick={() => setIsOpen(false)}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '5px 11px',
                                background: '#eff6ff', color: '#1e40af',
                                border: '1px solid #bfdbfe',
                                borderRadius: 8, fontSize: 12, fontWeight: 600,
                                textDecoration: 'none',
                                transition: 'background .15s',
                              }}
                            >
                              {lk.label}
                            </Link>
                          ))}
                        </div>
                      )}

                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4, textAlign: msg.role === 'user' ? 'right' : 'left', paddingInline: 2 }}>
                        {msg.time}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#eff6ff', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bfdbfe' }}>
                      <img src="/TechIITlogo.png" alt="bot" width={26} height={26} style={{ width: 26, height: 26, objectFit: 'contain' }} />
                    </div>
                    <div style={{ background: '#fff', borderRadius: '4px 14px 14px 14px', padding: '12px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', display: 'flex', gap: 4, alignItems: 'center' }}>
                      {[0, 1, 2].map(i => (
                        <span key={i} style={{
                          width: 7, height: 7, borderRadius: '50%', background: '#94a3b8',
                          animation: 'chatDot 1.2s ease-in-out infinite',
                          animationDelay: `${i * 0.2}s`,
                          display: 'block',
                        }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested quick questions (first view only) */}
                {!started && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 4 }}>
                    {SUGGESTED.map((s, i) => (
                      <button key={i} onClick={() => sendMessage(s.text)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 9,
                          padding: '9px 13px',
                          background: '#fff', border: '1px solid #e2e8f0',
                          borderRadius: 10, cursor: 'pointer',
                          fontSize: 13, color: '#1e40af', fontWeight: 500,
                          textAlign: 'left', transition: 'background .15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                      >
                        <span style={{ fontSize: 16 }}>{s.icon}</span>{s.text}
                      </button>
                    ))}
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* ── Input bar ── */}
              <div style={{ padding: '10px 14px 14px', borderTop: '1px solid #f1f5f9', flexShrink: 0, background: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', padding: '8px 10px 8px 14px' }}>
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                    placeholder="Type your question here..."
                    style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 13, color: '#1e293b', outline: 'none', fontFamily: 'inherit' }}
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    aria-label="Send"
                    style={{
                      background: input.trim() ? '#2563eb' : '#cbd5e1',
                      border: 'none', borderRadius: 9, padding: '7px 9px',
                      cursor: input.trim() ? 'pointer' : 'default',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background .15s', flexShrink: 0,
                    }}
                  >
                    <PaperAirplaneIcon style={{ width: 15, height: 15, color: '#fff' }} />
                  </button>
                </div>
                <div style={{ textAlign: 'center', fontSize: 10, color: '#94a3b8', marginTop: 7 }}>
                  Powered by <strong style={{ color: '#64748b' }}>UniqueIIT Research Center</strong>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes chatDot {
          0%, 60%, 100% { transform: translateY(0); opacity: .4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes chatBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
}
