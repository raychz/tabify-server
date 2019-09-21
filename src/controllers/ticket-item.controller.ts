import { Get, Controller, Query, Res, Post, Body, Param } from '@nestjs/common';
import { Response as ServerResponse } from 'express-serve-static-core';
import { TicketItemService } from '@tabify/services';

@Controller('ticket-item')
export class TicketItemController {

    constructor(
        private readonly ticketItemService: TicketItemService,
    ) { }

    @Get(':ticketId')
    async getTicketItems(
        @Res() res: ServerResponse,
        @Param('ticketId') ticketId: number,
    ) {

        const ticketItems = await this.ticketItemService.getTicketItems(ticketId);
        res.send(ticketItems);
    }
}