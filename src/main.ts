import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // ---------------------------------------------------------------------------
  // HLS Static File Serving
  // Serves the contents of videos/output at the /videos URL prefix.
  // Custom MIME types are required so HLS players (HLS.js, Safari, etc.)
  // accept the playlist and segment files correctly.
  //   .m3u8  →  application/vnd.apple.mpegurl
  //   .ts    →  video/mp2t
  // ---------------------------------------------------------------------------
  const videosOutputPath = path.join(process.cwd(), 'videos', 'output');

  app.use(
    '/videos',
    express.static(videosOutputPath, {
      setHeaders(res, filePath) {
        if (filePath.endsWith('.m3u8')) {
          res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        } else if (filePath.endsWith('.ts')) {
          res.setHeader('Content-Type', 'video/mp2t');
        }
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
