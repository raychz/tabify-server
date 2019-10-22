import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
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
      origin: ['http://localhost:8100', 'http://localhost:8101', 'https://m.tabifyapp.com'],
    },
  });
  await app.init();
  await httpServer.listen(process.env.PORT, () => {
    Logger.log(`NODE_ENV set to ${process.env.NODE_ENV}`);
    Logger.log(`Server listening on port ${process.env.PORT}`);
  });
}

bootstrap();
