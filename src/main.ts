// This allows TypeScript to detect our global value
declare global {
  namespace NodeJS {
    interface Global {
      __rootdir__: string;
    }
  }
}

global.__rootdir__ = __dirname || process.cwd();
import { RewriteFrames } from '@sentry/integrations';
import * as Sentry from '@sentry/node';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { connect } from './globals/connection';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  await connect();
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: [
        'http://localhost:8100',
        'http://localhost:8101',
        'http://localhost:8080',
        'capacitor://localhost',
        'http://localhost',
        'ionic://localhost',
        'https://m.tabifyapp.com'],
    },
  });
  Sentry.init({
    enabled: process.env.NODE_ENV === 'production',
    dsn: process.env.SENTRY_DSN,
    integrations: [new RewriteFrames({
      root: global.__rootdir__,
    })],
  });
  await app.listen(process.env.PORT!, () => {
    Logger.log(`NODE_ENV set to ${process.env.NODE_ENV}`);
    Logger.log(`Server listening on port ${process.env.PORT}`);
  });
}

bootstrap();
