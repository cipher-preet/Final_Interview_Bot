import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import CameraTile from "./components/CameraTile.jsx";
import InterviewHeader from "./components/InterviewHeader.jsx";
import InterviewerTile from "./components/InterviewerTile.jsx";
import MeetingControls from "./components/MeetingControls.jsx";
import TranscriptCaption from "./components/TranscriptCaption.jsx";
import { INTERVIEW_CONFIG } from "./config/interviewConfig.js";
import {
  base64ToBytes,
  bytesToBase64,
  combineByteChunks,
  float32ToPcm16,
  isWavBytes,
  pcm16ToWavBlob,
  resampleFloat32
} from "./utils/audio.js";

const MIC_TARGET_SAMPLE_RATE = 24000;
const MIC_FRAME_MS = 40;
const DEBUG_WS_MESSAGES = false;

function App() {
  const [sessionId, setSessionId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioBlocked, setIsAudioBlocked] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [status, setStatus] = useState("Ready");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [visibleTranscript, setVisibleTranscript] = useState("");
  const [assistantDraft, setAssistantDraft] = useState("");

  const socketRef = useRef(null);
  const streamRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const micSourceRef = useRef(null);
  const micProcessorRef = useRef(null);
  const micFrameBufferRef = useRef(new Float32Array(0));
  const micSequenceRef = useRef(0);
  const videoRef = useRef(null);
  const audioQueueRef = useRef([]);
  const audioPlayerRef = useRef(null);
  const currentAudioUrlRef = useRef("");
  const isAudioBlockedRef = useRef(false);
  const isAudioPlayingRef = useRef(false);
  const audioGenerationRef = useRef(0);
  const pcmAudioChunksRef = useRef([]);
  const compressedAudioChunksRef = useRef([]);
  const liveTranscriptRef = useRef("");
  const assistantDraftRef = useRef("");
  const lastCandidateMessageRef = useRef("");

  useEffect(() => {
    return () => {
      stopRecording();
      stopCamera();
      disconnect();
      audioQueueRef.current.forEach((item) => URL.revokeObjectURL(item.url));
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.removeAttribute("src");
        audioPlayerRef.current.load();
      }
    };
  }, []);

  useEffect(() => {
    const text = liveTranscript || assistantDraft;
    setVisibleTranscript(text);

    if (!text) return undefined;

    const timer = window.setTimeout(() => {
      setVisibleTranscript("");
    }, 1300);

    return () => window.clearTimeout(timer);
  }, [assistantDraft, liveTranscript]);

  const addMessage = (role, text) => {
    if (!text) return;
    if (role === "candidate") {
      lastCandidateMessageRef.current = text;
    }
  };

  const updateLiveTranscript = (text) => {
    liveTranscriptRef.current = text || "";
    setLiveTranscript(text || "");
  };

  const appendAssistantDraft = (delta) => {
    assistantDraftRef.current += delta || "";
    setAssistantDraft(assistantDraftRef.current);
  };

  const clearAssistantDraft = () => {
    assistantDraftRef.current = "";
    setAssistantDraft("");
  };

  const commitLiveTranscript = () => {
    const text = liveTranscriptRef.current.trim();
    if (!text || text === lastCandidateMessageRef.current) return;
    addMessage("candidate", text);
    updateLiveTranscript("");
  };

  const sendJson = (payload) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify(payload));
    return true;
  };

  const setAudioBlocked = (isBlocked) => {
    isAudioBlockedRef.current = isBlocked;
    setIsAudioBlocked(isBlocked);
  };

  const finishCurrentAudio = (audioUrl) => {
    if (currentAudioUrlRef.current !== audioUrl) return;
    URL.revokeObjectURL(audioUrl);
    currentAudioUrlRef.current = "";
    isAudioPlayingRef.current = false;
    setIsPlaying(false);
  };

  const clearAudioPlayback = (nextStatus = "Audio interrupted") => {
    audioGenerationRef.current += 1;
    pcmAudioChunksRef.current = [];
    compressedAudioChunksRef.current = [];
    audioQueueRef.current.forEach((item) => URL.revokeObjectURL(item.url));
    audioQueueRef.current = [];

    if (currentAudioUrlRef.current) {
      URL.revokeObjectURL(currentAudioUrlRef.current);
      currentAudioUrlRef.current = "";
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.removeAttribute("src");
      audioPlayerRef.current.load();
    }

    isAudioPlayingRef.current = false;
    setIsPlaying(false);
    setAudioBlocked(false);
    setStatus(nextStatus);
  };

  const playNextAudio = () => {
    if (
      isAudioBlockedRef.current ||
      isAudioPlayingRef.current ||
      audioQueueRef.current.length === 0
    ) {
      return;
    }

    const queueItem = audioQueueRef.current.shift();
    if (!queueItem || queueItem.generation !== audioGenerationRef.current) {
      if (queueItem) URL.revokeObjectURL(queueItem.url);
      playNextAudio();
      return;
    }

    const { url: audioUrl, generation } = queueItem;
    const audio = audioPlayerRef.current || new Audio();
    audioPlayerRef.current = audio;
    currentAudioUrlRef.current = audioUrl;
    isAudioPlayingRef.current = true;
    setIsPlaying(true);

    audio.onended = () => {
      if (generation !== audioGenerationRef.current) return;
      finishCurrentAudio(audioUrl);
      playNextAudio();
    };

    audio.onerror = () => {
      if (generation !== audioGenerationRef.current) return;
      finishCurrentAudio(audioUrl);
      setStatus("Audio playback failed");
      playNextAudio();
    };

    audio.src = audioUrl;
    audio
      .play()
      .then(() => {
        if (generation !== audioGenerationRef.current) return;
        setAudioBlocked(false);
      })
      .catch(() => {
        if (generation !== audioGenerationRef.current) return;
        audioQueueRef.current.unshift({ url: audioUrl, generation });
        currentAudioUrlRef.current = "";
        isAudioPlayingRef.current = false;
        audio.removeAttribute("src");
        audio.load();
        setIsPlaying(false);
        setAudioBlocked(true);
        setStatus("Tap play to allow audio");
      });
  };

  const enqueueAudio = (blob) => {
    audioQueueRef.current.push({
      url: URL.createObjectURL(blob),
      generation: audioGenerationRef.current
    });
    if (!isAudioBlockedRef.current) {
      playNextAudio();
    }
  };

  const handleSocketMessage = async (event) => {
    if (event.data instanceof Blob) {
      enqueueAudio(event.data);
      return;
    }

    if (event.data instanceof ArrayBuffer) {
      enqueueAudio(new Blob([event.data], { type: "audio/mpeg" }));
      return;
    }

    try {
      const data = JSON.parse(event.data);
      const shouldClearAudio = Boolean(data.clearAudio || data.extra?.clearAudio);
      const wasInterrupted = Boolean(
        data.type === "response_interrupted" ||
          data.interrupted ||
          data.extra?.interrupted
      );

      if (shouldClearAudio || data.type === "response_interrupted") {
        clearAudioPlayback(wasInterrupted ? "Response interrupted" : "Audio cleared");
        if (wasInterrupted || data.type === "audio_response") {
          return;
        }
      }

      if (
        (data.type === "audio" || data.type === "audio_delta" || data.type === "assistant.audio.chunk") &&
        (data.audio || data.audioBase64)
      ) {
        const audioBytes = base64ToBytes(data.audio || data.audioBase64);
        const format = data.format || data.extra?.format || "";
        const encoding = data.encoding || data.extra?.encoding || "";

        if (
          format === "pcm16" ||
          encoding === "pcm16" ||
          encoding === "pcm_s16le" ||
          (!format && data.type === "audio_delta" && !isWavBytes(audioBytes))
        ) {
          const sampleRate =
            data.sampleRate || data.extra?.sampleRate || data.sample_rate || 24000;
          enqueueAudio(pcm16ToWavBlob(audioBytes, sampleRate));
        } else if (format === "mp3" || format === "mpeg") {
          compressedAudioChunksRef.current.push(audioBytes);
        } else {
          const mimeType =
            data.mimeType ||
            (format === "wav" || isWavBytes(audioBytes) ? "audio/wav" : "audio/mpeg");
          enqueueAudio(new Blob([audioBytes], { type: mimeType }));
        }
      }
      if (data.type === "partial_transcript") {
        updateLiveTranscript(data.text || "");
      }
      if (data.type === "transcript" || data.type === "final_transcript" || data.transcript) {
        const text = data.text || data.transcript;
        addMessage("candidate", text);
        updateLiveTranscript("");
      }
      if (data.type === "text_delta" || data.type === "assistant.text.delta") {
        appendAssistantDraft(data.delta || data.text || "");
      }
      if (data.type === "assistant" || data.type === "final_response" || data.response || data.question) {
        commitLiveTranscript();
        addMessage("assistant", data.text || data.response || data.question);
        clearAssistantDraft();
      }
      if (data.type === "status" || data.status) {
        setStatus(data.text || data.status);
      }
      if (data.type === "assistant.audio.end" && compressedAudioChunksRef.current.length) {
        const audioBytes = combineByteChunks(compressedAudioChunksRef.current);
        enqueueAudio(new Blob([audioBytes], { type: "audio/mpeg" }));
        compressedAudioChunksRef.current = [];
        setStatus("Audio received");
      }
      if (data.type === "audio_response" && data.extra?.done) {
        const format = data.format || data.extra?.format || "";
        if (format === "pcm16" && pcmAudioChunksRef.current.length) {
          const pcmBytes = combineByteChunks(pcmAudioChunksRef.current);
          const sampleRate = data.extra?.sampleRate || data.sampleRate || 24000;
          enqueueAudio(pcm16ToWavBlob(pcmBytes, sampleRate));
          pcmAudioChunksRef.current = [];
        }
        if (compressedAudioChunksRef.current.length) {
          const audioBytes = combineByteChunks(compressedAudioChunksRef.current);
          enqueueAudio(new Blob([audioBytes], { type: "audio/mpeg" }));
          compressedAudioChunksRef.current = [];
        }
        setStatus("Audio received");
      }
    } catch {
      addMessage("assistant", event.data);
    }
  };

  const startSession = async () => {
    const response = await fetch(INTERVIEW_CONFIG.startUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: INTERVIEW_CONFIG.userId,
        jobRole: INTERVIEW_CONFIG.jobRole,
        experienceLevel: INTERVIEW_CONFIG.experienceLevel,
        skills: INTERVIEW_CONFIG.skills,
        language: INTERVIEW_CONFIG.language
      })
    });

    if (!response.ok) {
      throw new Error(`Session start failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data.sessionId) {
      throw new Error("Session response missing sessionId");
    }

    return data.sessionId;
  };

  const buildSessionWsUrl = (nextSessionId) => {
    const cleanBaseUrl = INTERVIEW_CONFIG.wsBaseUrl.replace(/\/$/, "");
    return `${cleanBaseUrl}/${encodeURIComponent(nextSessionId)}`;
  };

  const startCamera = async () => {
    if (cameraStreamRef.current) return;

    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
        audio: false
      });

      cameraStreamRef.current = cameraStream;
      if (videoRef.current) {
        videoRef.current.srcObject = cameraStream;
      }
      setCameraError("");
      setIsCameraActive(true);
    } catch {
      setCameraError("Camera permission was not granted");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const connect = async () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    setIsStarting(true);
    setStatus("Starting session");
    await startCamera();

    let nextSessionId;
    try {
      nextSessionId = await startSession();
      setSessionId(nextSessionId);
      setStatus("Connecting");
    } catch (error) {
      setStatus(error.message || "Session start failed");
      setIsStarting(false);
      return;
    }

    const socket = new WebSocket(buildSessionWsUrl(nextSessionId));
    socket.binaryType = "arraybuffer";
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      setIsStarting(false);
      setStatus("Connected");
      sendJson({
        type: "session.start",
        sessionId: nextSessionId,
        audioFormat: {
          encoding: "pcm16",
          sampleRate: MIC_TARGET_SAMPLE_RATE,
          channels: 1
        },
        language: INTERVIEW_CONFIG.language
      });
      console.log("Interview WS connected");
    };

    socket.onmessage = (event) => {
      if (DEBUG_WS_MESSAGES) {
        console.log("Interview WS message:", event.data);
      }
      handleSocketMessage(event);
    };

    socket.onerror = (error) => {
      console.error("Interview WS error:", error);
      setStatus("Connection error");
      setIsStarting(false);
    };

    socket.onclose = (event) => {
      console.log("Interview WS closed:", event.code, event.reason);
      setIsConnected(false);
      setIsStarting(false);
      setIsRecording(false);
      setStatus("Disconnected");
      socketRef.current = null;
    };
  };

  const disconnect = () => {
    stopRecording();
    stopCamera();
    clearAudioPlayback("Disconnected");
    socketRef.current?.close();
    socketRef.current = null;
    setIsConnected(false);
    setIsStarting(false);
  };

  const startRecording = async () => {
    if (!isConnected) {
      setStatus("Connect first");
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    streamRef.current = stream;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContextClass();
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaStreamSource(stream);
    micSourceRef.current = source;
    micFrameBufferRef.current = new Float32Array(0);
    micSequenceRef.current = 0;

    if (audioContext.audioWorklet) {
      await audioContext.audioWorklet.addModule("/pcm-capture-worklet.js");
      const processor = new AudioWorkletNode(audioContext, "pcm-capture-processor", {
        numberOfInputs: 1,
        numberOfOutputs: 0,
        processorOptions: {
          targetSampleRate: MIC_TARGET_SAMPLE_RATE,
          frameMs: MIC_FRAME_MS
        }
      });
      processor.port.onmessage = (event) => {
        const socket = socketRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
        const pcmBytes = new Uint8Array(event.data.pcm);
        sendJson({
          type: "audio.chunk",
          turnId: 0,
          sequence: event.data.sequence,
          audioBase64: bytesToBase64(pcmBytes)
        });
      };
      micProcessorRef.current = processor;
      source.connect(processor);
    } else {
      const processor = audioContext.createScriptProcessor(2048, 1, 1);
      const samplesPerFrame = Math.round((MIC_TARGET_SAMPLE_RATE * MIC_FRAME_MS) / 1000);
      micProcessorRef.current = processor;

      processor.onaudioprocess = (event) => {
        const socket = socketRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) return;

        const input = event.inputBuffer.getChannelData(0);
        const resampled = resampleFloat32(input, audioContext.sampleRate, MIC_TARGET_SAMPLE_RATE);
        const pending = micFrameBufferRef.current;
        const combined = new Float32Array(pending.length + resampled.length);
        combined.set(pending);
        combined.set(resampled, pending.length);

        let offset = 0;
        while (combined.length - offset >= samplesPerFrame) {
          const frame = combined.slice(offset, offset + samplesPerFrame);
          const pcmBytes = float32ToPcm16(frame);
          sendJson({
            type: "audio.chunk",
            turnId: 0,
            sequence: micSequenceRef.current,
            audioBase64: bytesToBase64(pcmBytes)
          });
          micSequenceRef.current += 1;
          offset += samplesPerFrame;
        }

        micFrameBufferRef.current = combined.slice(offset);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
    }
    setIsRecording(true);
    setStatus("Listening");
  };

  const stopRecording = () => {
    if (micProcessorRef.current) {
      micProcessorRef.current.disconnect();
      if ("onaudioprocess" in micProcessorRef.current) {
        micProcessorRef.current.onaudioprocess = null;
      }
      if (micProcessorRef.current.port) {
        micProcessorRef.current.port.onmessage = null;
      }
      micProcessorRef.current = null;
    }
    if (micSourceRef.current) {
      micSourceRef.current.disconnect();
      micSourceRef.current = null;
    }
    audioContextRef.current?.close();
    audioContextRef.current = null;
    micFrameBufferRef.current = new Float32Array(0);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsRecording(false);
    if (isConnected) {
      setStatus("Processing");
    }
  };

  const enableAudioPlayback = () => {
    setAudioBlocked(false);
    playNextAudio();
  };

  const toggleCamera = () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const startOrStopInterview = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <main className="app-shell">
      <InterviewHeader
        isConnected={isConnected}
        isPlaying={isPlaying}
        isRecording={isRecording}
        sessionId={sessionId}
        status={status}
      />

      <section className="meeting-stage">
        <InterviewerTile
          assistantDraft={assistantDraft}
          isConnected={isConnected}
          isPlaying={isPlaying}
        />
        <CameraTile
          cameraError={cameraError}
          isCameraActive={isCameraActive}
          isRecording={isRecording}
          videoRef={videoRef}
        />
        <TranscriptCaption
          assistantDraft={visibleTranscript && !liveTranscript ? assistantDraft : ""}
          liveTranscript={visibleTranscript && liveTranscript ? visibleTranscript : ""}
        />
      </section>

      <MeetingControls
        canPlayAudio={audioQueueRef.current.length > 0}
        isAudioBlocked={isAudioBlocked}
        isCameraActive={isCameraActive}
        isConnected={isConnected}
        isRecording={isRecording}
        isStarting={isStarting}
        onAudioPlay={enableAudioPlayback}
        onMicToggle={isRecording ? stopRecording : startRecording}
        onSessionToggle={startOrStopInterview}
        onVideoToggle={toggleCamera}
      />

      {status === "Connecting" && (
        <div className="loading-toast">
          <Loader2 size={18} />
          Connecting
        </div>
      )}
    </main>
  );
}

export default App;
