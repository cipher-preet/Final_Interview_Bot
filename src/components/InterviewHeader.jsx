import React from "react";
import { CheckCircle2, CircleStop, Clock, Volume2 } from "lucide-react";

function InterviewHeader({ isConnected, isPlaying, isRecording, sessionId, status }) {
  return (
    <header className="meeting-header">
      <div>
        <p className="eyebrow">Interview Room</p>
        <h1>Live Session</h1>
      </div>

      <div className="meeting-meta" aria-label="Interview status">
        <span className={isConnected ? "meta-pill online" : "meta-pill offline"}>
          {isConnected ? <CheckCircle2 size={16} /> : <CircleStop size={16} />}
          {isConnected ? "Connected" : "Offline"}
        </span>
        <span className="meta-pill">
          <Clock size={16} />
          {status}
        </span>
        <span className="meta-pill">
          <Volume2 size={16} />
          {isPlaying ? "Speaking" : isRecording ? "Listening" : "Ready"}
        </span>
        {sessionId && <span className="session-code">{sessionId}</span>}
      </div>
    </header>
  );
}

export default InterviewHeader;
