import express from 'express';

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

app.listen(PORT, () => {
  console.log(`[ase-os-api] listening on http://localhost:${PORT}`);
});
