import { Get, Controller, Res, Param, Post, Body } from '@nestjs/common';
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

    @Post()
    async postServer(
        @Res() res: ServerResponse,
        @Body() serverDetails: any,
    ) {
        const server = await this.serverService.postServer(serverDetails);
        res.send(server);
    }
}
