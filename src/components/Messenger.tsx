import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, logout } from '../lib/firebase';
import { Chat, Message, UserPublic } from '../types';
import { useAuth } from '../hooks/useAuth';
import { Send, MessageSquare, Plus, Settings, LogOut, User as UserIcon, Crown, Shield, X, Camera, Info } from 'lucide-react';
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
  
  // Profile / Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [profile, setProfile] = useState<UserPublic | null>(null);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [saving, setSaving] = useState(false);

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

  // Fetch User Profile
  useEffect(() => {
    if (!user) return;
    const profileRef = doc(db, 'users', user.uid, 'public', 'profile');
    const unsubscribe = onSnapshot(profileRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as UserPublic;
        setProfile(data);
        setEditName(data.displayName);
        setEditBio(data.bio || '');
        setEditAvatar(data.photoURL || '');
      }
    });
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
        senderName: profile?.displayName || user.displayName || 'Anonymous',
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

  const handleSaveProfile = async () => {
    if (!user || !editName.trim()) return;
    setSaving(true);
    try {
      const profileRef = doc(db, 'users', user.uid, 'public', 'profile');
      await updateDoc(profileRef, {
        displayName: editName.trim(),
        bio: editBio.trim(),
        photoURL: editAvatar.trim(),
        updatedAt: serverTimestamp()
      });
      setShowSettings(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'profile');
    } finally {
      setSaving(false);
    }
  };

  const togglePremium = async () => {
    if (!user || !profile) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'public', 'profile'), {
        isPremium: !profile.isPremium
      });
    } catch (err) { console.error(err); }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-80 border-r border-slate-200 bg-white flex flex-col shadow-sm z-10">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-600" />
            Nexus
          </h1>
          <button 
            onClick={() => setShowNewChatModal(true)}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
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
                "w-full p-4 rounded-2xl flex items-center gap-3 transition-all duration-200 text-left group",
                activeChat?.id === chat.id 
                  ? "bg-indigo-50 text-indigo-900 shadow-sm" 
                  : "hover:bg-slate-50 text-slate-600"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 transition-transform group-hover:scale-105 shadow-sm",
                activeChat?.id === chat.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
              )}>
                {chat.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate flex items-center gap-1">
                  {chat.name}
                </div>
                <div className="text-xs truncate opacity-70">
                  {chat.lastMessageVisible || 'No messages yet'}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <button 
            onClick={() => setShowSettings(true)}
            className="w-full p-3 rounded-2xl hover:bg-slate-50 transition-colors flex items-center gap-3 text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate flex items-center gap-1 text-slate-800">
                {profile?.displayName || 'Loading...'}
                {profile?.isPremium && <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />}
                {profile?.isAdmin && <Shield className="w-3 h-3 text-indigo-500" />}
              </div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Account Settings</div>
            </div>
            <Settings className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:rotate-45 transition-all" />
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-slate-50 relative">
        <AnimatePresence mode="wait">
          {activeChat ? (
            <motion.div 
              key={activeChat.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col h-full bg-white shadow-[-10px_0_30_rgba(0,0,0,0.02)] z-0"
            >
              <header className="p-6 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-indigo-100 shadow-lg">
                    {activeChat.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800">{activeChat.name}</h2>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                      Active Chat
                    </p>
                  </div>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth bg-slate-50/30">
                {messages.map((msg, i) => {
                  const isMine = msg.senderId === user?.uid;
                  return (
                    <div key={msg.id || i} className={cn(
                      "flex flex-col",
                      isMine ? "items-end" : "items-start"
                    )}>
                      {!isMine && (
                        <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-500 ml-3 mb-1">
                          {msg.senderName}
                        </span>
                      )}
                      <div className={cn(
                        "max-w-[65%] p-4 rounded-3xl text-sm shadow-sm transition-transform hover:scale-[1.01]",
                        isMine 
                          ? "bg-indigo-600 text-white rounded-tr-none shadow-indigo-100" 
                          : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
                      )}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1.5 px-3">
                        {msg.createdAt?.toDate ? new Date(msg.createdAt.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                      </span>
                    </div>
                  );
                })}
              </div>

              <footer className="p-6 bg-white border-t border-slate-100">
                <form onSubmit={handleSendMessage} className="flex gap-4">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all text-sm font-medium"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-indigo-100 active:scale-95"
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
                <div className="bg-white p-10 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] mb-8">
                  <MessageSquare className="w-24 h-24 text-slate-100 mx-auto" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Select a conversation</h3>
                <p className="text-slate-400 max-w-xs mx-auto mt-2 font-medium">
                  Pick a chat from the sidebar or create a new one to start messaging.
                </p>
                <button 
                  onClick={() => setShowNewChatModal(true)}
                  className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Create New Chat Room
                </button>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Settings Panel Overlay */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                <Settings className="w-6 h-6 text-indigo-500" />
                Profile
              </h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-3 hover:bg-slate-50 rounded-2xl transition-colors ring-1 ring-slate-100"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10">
              {/* Profile Card */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative group">
                  <div className="w-28 h-28 rounded-[2.5rem] bg-slate-100 overflow-hidden shadow-2xl ring-4 ring-white flex items-center justify-center">
                    {editAvatar ? (
                      <img src={editAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-12 h-12 text-slate-300" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem] flex items-center justify-center cursor-pointer">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div>
                   <h3 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
                    {profile?.displayName}
                    {profile?.isPremium && <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />}
                   </h3>
                   <p className="text-sm text-slate-400 font-medium">{user?.email}</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <UserIcon className="w-3 h-3" /> Display Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Info className="w-3 h-3" /> Bio / Status
                  </label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all min-h-[100px] resize-none font-medium"
                    placeholder="Tell your team about yourself..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Camera className="w-3 h-3" /> Avatar URL
                  </label>
                  <input
                    type="text"
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all font-medium text-xs break-all"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>

              {/* Role Switches (Mock) */}
              <div className="p-6 bg-slate-50 rounded-3xl space-y-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-xl">
                        <Crown className="w-5 h-5 text-amber-600" />
                      </div>
                      <span className="font-bold text-slate-700">Premium Nexus</span>
                    </div>
                    <button 
                      onClick={togglePremium}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        profile?.isPremium ? "bg-indigo-600" : "bg-slate-300"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                        profile?.isPremium ? "right-1" : "left-1"
                      )} />
                    </button>
                 </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 space-y-3">
              <button
                onClick={handleSaveProfile}
                disabled={saving || !editName.trim()}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
              >
                {saving ? 'Updating...' : 'Save Settings'}
              </button>
              <button
                onClick={logout}
                className="w-full py-4 text-rose-500 font-bold rounded-2xl hover:bg-rose-50 flex items-center justify-center gap-3 transition-colors"
              >
                <LogOut className="w-5 h-5" /> Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10"
            >
              <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">New Room</h2>
              <p className="text-slate-500 mb-8 text-sm font-medium">Collaborate instantly. Create a channel for your team or project.</p>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Room Name</label>
                  <input
                    type="text"
                    autoFocus
                    placeholder="e.g. Design Team, General..."
                    value={newChatName}
                    onChange={(e) => setNewChatName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all font-bold"
                  />
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setShowNewChatModal(false)}
                    className="flex-1 py-4 text-slate-500 font-black hover:bg-slate-50 rounded-2xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateChat}
                    disabled={!newChatName.trim()}
                    className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                  >
                    Launch Chat
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
