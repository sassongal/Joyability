import React from 'react';
import { AppView } from '../types';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { LayoutDashboard, Mic, Wrench, Settings, Command, MessageSquare, Image as ImageIcon, Activity, Film, LogOut, User } from 'lucide-react';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  user?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, user }) => {
  const menuItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppView.TRANSCRIPTION, label: 'Transcription', icon: Mic },
    { id: AppView.TOOLS, label: 'Text Tools', icon: Wrench },
    { id: AppView.IMAGE_EDITOR, label: 'Image Editor', icon: ImageIcon },
    { id: AppView.VIDEO_CREATOR, label: 'Veo Video', icon: Film },
    { id: AppView.CHATBOT, label: 'AI Chatbot', icon: MessageSquare },
    { id: AppView.LIVE, label: 'Live Conversation', icon: Activity },
    { id: AppView.SETTINGS, label: 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    signOut(auth);
    // Force reload to clear any local state if needed
    window.location.reload();
  };

  return (
    <div className="w-64 bg-white border-r border-grey/10 flex flex-col h-full shadow-sm z-20">
      {/* Branding */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-coral rounded-lg flex items-center justify-center shadow-md shadow-coral/20">
          <Command className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-grey">Joyability</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-teal text-white shadow-md shadow-teal/20' 
                  : 'text-grey/70 hover:text-teal hover:bg-platinum'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-grey/60 group-hover:text-teal'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User & Actions */}
      <div className="p-4 border-t border-grey/10 bg-platinum/30">
        <div className="mb-4 flex items-center gap-3 px-2">
           {user?.photoURL ? (
             <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-white shadow-sm" />
           ) : (
             <div className="w-8 h-8 rounded-full bg-bronze/20 flex items-center justify-center text-bronze">
                <User className="w-4 h-4" />
             </div>
           )}
           <div className="overflow-hidden">
              <p className="text-sm font-bold text-grey truncate">{user?.displayName || 'Guest User'}</p>
              <p className="text-xs text-grey/60 truncate">{user?.email || 'Guest Mode'}</p>
           </div>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-grey/60 hover:text-coral hover:bg-coral/10 rounded-lg w-full transition-colors mb-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
};