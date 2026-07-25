import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Video } from '@ase-os/shared';
import { VideosController } from '../../src/interface/http/videos.controller';
import type { UploadVideoService } from '../../src/application/upload-video.service';
import type { GenerateSubtitlesService } from '../../src/application/generate-subtitles.service';
import type { DetectScenesService } from '../../src/application/detect-scenes.service';
import type { TimelineService } from '../../src/application/timeline.service';

const video: Video = {
  id: 'v1',
  originalName: 'a.mp4',
  mimeType: 'video/mp4',
  sizeBytes: 10,
  storedPath: '/secret/path/a.mp4',
  metadata: { durationSec: 2, width: 640, height: 360, videoCodec: 'h264', hasAudio: true },
  uploadedAt: '2026-07-25T00:00:00.000Z',
};

function make() {
  const uploads = { register: jest.fn(), list: jest.fn(), findById: jest.fn() };
  const subtitles = { generate: jest.fn(), get: jest.fn() };
  const scenes = { detect: jest.fn(), get: jest.fn() };
  const timeline = { get: jest.fn(), save: jest.fn(), reset: jest.fn() };
  const controller = new VideosController(
    uploads as unknown as UploadVideoService,
    subtitles as unknown as GenerateSubtitlesService,
    scenes as unknown as DetectScenesService,
    timeline as unknown as TimelineService,
  );
  return { controller, uploads, scenes, timeline };
}

describe('VideosController', () => {
  it('upload without a file → BadRequest', async () => {
    const { controller } = make();
    await expect(controller.upload(undefined)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('upload maps the multer file and returns an HTTP-safe view (no storedPath)', async () => {
    const { controller, uploads } = make();
    uploads.register.mockResolvedValue(video);
    const file = {
      originalname: 'a.mp4',
      mimetype: 'video/mp4',
      size: 10,
      path: '/secret/path/a.mp4',
    } as Express.Multer.File;

    const view = await controller.upload(file);

    expect(uploads.register).toHaveBeenCalledWith({
      originalName: 'a.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 10,
      storedPath: '/secret/path/a.mp4',
    });
    expect(view).not.toHaveProperty('storedPath');
    expect(view.id).toBe('v1');
  });

  it('get → NotFound when the video is missing', () => {
    const { controller, uploads } = make();
    uploads.findById.mockReturnValue(undefined);
    expect(() => controller.get('nope')).toThrow(NotFoundException);
  });

  it('detectScenes parses the threshold query (valid → number, invalid → undefined)', () => {
    const { controller, scenes } = make();
    scenes.detect.mockResolvedValue(undefined);

    void controller.detectScenes('v1', '0.3');
    void controller.detectScenes('v1', undefined);
    void controller.detectScenes('v1', 'abc');

    expect(scenes.detect).toHaveBeenNthCalledWith(1, 'v1', 0.3);
    expect(scenes.detect).toHaveBeenNthCalledWith(2, 'v1', undefined);
    expect(scenes.detect).toHaveBeenNthCalledWith(3, 'v1', undefined);
  });

  it('delegates timeline save/reset to the service', () => {
    const { controller, timeline } = make();
    const body = { clips: [] };
    controller.saveTimeline('v1', body);
    controller.resetTimeline('v1');
    expect(timeline.save).toHaveBeenCalledWith('v1', body);
    expect(timeline.reset).toHaveBeenCalledWith('v1');
  });
});
