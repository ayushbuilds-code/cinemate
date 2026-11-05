import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Sparkles, Smile } from 'lucide-react';
import { Socket } from 'socket.io-client';
import { ChatMessage } from '../../types';

interface ChatPanelProps {
  socket: Socket | null;
  roomId: string;
  currentParticipantId: string;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onSendReaction: (emoji: string) => void;
}

const EMOJI_LIST = ['❤️', '😂', '🍿', '🔥', '😱', '👏', '🎉', '🥺'];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  socket,
  roomId,
  currentParticipantId,
  messages,
  onSendMessage,
  onSendReaction,
}) => {
  const [inputText, setInputText] = useState('');
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Auto scroll to latest
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  // Listen to typing indicators
  useEffect(() => {
    if (!socket) return;

    const onTyping = (data: { participantId: string; displayName: string }) => {
      if (data.participantId !== currentParticipantId) {
        setTypingUser(data.displayName);
      }
    };

    const onStopTyping = (data: { participantId: string }) => {
      if (data.participantId !== currentParticipantId) {
        setTypingUser(null);
      }
    };

    socket.on('chat:typing', onTyping);
    socket.on('chat:stop-typing', onStopTyping);

    return () => {
      socket.off('chat:typing', onTyping);
      socket.off('chat:stop-typing', onStopTyping);
    };
  }, [socket, currentParticipantId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (socket) {
      socket.emit('chat:typing', { roomId });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('chat:stop-typing', { roomId });
      }, 1500);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
    if (socket) {
      socket.emit('chat:stop-typing', { roomId });
    }
  };

  return (
    <div className="bg-[#181824] border border-slate-800 rounded-2xl flex flex-col h-[320px] shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-[#11111B]/60">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Live Chat</h3>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">End-to-End Room</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 gap-1">
            <span className="text-2xl">🍿</span>
            <p className="text-xs font-medium">Say hi to your watch buddy!</p>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.isSystem) {
              return (
                <div key={msg.id} className="text-center my-1">
                  <span className="inline-block text-[11px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
                    {msg.text}
                  </span>
                </div>
              );
            }

            const isMine = msg.senderId === currentParticipantId;

            return (
              <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[10px] font-semibold text-slate-400">{isMine ? 'You' : msg.senderName}</span>
                  <span className="text-[9px] text-slate-600">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div
                  className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words shadow-sm ${
                    isMine
                      ? 'bg-purple-600 text-white rounded-tr-none'
                      : 'bg-[#11111B] text-slate-200 border border-slate-800 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        {typingUser && (
          <div className="text-[11px] text-slate-400 italic animate-pulse">
            {typingUser} is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emoji Reactions */}
      <div className="px-3 py-1.5 border-t border-slate-800/60 bg-[#11111B]/40 flex items-center gap-1.5 overflow-x-auto">
        <span className="text-[10px] text-slate-500 font-medium px-1">React:</span>
        {EMOJI_LIST.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSendReaction(emoji)}
            className="hover:scale-125 active:scale-95 transition-transform text-sm p-1 cursor-pointer"
            title={`Send ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-800/80 bg-[#11111B]/80 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Type a message..."
          maxLength={1000}
          className="flex-1 bg-[#181824] border border-slate-800 focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="w-8 h-8 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

