import React from "react";
import { AudioLines } from "lucide-react";

function InterviewerTile({ assistantDraft, isConnected, isPlaying }) {
  return (
    <section className="participant-tile interviewer-tile" aria-label="Interviewer voice">
      <div className="tile-topbar">
        <span className={isConnected ? "presence-dot active" : "presence-dot"} />
        <span>Interviewer</span>
      </div>

      <div className={isPlaying ? "voice-avatar speaking" : "voice-avatar"}>
        <AudioLines size={34} strokeWidth={1.8} />
        <div className="voice-wave" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="voice-context">
        <span>Voice interviewer</span>
        <p>{assistantDraft || "Ready for the next question..."}</p>
      </div>
    </section>
  );
}

export default InterviewerTile;
