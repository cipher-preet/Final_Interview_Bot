# Interview Bot Frontend

Simple React UI for streaming microphone audio to a Python interview service and playing audio responses.

## Run

```bash
npm install
npm run dev
```

Create `.env` from `.env.example` and set your backend endpoints:

```bash
VITE_INTERVIEW_START_URL=http://localhost:8000/api/v1/interview/session/start
VITE_INTERVIEW_WS_URL=ws://localhost:8000/ws/interview
```

## Interview Flow

The UI first starts a session:

```js
POST /api/v1/interview/session/start
```

with:

```json
{
  "userId": "user_1",
  "jobRole": "Backend Developer",
  "experienceLevel": "mid",
  "skills": ["Python", "FastAPI", "MongoDB"],
  "language": "en-IN"
}
```

Then it connects to:

```text
ws://localhost:8000/ws/interview/{sessionId}
```

## WebSocket Contract

The UI sends:

- JSON audio chunks every 250ms: `{ "type": "audio_chunk", "mimeType": "audio/webm", "audio": "<base64>" }`
- Optional final transcript messages: `{ "type": "final_transcript", "text": "..." }`
- The socket is closed directly when the interview ends.

The UI accepts:

- Binary audio frames or `ArrayBuffer` audio
- JSON audio: `{ "type": "audio", "mimeType": "audio/mpeg", "audio": "<base64>" }`
- JSON assistant text: `{ "type": "assistant", "text": "..." }`
- JSON transcript text: `{ "type": "transcript", "text": "..." }`
- JSON status: `{ "type": "status", "text": "..." }`

The frontend does not send `session.start`, `audio.start`, `audio.stop`, or `session.end` over WebSocket.
