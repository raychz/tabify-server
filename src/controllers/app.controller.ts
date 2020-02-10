import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  constructor() { }

  @Get()
  async helloWorld() {
    var obj = {};
    (obj as any).helloWorld()!;
    return 'Hello World!';
  }
}