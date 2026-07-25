import express, { type ErrorRequestHandler } from 'express';
import multer from 'multer';
import { InMemoryVideoRepository } from './infrastructure/video-repository.js';
import { InMemorySubtitleRepository } from './infrastructure/subtitle-repository.js';
import { LocalWhisperProvider } from './infrastructure/ai/local-whisper-provider.js';
import { UploadVideoService } from './application/upload-video-service.js';
import { GenerateSubtitlesService } from './application/generate-subtitles-service.js';
import { createVideosRouter } from './interface/http/videos-router.js';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(express.json());

// Health endpoint — proves the API is running end-to-end (Development Rule 4).
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ase-os-api',
    phase: 'Phase 1',
  });
});

// Composition root: wire the layers together (see ADR 0001).
// Transcription uses a free, local provider (see ADR 0002); swap here to change engines.
const videoRepository = new InMemoryVideoRepository();
const subtitleRepository = new InMemorySubtitleRepository();
const transcriptionProvider = new LocalWhisperProvider();
const uploadService = new UploadVideoService(videoRepository);
const subtitleService = new GenerateSubtitlesService(
  videoRepository,
  subtitleRepository,
  transcriptionProvider,
);
app.use('/api/videos', createVideosRouter(uploadService, subtitleService));

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    res.status(status).json({ error: err.message });
    return;
  }
  console.error('[ase-os-api] unexpected error', err);
  res.status(500).json({ error: 'Internal server error' });
};
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[ase-os-api] listening on http://localhost:${PORT}`);
});
