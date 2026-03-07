'use client';

import { useState, useEffect, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import { MessageBubble } from './MessageBubble';
import { VoiceControls } from './VoiceControls';
import { Mic, Send, Trash2, LogOut } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatInterfaceProps {
  user: User;
}

export function ChatInterface({ user }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`/chat/api/memory?userId=${user.id}`);
      const data = await response.json();
      
      if (data.messages) {
        setMessages(
          data.messages.map((msg: any, idx: number) => ({
            id: `${msg.timestamp}-${idx}`,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/chat/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (data.response) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Apologies... my neural pathways seem disrupted. Please try again.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleClearHistory = async () => {
    if (!confirm('Clear all conversation history?')) return;

    try {
      await fetch('/chat/api/memory', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      setMessages([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="mech-panel m-4 mb-0 flex items-center justify-between">
        <div>
          <h1 className="neon-text text-2xl font-barlow font-bold">AILEEN MACHINA</h1>
          <p className="text-xs text-gray-400 mt-1">Neural link established • {user.email}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsVoiceMode(!isVoiceMode)}
            className="metal-button !p-2"
            title={isVoiceMode ? 'Text mode' : 'Voice mode'}
          >
            <Mic className={isVoiceMode ? 'text-neon-cyan' : ''} size={20} />
          </button>
          <button
            onClick={handleClearHistory}
            className="metal-button !p-2"
            title="Clear history"
          >
            <Trash2 size={20} />
          </button>
          <button
            onClick={handleLogout}
            className="metal-button !p-2"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            <p className="neon-text text-xl mb-2">Welcome to the neural link...</p>
            <p className="text-sm">I'm Aileen. What brings you here today?</p>
          </div>
        )}
        
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="mech-panel inline-block">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse delay-100"></div>
                <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse delay-200"></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <footer className="p-4">
        {isVoiceMode ? (
          <VoiceControls onTranscript={sendMessage} />
        ) : (
          <form onSubmit={handleSubmit} className="mech-panel flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 bg-transparent border-none outline-none text-gray-200 placeholder-gray-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="metal-button !p-2 disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </form>
        )}
      </footer>
    </div>
  );
}
