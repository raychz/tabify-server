import { Get, Controller, Param, Post, Body } from '@nestjs/common';
import { ServerService } from '@tabify/services';
import { User } from '../decorators/user.decorator';

@Controller('server')
export class ServerController {
    constructor(
        private readonly serverService: ServerService,
    ) { }

    @Get('getServerByRefCode/:refCode')
    async getUserInfo(
        @User('uid') uid: string,
        @Param('refCode') refCode: string,
    ) {
        const server = await this.serverService.getServerByRefCode(refCode);
        return server;
    }

    @Post()
    async postServer(
        @Body() serverDetails: any,
    ) {
        const server = await this.serverService.postServer(serverDetails);
        return server;
    }
}
