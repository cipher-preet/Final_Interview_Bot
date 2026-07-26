import React from "react";
import { Mic, UserRound } from "lucide-react";

function InterviewerTile({ isConnected, isPlaying }) {
  return (
    <section
      className={isPlaying ? "participant-tile interviewer-tile speaking" : "participant-tile interviewer-tile"}
      aria-label="Interviewer"
    >
      <div className="tile-topbar">
        <span className={isConnected ? "presence-dot active" : "presence-dot"} />
        <span>Interviewer</span>
      </div>

      <div className="interviewer-stage">
        <div className={isPlaying ? "interviewer-avatar speaking" : "interviewer-avatar"}>
          {isPlaying ? (
            <img
              src="/interviewer-portrait.png"
              alt="Interviewer"
              draggable={false}
            />
          ) : (
            <UserRound size={52} strokeWidth={1.5} />
          )}
        </div>
      </div>

      <div className="interviewer-badge">
        <Mic size={16} />
        {isPlaying ? "Speaking" : "Live"}
      </div>
    </section>
  );
}

export default InterviewerTile;
