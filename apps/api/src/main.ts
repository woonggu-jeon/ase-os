import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  // Allow the web app (different port in dev) to call the API directly — needed so
  // large video uploads bypass Next's 10 MB dev-proxy body limit.
  app.enableCors();
  app.setGlobalPrefix('api');
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  console.log(`[ase-os-api] listening on http://localhost:${port}`);
}

void bootstrap();
