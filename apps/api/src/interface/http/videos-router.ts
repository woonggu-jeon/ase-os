import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import {
  ALLOWED_VIDEO_MIME_TYPES,
  MAX_VIDEO_SIZE_BYTES,
  isAllowedVideoMimeType,
  toVideoView,
} from '../../domain/video.js';
import type { UploadVideoService } from '../../application/upload-video-service.js';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

function ensureUploadDir(): void {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadDir();
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${randomToken()}${ext}`);
  },
});

function randomToken(): string {
  return Math.random().toString(16).slice(2, 10);
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_VIDEO_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    // Accept only known video types; multer drops rejected files silently,
    // so the route handler reports the 400 when req.file is absent.
    cb(null, isAllowedVideoMimeType(file.mimetype));
  },
});

export function createVideosRouter(service: UploadVideoService): Router {
  const router = Router();

  router.post('/', upload.single('video'), (req, res) => {
    const file = req.file;
    if (!file) {
      res.status(400).json({
        error: `No valid video file. Allowed types: ${ALLOWED_VIDEO_MIME_TYPES.join(', ')}`,
      });
      return;
    }

    const video = service.register({
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      storedPath: file.path,
    });

    res.status(201).json(toVideoView(video));
  });

  router.get('/', (_req, res) => {
    res.json(service.list().map(toVideoView));
  });

  router.get('/:id', (req, res) => {
    const video = service.findById(req.params.id);
    if (!video) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }
    res.json(toVideoView(video));
  });

  return router;
}
