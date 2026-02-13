'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff,
  MessageSquare, Maximize2, Minimize2, Clock, Shield,
  Camera, Monitor, Settings,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ConsultationPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('room');
  const appointmentId = searchParams.get('appointment');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [videoSession, setVideoSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ from: string; text: string; time: string }[]>([]);
  const [chatInput, setChatInput] = useState('');

  // Verify access & get session info
  useEffect(() => {
    if (!roomId || !appointmentId) {
      toast.error('Invalid consultation link');
      router.push('/');
      return;
    }
    verifyAccess();
  }, [roomId, appointmentId]);

  const verifyAccess = async () => {
    try {
      const res = await fetch(`/api/video?appointmentId=${appointmentId}`);
      const data = await res.json();
      if (data.success) {
        setVideoSession(data.data);
        await initializeMedia();
        setConnected(true);
      } else {
        toast.error(data.error || 'Cannot join this session');
        router.back();
      }
    } catch {
      toast.error('Connection failed');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access denied, using fallback');
      toast.error('Camera/microphone access denied. Using limited mode.');
    }
  };

  // Call timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (connected) {
      interval = setInterval(() => setCallDuration(d => d + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [connected]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(t => (t.enabled = !t.enabled));
      setIsVideoOn(v => !v);
    }
  };

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => (t.enabled = !t.enabled));
      setIsMicOn(m => !m);
    }
  };

  const endCall = async () => {
    // Cleanup media
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
    }

    // If doctor, end video session via API
    if (session?.user.role === 'DOCTOR' && appointmentId) {
      try {
        await fetch('/api/doctor/appointments', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appointmentId, action: 'end-video' }),
        });
      } catch {}
    }

    toast.success('Call ended');
    router.push(session?.user.role === 'DOCTOR' ? '/doctor/appointments' : '/patient/appointments');
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, {
      from: session?.user.name || 'You',
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
    setChatInput('');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-shefa-950">
        <div className="text-center">
          <div className="h-10 w-10 mx-auto animate-spin rounded-full border-4 border-shefa-700 border-t-shefa-400" />
          <p className="mt-4 text-sm text-shefa-300">Connecting to consultation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-shefa-950">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-shefa-800 bg-shefa-900 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-shefa-700">
            <Shield className="h-4 w-4 text-shefa-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">SHEFA Secure Consultation</p>
            <p className="text-[10px] text-shefa-400">Room: {roomId}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 rounded-lg bg-shefa-800 px-3 py-1.5">
            <div className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-xs font-medium text-shefa-300">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-shefa-400">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs font-mono">{formatDuration(callDuration)}</span>
          </div>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 flex">
        <div className={`flex-1 relative p-4 ${showChat ? 'mr-80' : ''}`}>
          {/* Remote Video (Large) */}
          <div className="relative h-full w-full overflow-hidden rounded-2xl bg-shefa-800">
            <video ref={remoteVideoRef} autoPlay playsInline
              className="h-full w-full object-cover" />
            {/* Placeholder when no remote stream */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-shefa-700 text-3xl font-bold text-shefa-400">
                {videoSession?.doctorName?.[0] || videoSession?.patientName?.[0] || '?'}
              </div>
              <p className="mt-4 text-sm text-shefa-400">
                Waiting for {session?.user.role === 'DOCTOR' ? 'patient' : 'doctor'} to connect...
              </p>
            </div>
          </div>

          {/* Local Video (Small Overlay) */}
          <div className="absolute bottom-8 right-8 h-40 w-56 overflow-hidden rounded-xl border-2 border-shefa-700 bg-shefa-900 shadow-2xl">
            <video ref={localVideoRef} autoPlay playsInline muted
              className={`h-full w-full object-cover ${!isVideoOn ? 'hidden' : ''}`} />
            {!isVideoOn && (
              <div className="flex h-full w-full items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-shefa-700 text-lg font-bold text-shefa-400">
                  {session?.user.name?.[0] || '?'}
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-0.5">
              <span className="text-[10px] text-white">You</span>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 border-l border-shefa-800 bg-shefa-900 flex flex-col">
            <div className="border-b border-shefa-800 p-4">
              <h3 className="text-sm font-semibold text-white">In-call Chat</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <p className="text-xs text-shefa-500 text-center">No messages yet</p>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className="rounded-lg bg-shefa-800 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-shefa-300">{msg.from}</span>
                      <span className="text-[10px] text-shefa-500">{msg.time}</span>
                    </div>
                    <p className="text-sm text-shefa-200">{msg.text}</p>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-shefa-800 p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Type a message..."
                  className="flex-1 rounded-lg bg-shefa-800 px-3 py-2 text-sm text-white placeholder:text-shefa-500 border-none outline-none"
                />
                <button onClick={sendChatMessage}
                  className="rounded-lg bg-shefa-600 px-3 py-2 text-xs font-semibold text-white hover:bg-shefa-500">
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="border-t border-shefa-800 bg-shefa-900 px-4 py-4">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleMic}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
              isMicOn ? 'bg-shefa-700 text-white hover:bg-shefa-600' : 'bg-red-500 text-white hover:bg-red-600'
            }`}
            title={isMicOn ? 'Mute' : 'Unmute'}
          >
            {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
              isVideoOn ? 'bg-shefa-700 text-white hover:bg-shefa-600' : 'bg-red-500 text-white hover:bg-red-600'
            }`}
            title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>

          <button onClick={() => setShowChat(c => !c)}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
              showChat ? 'bg-shefa-600 text-white' : 'bg-shefa-700 text-white hover:bg-shefa-600'
            }`}
            title="Chat"
          >
            <MessageSquare className="h-5 w-5" />
          </button>

          <button onClick={endCall}
            className="flex h-12 w-14 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
            title="End call"
          >
            <PhoneOff className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
