import React from "react";

function TranscriptCaption({ assistantDraft, liveTranscript }) {
  const text = liveTranscript || assistantDraft;
  const speaker = liveTranscript ? "Candidate" : "Interviewer";

  if (!text) return null;

  return (
    <div className="transcript-caption" role="status" aria-live="polite">
      <strong>{speaker}</strong>
      <p>{text}</p>
    </div>
  );
}

export default TranscriptCaption;
