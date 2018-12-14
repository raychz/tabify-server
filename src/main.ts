import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from 'modules/app.module';
import env from './globals/env';
import { connect } from 'globals/connection';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  await connect();

  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: 'http://localhost:8100',
    },
  });
  await app.listen(env.port, () => {
    Logger.log(`Server listening on port ${env.port}`);
  });
}

bootstrap();
