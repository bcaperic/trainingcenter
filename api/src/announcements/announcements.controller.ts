import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './dto/create-announcement.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('programs/:programId/announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  findAll(
    @Param('programId') programId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.announcementsService.findAll(programId, query);
  }

  @Post()
  @Roles('ADMIN', 'INSTRUCTOR')
  @UseGuards(RolesGuard)
  create(
    @Param('programId') programId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.announcementsService.create(programId, user.id, dto);
  }

  @Put(':id')
  @Roles('ADMIN', 'INSTRUCTOR')
  @UseGuards(RolesGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    return this.announcementsService.update(id, dto);
  }

  @Post(':id/publish')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  publish(@Param('id') id: string) {
    return this.announcementsService.publish(id);
  }
}
