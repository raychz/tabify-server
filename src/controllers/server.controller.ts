import { Get, Controller, Res, Param } from '@nestjs/common';
import { Response as ServerResponse } from 'express-serve-static-core';
import { ServerService } from '@tabify/services';

@Controller('server')
export class ServerController {
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
