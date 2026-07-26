import React from "react";
import { Sparkles } from "lucide-react";

function InterviewHeader({ isConnected, isPlaying, isRecording, sessionId, status }) {
  const activityLabel = isPlaying ? "Speaking" : isRecording ? "Listening" : "Ready";
  const activityClass = isPlaying ? "speaking" : isRecording ? "listening" : "idle";

  return (
    <header className="meeting-header">
      <div className="header-brand">
        <div className="header-mark" aria-hidden="true">
          <Sparkles size={20} strokeWidth={2} />
        </div>
        <div className="header-copy">
          <p className="eyebrow">Interview Room</p>
          <h1>Live Session</h1>
        </div>
      </div>

      <div className="meeting-meta" aria-label="Interview status">
        <div className="meta-group">
          <div className={`meta-stat ${isConnected ? "online" : "offline"}`}>
            <span className="meta-stat-label">Connection</span>
            <span className="meta-stat-value">
              <span className="meta-dot" aria-hidden="true" />
              {isConnected ? "Connected" : "Offline"}
            </span>
          </div>

          <div className="meta-stat status">
            <span className="meta-stat-label">Status</span>
            <span className="meta-stat-value" title={status}>
              {status}
            </span>
          </div>

          <div className={`meta-stat activity ${activityClass}`}>
            <span className="meta-stat-label">Audio</span>
            <span className="meta-stat-value">
              <span className="meta-dot" aria-hidden="true" />
              {activityLabel}
            </span>
          </div>
        </div>

        {sessionId && (
          <div className="session-group">
            <span className="session-label">Session</span>
            <span className="session-code" title={sessionId}>
              {sessionId}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}

export default InterviewHeader;
