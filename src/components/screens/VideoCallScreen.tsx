import { useState, useEffect, useRef } from 'react';
import { Loader2, PhoneOff, X, Mic, MicOff, Video, VideoOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { MeetingProvider, useMeeting, useParticipant } from '@videosdk.live/react-sdk';

interface VideoCallScreenProps {
  sessionId: string;
  doctorName: string;
  onLeave: () => void;
}

async function getVideoRoom(sessionId: string): Promise<{ roomId: string; token: string } | null> {
  if (!sessionId) return null;
  try {
    const { data, error } = await supabase.functions.invoke('create-video-room', {
      body: { sessionId },
    });
    if (error || !data?.roomId) { console.error('[VideoCall] error:', error, data); return null; }
    return { roomId: data.roomId, token: data.token };
  } catch (e) { console.error('[VideoCall] error:', e); return null; }
}

function ParticipantTile({ participantId, isLocal }: { participantId: string; isLocal: boolean }) {
  const { webcamStream, micStream, webcamOn, micOn, displayName } = useParticipant(participantId, {
    onStreamEnabled: () => {},
    onStreamDisabled: () => {},
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (videoRef.current && webcamOn && webcamStream?.track) {
      const mediaStream = new MediaStream([webcamStream.track]);
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch(() => {});
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [webcamOn, webcamStream]);

  useEffect(() => {
    if (audioRef.current && !isLocal && micOn && micStream?.track) {
      const mediaStream = new MediaStream([micStream.track]);
      audioRef.current.srcObject = mediaStream;
      audioRef.current.play().catch(() => {});
    } else if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
  }, [micOn, micStream, isLocal]);

  return (
    <div className="relative flex-1 bg-gray-800 rounded-xl overflow-hidden" style={{ minHeight: '40%' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full object-cover ${!webcamOn ? 'hidden' : ''}`}
      />
      {!webcamOn && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center">
            <span className="text-3xl font-bold text-white">{displayName?.charAt(0)?.toUpperCase() ?? '?'}</span>
          </div>
        </div>
      )}
      {!isLocal && <audio ref={audioRef} autoPlay />}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 rounded-full px-2.5 py-1">
        {!micOn && <MicOff className="w-3 h-3 text-red-400" />}
        <span className="text-white text-xs font-medium">{isLocal ? 'You' : displayName}</span>
      </div>
    </div>
  );
}

function MeetingView({ onLeave, doctorName }: { onLeave: () => void; doctorName: string }) {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [flipping, setFlipping] = useState(false);
  const currentDeviceIdRef = useRef<string | null>(null);

  const { join, leave, toggleMic, toggleWebcam, changeWebcam, participants, localParticipant } = useMeeting({
    onMeetingLeft: onLeave,
    onError: (data: any) => console.error('[VideoCall] meeting error:', data),
  });

  // Join the meeting on mount
  useEffect(() => {
    join();
  }, []);

  const handleToggleMic = () => { toggleMic(); setMicOn(p => !p); };
  const handleToggleCam = () => { toggleWebcam(); setCamOn(p => !p); };
  const handleLeave = () => { leave(); onLeave(); };

  const handleFlipCamera = async () => {
    if (flipping) return;
    setFlipping(true);
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(d => d.kind === 'videoinput');
      if (cameras.length < 2) { setFlipping(false); return; }
      // Find the camera that is NOT currently active
      const current = currentDeviceIdRef.current;
      const next = cameras.find(c => c.deviceId !== current) ?? cameras[0];
      currentDeviceIdRef.current = next.deviceId;
      await changeWebcam(next.deviceId);
    } catch (e) {
      console.error('[VideoCall] flip camera error:', e);
    }
    setFlipping(false);
  };

  // Use localParticipant.id from useMeeting — correct SDK API
  const localId = localParticipant?.id ?? null;
  const remoteParticipants = [...participants.keys()].filter(id => id !== localId);

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Video tiles */}
      <div className="flex-1 flex flex-col gap-2 p-3 min-h-0">
        {/* Remote participants */}
        {remoteParticipants.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-gray-800 rounded-xl">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            <p className="text-gray-400 text-sm">Waiting for Dr. {doctorName} to join...</p>
          </div>
        ) : (
          remoteParticipants.map(id => (
            <ParticipantTile key={id} participantId={id} isLocal={false} />
          ))
        )}

        {/* Local participant — PiP bottom right */}
        {localId && (
          <div className="h-36 w-24 absolute bottom-24 right-4 rounded-xl overflow-hidden shadow-lg border-2 border-gray-700 z-10">
            <ParticipantTile participantId={localId} isLocal={true} />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 px-4 py-5 bg-gray-900 border-t border-gray-800">
        <button
          onClick={handleToggleMic}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-lg ${micOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}>
          {micOn ? <Mic className="w-6 h-6 text-white" /> : <MicOff className="w-6 h-6 text-white" />}
        </button>
        <button
          onClick={handleLeave}
          className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors shadow-lg">
          <PhoneOff className="w-7 h-7 text-white" />
        </button>
        <button
          onClick={handleToggleCam}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-lg ${camOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}>
          {camOn ? <Video className="w-6 h-6 text-white" /> : <VideoOff className="w-6 h-6 text-white" />}
        </button>
        <button
          onClick={handleFlipCamera}
          disabled={flipping}
          className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors shadow-lg disabled:opacity-50">
          <RefreshCw className={`w-6 h-6 text-white ${flipping ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}

export function VideoCallScreen({ sessionId, doctorName, onLeave }: VideoCallScreenProps) {
  const [roomData, setRoomData] = useState<{ roomId: string; token: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!sessionId) { setError(true); setLoading(false); return; }
    getVideoRoom(sessionId).then(result => {
      if (result) setRoomData(result);
      else setError(true);
      setLoading(false);
    });
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-950 items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
        <p className="text-white font-semibold">Joining video call...</p>
        <p className="text-gray-400 text-sm">Connecting to Dr. {doctorName}</p>
      </div>
    );
  }

  if (error || !roomData) {
    return (
      <div className="flex flex-col h-screen bg-gray-950 items-center justify-center gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
          <X className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-white font-semibold">Failed to start video call</p>
        <p className="text-gray-400 text-sm">Could not connect to the video room. Please try again.</p>
        <Button variant="outline" onClick={onLeave}>Go Back to Chat</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 flex-shrink-0">
        <div>
          <p className="text-white font-semibold text-sm">Video Call</p>
          <p className="text-gray-400 text-xs">Dr. {doctorName}</p>
        </div>
        <button
          onClick={onLeave}
          className="text-gray-400 hover:text-white text-xs transition-colors">
          ✕ Exit
        </button>
      </div>
      <div className="flex-1 min-h-0 relative">
        <MeetingProvider
          config={{
            meetingId: roomData.roomId,
            micEnabled: true,
            webcamEnabled: true,
            name: 'Patient',
          }}
          token={roomData.token}
        >
          <MeetingView onLeave={onLeave} doctorName={doctorName} />
        </MeetingProvider>
      </div>
    </div>
  );
}
