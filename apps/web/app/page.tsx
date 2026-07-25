import { VideoUpload } from './video-upload';

export default function HomePage() {
  return (
    <main style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
      <h1>ASE-OS</h1>
      <p>AI Video Editing MVP — Phase 1</p>
      <VideoUpload />
    </main>
  );
}
