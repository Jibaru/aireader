# AIReader

A professional text-to-speech application that converts PDFs and text into natural-sounding audio using ElevenLabs AI voices.

## Features

- **PDF to Speech**: Upload PDFs and listen to pages using OCR technology
- **Text to Speech**: Convert any text into speech with customizable playback
- **Voice Cloning**: Create custom AI voices from audio samples
- **Smart Caching**: Efficient PDF page caching for faster playback
- **Playback Control**: Adjustable speed and position controls
- **Multiple Voices**: Choose from default or custom cloned voices

## Quick Start

1. Clone the repository and install dependencies:
```bash
bun install
```

2. Create `.env.local` file with your API keys:
```bash
ELEVENLABS_API_KEY=your_elevenlabs_key
MISTRAL_API_KEY=your_mistral_key
OPENAI_API_KEY=your_openai_key
AUTH_USERNAME=
AUTH_PWD_HASH=
JWT_SECRET=
```

3. Start the development server:
```bash
bun run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **AI Services**: ElevenLabs TTS, Mistral AI (OCR), OpenAI
- **PDF Processing**: PDF.js for rendering and text extraction
- **State Management**: Zustand

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
