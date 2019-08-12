import { Get, Controller, Res, Param } from '@nestjs/common';
import { ServerService } from 'src/services/server.service';
import { Response as ServerResponse } from 'express-serve-static-core';

@Controller('server')
export class UserController {
    constructor(
        private readonly serverService: ServerService,
    ) { }

    @Get('getServerByRefCode/:refCode')
    async getUserInfo(
        @Res() res: ServerResponse,
        @Param('refCode') refCode: string,
    ) {
        const server = await this.serverService.getServerByRefCode(refCode);
        res.send(server);
    }
}
