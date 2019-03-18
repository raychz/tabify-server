import 'reflect-metadata';
import { config } from 'dotenv-flow';
config({ cwd: '.env/' });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import env from './globals/env';
import { connect } from './globals/connection';
import { Logger } from '@nestjs/common';
import * as express from 'express';
import * as http from 'http';

const expressApp = express();
export const httpServer = http.createServer(expressApp);

async function bootstrap() {
  await connect();
  const app = await NestFactory.create(AppModule, expressApp, {
    cors: {
      origin: ['http://localhost:8100', 'http://localhost:8101', 'http://m.tabifyapp.com'],
    },
  });
  await app.init();
  await httpServer.listen(env.port, () => {
    Logger.log(`NODE_ENV set to ${process.env.NODE_ENV}`);
    Logger.log(`Server listening on port ${env.port}`);
  });
}

bootstrap();
