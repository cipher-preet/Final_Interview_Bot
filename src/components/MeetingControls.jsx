import React from "react";
import { Mic, MicOff, Phone, PhoneOff, Play, Video, VideoOff } from "lucide-react";

function MeetingControls({
  canPlayAudio,
  isAudioBlocked,
  isCameraActive,
  isConnected,
  isRecording,
  isStarting,
  onAudioPlay,
  onMicToggle,
  onSessionToggle,
  onVideoToggle
}) {
  return (
    <footer className="meeting-controls" aria-label="Meeting controls">
      {isAudioBlocked && (
        <button
          className="control-button"
          onClick={onAudioPlay}
          disabled={!canPlayAudio}
          title="Play audio"
        >
          <Play size={20} />
        </button>
      )}

      <button
        className={isRecording ? "control-button" : "control-button active"}
        onClick={onMicToggle}
        disabled={!isConnected}
        title={isRecording ? "Turn microphone off" : "Turn microphone on"}
      >
        {isRecording ? <Mic size={22} /> : <MicOff size={22} />}
      </button>

      <button
        className={isCameraActive ? "control-button" : "control-button active"}
        onClick={onVideoToggle}
        disabled={!isConnected}
        title={isCameraActive ? "Turn camera off" : "Turn camera on"}
      >
        {isCameraActive ? <Video size={22} /> : <VideoOff size={22} />}
      </button>

      <button
        className={isConnected ? "control-button end-call" : "control-button start-call"}
        onClick={onSessionToggle}
        disabled={isStarting}
        title={isConnected ? "End session" : "Start session"}
      >
        {isConnected ? <PhoneOff size={22} /> : <Phone size={22} />}
      </button>
    </footer>
  );
}

export default MeetingControls;
