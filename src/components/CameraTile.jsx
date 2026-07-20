import React from "react";
import { Camera, VideoOff } from "lucide-react";

function CameraTile({ cameraError, isCameraActive, isRecording, videoRef }) {
  return (
    <section className="participant-tile camera-tile" aria-label="Candidate camera">
      <video ref={videoRef} autoPlay muted playsInline />

      {!isCameraActive && (
        <div className="camera-placeholder">
          <VideoOff size={44} />
          <p>{cameraError || "Camera is off"}</p>
        </div>
      )}

      <div className="tile-topbar">
        <span className={isRecording ? "presence-dot active" : "presence-dot"} />
        <span>Candidate</span>
      </div>

      <div className="camera-badge">
        <Camera size={16} />
        {isCameraActive ? "Camera on" : "Camera off"}
      </div>
    </section>
  );
}

export default CameraTile;
