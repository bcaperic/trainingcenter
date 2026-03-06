import {
  Controller,
  Get,
  Post,
  Param,
  Query,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('programs/:programId/me/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @Param('programId') programId: string,
    @CurrentUser() user: { id: string },
    @Query() query: PaginationQueryDto,
  ) {
    return this.notificationsService.findAll(programId, user.id, query);
  }

  @Post(':id/read')
  markRead(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.notificationsService.markRead(id, user.id);
  }
}
