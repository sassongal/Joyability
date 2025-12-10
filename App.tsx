import React, { useState, useEffect, Suspense } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './services/firebase';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AppView } from './types';
import { Loader2 } from 'lucide-react';
import { LoginView } from './components/LoginView';

const TranscriptionStudio = React.lazy(() => import('./components/TranscriptionStudio').then(module => ({ default: module.TranscriptionStudio })));
const TextTools = React.lazy(() => import('./components/TextTools').then(module => ({ default: module.TextTools })));
const Settings = React.lazy(() => import('./components/Settings').then(module => ({ default: module.Settings })));
const ChatBot = React.lazy(() => import('./components/ChatBot').then(module => ({ default: module.ChatBot })));
const ImageEditor = React.lazy(() => import('./components/ImageEditor').then(module => ({ default: module.ImageEditor })));
const LiveConversation = React.lazy(() => import('./components/LiveConversation').then(module => ({ default: module.LiveConversation })));
const VideoCreator = React.lazy(() => import('./components/VideoCreator').then(module => ({ default: module.VideoCreator })));

function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) setUser(currentUser);
        setIsAuthChecking(false);
      });
      return () => unsubscribe();
    } else {
      setIsAuthChecking(false);
    }
  }, []);

  const handleGuestLogin = () => {
    const guestUser = {
      uid: 'guest-joyability',
      displayName: 'Guest User',
      email: 'guest@joyability.app',
      photoURL: null,
      emailVerified: true,
      isAnonymous: true,
      metadata: {},
      providerData: [],
      refreshToken: '',
      tenantId: null,
      delete: async () => {},
      getIdToken: async () => 'guest',
      getIdTokenResult: async () => ({
          token: 'guest',
          signInProvider: 'guest',
          claims: {},
          authTime: Date.now(),
          issuedAtTime: Date.now(),
          expirationTime: Date.now() + 3600,
      }),
      reload: async () => {},
      toJSON: () => ({}),
      phoneNumber: null,
    } as unknown as User;

    setUser(guestUser);
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD: return <Dashboard onChangeView={setCurrentView} />;
      case AppView.TRANSCRIPTION: return <TranscriptionStudio />;
      case AppView.TOOLS: return <TextTools />;
      case AppView.CHATBOT: return <ChatBot />;
      case AppView.IMAGE_EDITOR: return <ImageEditor />;
      case AppView.LIVE: return <LiveConversation />;
      case AppView.VIDEO_CREATOR: return <VideoCreator />;
      case AppView.SETTINGS: return <Settings />;
      default: return <Dashboard onChangeView={setCurrentView} />;
    }
  };

  if (isAuthChecking) {
    return (
      <div className="h-screen w-screen bg-platinum flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-coral animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginView onGuestLogin={handleGuestLogin} />;
  }

  return (
    <div className="flex h-screen bg-platinum text-grey font-sans overflow-hidden">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} user={user} />
      <main className="flex-1 overflow-auto bg-platinum relative">
        <div className="relative z-10 h-full">
           <Suspense fallback={
             <div className="h-full w-full flex items-center justify-center">
               <div className="flex flex-col items-center gap-4">
                 <Loader2 className="w-8 h-8 text-coral animate-spin" />
                 <p className="text-grey/60 text-sm">Loading...</p>
               </div>
             </div>
           }>
             {renderView()}
           </Suspense>
        </div>
      </main>
    </div>
  );
}

export default App;