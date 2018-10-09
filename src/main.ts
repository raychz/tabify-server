require('dotenv').config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from 'modules/app.module';

import env from './globals/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  console.log(`Server Listening on ${env.port}`);
  await app.listen(env.port);
}

bootstrap();
