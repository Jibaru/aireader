AIReader: PDF & Text to Speech using ElevenLabs

Setup

1) Create `.env.local` with:

```
ELEVENLABS_API_KEY=
MISTRAL_API_KEY=
OPENAI_API_KEY=
```

2) Install deps and run:

```
bun install
bun run dev
```

Open http://localhost:3000

Features

- Upload a PDF and listen from a character offset
- Type text and listen
- Clone a voice from audio samples; select default or custom voices
- Smooth chunked playback for uninterrupted listening

Tech

- Next.js App Router + TypeScript + Tailwind + ShadCN
- ElevenLabs SDK
- pdf-parse for server-side PDF text extraction
