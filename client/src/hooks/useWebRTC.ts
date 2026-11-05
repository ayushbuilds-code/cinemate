import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';

export type CallStatus = 'idle' | 'initializing' | 'waiting' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'permission-denied';

interface UseWebRTCOptions {
  socket: Socket | null;
  roomId: string;
  onRemoteStreamAvailable?: (stream: MediaStream) => void;
  onRemoteStreamEnded?: () => void;
}

export function useWebRTC({ socket, roomId, onRemoteStreamAvailable, onRemoteStreamEnded }: UseWebRTCOptions) {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [remoteCameraOn, setRemoteCameraOn] = useState<boolean>(true);
  const [remoteMicOn, setRemoteMicOn] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const iceServersRef = useRef<RTCIceServer[]>([
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]);

  // Fetch optional TURN server config from backend
  useEffect(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');
    fetch(`${serverUrl}/api/webrtc/config`)
      .then((res) => res.json())
      .then((data) => {
        if (data.iceServers && data.iceServers.length > 0) {
          iceServersRef.current = data.iceServers;
        }
      })
      .catch(() => {
        // Fallback to default STUN
      });
  }, []);

  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection({
      iceServers: iceServersRef.current,
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc:ice-candidate', {
          roomId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        const stream = event.streams[0];
        setRemoteStream(stream);
        setCallStatus('connected');
        onRemoteStreamAvailable?.(stream);
      }
    };

    pc.onconnectionstatechange = () => {
      switch (pc.connectionState) {
        case 'connected':
          setCallStatus('connected');
          break;
        case 'connecting':
          setCallStatus('connecting');
          break;
        case 'disconnected':
        case 'failed':
          setCallStatus('disconnected');
          break;
        case 'closed':
          setCallStatus('idle');
          break;
      }
    };

    // Add local tracks to PC if available
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    peerConnectionRef.current = pc;
    return pc;
  }, [socket, roomId, localStream, onRemoteStreamAvailable]);

  // Start Call (Explicit User Action)
  const startCall = async () => {
    try {
      setErrorMessage(null);
      setCallStatus('initializing');

      // Request media permissions explicitly
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setLocalStream(stream);
      setIsCameraOn(true);
      setIsMicOn(true);

      const pc = new RTCPeerConnection({
        iceServers: iceServersRef.current,
      });

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('webrtc:ice-candidate', {
            roomId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          const rStream = event.streams[0];
          setRemoteStream(rStream);
          setCallStatus('connected');
          onRemoteStreamAvailable?.(rStream);
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') setCallStatus('connected');
        if (pc.connectionState === 'connecting') setCallStatus('connecting');
        if (pc.connectionState === 'disconnected') setCallStatus('disconnected');
      };

      peerConnectionRef.current = pc;

      setCallStatus('waiting');
      if (socket) {
        socket.emit('webrtc:ready', { roomId });
      }
    } catch (err: any) {
      console.error('WebRTC Media Error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCallStatus('permission-denied');
        setErrorMessage('Camera/Microphone permission denied. Please allow device access in browser settings.');
      } else {
        setCallStatus('idle');
        setErrorMessage(err.message || 'Unable to access camera or microphone.');
      }
    }
  };

  // End Call
  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setRemoteStream(null);
    setCallStatus('idle');
    onRemoteStreamEnded?.();

    if (socket) {
      socket.emit('webrtc:hangup', { roomId });
    }
  };

  // Toggle Camera
  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        const nextState = !videoTrack.enabled;
        videoTrack.enabled = nextState;
        setIsCameraOn(nextState);
        socket?.emit('webrtc:media-state', { roomId, hasCamera: nextState, hasMic: isMicOn });
      }
    }
  };

  // Toggle Microphone
  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        const nextState = !audioTrack.enabled;
        audioTrack.enabled = nextState;
        setIsMicOn(nextState);
        socket?.emit('webrtc:media-state', { roomId, hasCamera: isCameraOn, hasMic: nextState });
      }
    }
  };

  // Socket Signaling Listeners
  useEffect(() => {
    if (!socket) return;

    // When remote peer says ready, create Offer if we are in the call
    const handlePeerReady = async () => {
      if (!peerConnectionRef.current || !localStream) return;
      try {
        setCallStatus('connecting');
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);

        socket.emit('webrtc:offer', {
          roomId,
          offer,
        });
      } catch (err) {
        console.error('Error creating WebRTC offer:', err);
      }
    };

    // When receiving Offer from peer, respond with Answer
    const handleOffer = async (data: { senderSocketId: string; offer: any }) => {
      let pc = peerConnectionRef.current;
      if (!pc && localStream) {
        pc = createPeerConnection();
      }
      if (!pc) return;

      try {
        setCallStatus('connecting');
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('webrtc:answer', {
          roomId,
          targetSocketId: data.senderSocketId,
          answer,
        });
      } catch (err) {
        console.error('Error handling WebRTC offer:', err);
      }
    };

    // When receiving Answer
    const handleAnswer = async (data: { answer: any }) => {
      const pc = peerConnectionRef.current;
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        } catch (err) {
          console.error('Error setting remote description from answer:', err);
        }
      }
    };

    // When receiving ICE Candidate
    const handleIceCandidate = async (data: { candidate: any }) => {
      const pc = peerConnectionRef.current;
      if (pc && data.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    };

    // Peer hung up
    const handlePeerHangup = () => {
      setRemoteStream(null);
      setCallStatus((prev) => (prev === 'connected' ? 'waiting' : prev));
      onRemoteStreamEnded?.();
    };

    // Peer muted/camera toggled
    const handlePeerMediaState = (data: { hasCamera: boolean; hasMic: boolean }) => {
      setRemoteCameraOn(data.hasCamera);
      setRemoteMicOn(data.hasMic);
    };

    socket.on('webrtc:peer-ready', handlePeerReady);
    socket.on('webrtc:offer', handleOffer);
    socket.on('webrtc:answer', handleAnswer);
    socket.on('webrtc:ice-candidate', handleIceCandidate);
    socket.on('webrtc:peer-hangup', handlePeerHangup);
    socket.on('webrtc:peer-media-state', handlePeerMediaState);

    return () => {
      socket.off('webrtc:peer-ready', handlePeerReady);
      socket.off('webrtc:offer', handleOffer);
      socket.off('webrtc:answer', handleAnswer);
      socket.off('webrtc:ice-candidate', handleIceCandidate);
      socket.off('webrtc:peer-hangup', handlePeerHangup);
      socket.off('webrtc:peer-media-state', handlePeerMediaState);
    };
  }, [socket, roomId, localStream, createPeerConnection, onRemoteStreamEnded]);

  return {
    callStatus,
    localStream,
    remoteStream,
    isCameraOn,
    isMicOn,
    remoteCameraOn,
    remoteMicOn,
    errorMessage,
    startCall,
    endCall,
    toggleCamera,
    toggleMic,
  };
}

