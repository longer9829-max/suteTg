import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Chat, Message } from '../types';
import { useAuth } from '../hooks/useAuth';
import { Send, Hash, MessageSquare, Plus, Check, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Messenger() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatName, setNewChatName] = useState('');

  // Fetch Chats
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'chats'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
      setChats(chatList);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'chats'));
    return () => unsubscribe();
  }, [user]);

  // Fetch Messages for Active Chat
  useEffect(() => {
    if (!activeChat) return;
    const q = query(collection(db, 'chats', activeChat.id, 'messages'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgList);
    }, (error) => handleFirestoreError(error, OperationType.GET, `chats/${activeChat.id}/messages`));
    return () => unsubscribe();
  }, [activeChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !user) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const msgData = {
        text: messageContent,
        senderId: user.uid,
        senderName: user.displayName || 'Anonymous',
        createdAt: serverTimestamp(),
        chatId: activeChat.id
      };
      
      await addDoc(collection(db, 'chats', activeChat.id, 'messages'), msgData);
      
      // Update chat last message
      await updateDoc(doc(db, 'chats', activeChat.id), {
        lastMessageVisible: messageContent,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `chats/${activeChat.id}/messages`);
    }
  };

  const handleCreateChat = async () => {
    if (!newChatName.trim() || !user) return;
    try {
      const newChatData = {
        name: newChatName.trim(),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessageVisible: 'Chat created'
      };
      await addDoc(collection(db, 'chats'), newChatData);
      setNewChatName('');
      setShowNewChatModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'chats');
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-80 border-r border-slate-200 bg-white flex flex-col shadow-sm z-10">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-600" />
            Messages
          </h1>
          <button 
            onClick={() => setShowNewChatModal(true)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          {chats.map(chat => (
            <button
              key={chat.id}
              onClick={() => setActiveChat(chat)}
              className={cn(
                "w-full p-4 rounded-xl flex items-center gap-3 transition-all duration-200 text-left group",
                activeChat?.id === chat.id 
                  ? "bg-indigo-50 text-indigo-900 shadow-sm" 
                  : "hover:bg-slate-50 text-slate-600"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 transition-transform group-hover:scale-105",
                activeChat?.id === chat.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
              )}>
                {chat.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{chat.name}</div>
                <div className="text-xs truncate opacity-70">
                  {chat.lastMessageVisible || 'No messages yet'}
                </div>
              </div>
            </button>
          ))}
          {chats.length === 0 && (
            <div className="text-center py-10 opacity-40">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No chats found</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-slate-50 relative">
        <AnimatePresence mode="wait">
          {activeChat ? (
            <motion.div 
              key={activeChat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col h-full"
            >
              <header className="p-6 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                    {activeChat.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800">{activeChat.name}</h2>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      Active Chat
                    </p>
                  </div>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {messages.map((msg, i) => {
                  const isMine = msg.senderId === user?.uid;
                  return (
                    <div key={msg.id || i} className={cn(
                      "flex flex-col",
                      isMine ? "items-end" : "items-start"
                    )}>
                      {!isMine && (
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 ml-2 mb-1">
                          {msg.senderName}
                        </span>
                      )}
                      <div className={cn(
                        "max-w-[70%] p-4 rounded-2xl text-sm shadow-sm",
                        isMine 
                          ? "bg-indigo-600 text-white rounded-tr-none" 
                          : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
                      )}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 mx-2">
                        {msg.createdAt?.toDate ? new Date(msg.createdAt.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                      </span>
                    </div>
                  );
                })}
              </div>

              <footer className="p-6 bg-white border-t border-slate-200 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
                <form onSubmit={handleSendMessage} className="flex gap-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </footer>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
               <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
               >
                <div className="bg-white p-8 rounded-3xl shadow-xl mb-6">
                  <MessageSquare className="w-20 h-20 text-slate-100 mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-slate-400">Select a chat to start messaging</h3>
                <p className="text-slate-400 max-w-xs mx-auto mt-2">
                  Connect with your team or start a new conversation.
                </p>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8"
            >
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Create New Chat</h2>
              <p className="text-slate-500 mb-6 text-sm">Enter a name for the group or general conversation.</p>
              
              <div className="space-y-4">
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Chat Name (e.g. Project Apollo)"
                    value={newChatName}
                    onChange={(e) => setNewChatName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowNewChatModal(false)}
                    className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateChat}
                    disabled={!newChatName.trim()}
                    className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg active:scale-95"
                  >
                    Create Room
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
