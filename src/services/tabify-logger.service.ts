import { Logger, Injectable } from '@nestjs/common';

@Injectable()
export class TabifyLogger extends Logger {
  error(message: string, trace: string) {
    /* your implementation */
    super.error(message, trace);
  }
  warn(message: string) {
    /* your implementation */
    super.warn(message);
  }
}