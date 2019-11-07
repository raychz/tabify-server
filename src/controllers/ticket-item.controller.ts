import { Get, Controller, Query, Res, Post, Body, Put, Param } from '@nestjs/common';
import { User } from '../decorators/user.decorator';

@Controller('tickets/:ticketId/items')
export class TicketItemController {
}