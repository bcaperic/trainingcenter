import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto, UpdateSessionDto } from './dto/create-session.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('programs/:programId/sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  findAll(
    @Param('programId') programId: string,
    @Query() query: PaginationQueryDto & { weekId?: string; from?: string; to?: string },
  ) {
    return this.sessionsService.findAll(programId, query);
  }

  @Post()
  @Roles('ADMIN', 'INSTRUCTOR')
  @UseGuards(RolesGuard)
  create(
    @Param('programId') programId: string,
    @Body() dto: CreateSessionDto,
  ) {
    return this.sessionsService.create(programId, dto);
  }

  @Get(':sessionId')
  findOne(@Param('sessionId') sessionId: string) {
    return this.sessionsService.findOne(sessionId);
  }

  @Put(':sessionId')
  @Roles('ADMIN', 'INSTRUCTOR')
  @UseGuards(RolesGuard)
  update(
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdateSessionDto,
  ) {
    return this.sessionsService.update(sessionId, dto);
  }

  @Post(':sessionId/cancel')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  cancel(@Param('sessionId') sessionId: string) {
    return this.sessionsService.cancel(sessionId);
  }

  @Post(':sessionId/recording')
  @Roles('ADMIN', 'INSTRUCTOR')
  @UseGuards(RolesGuard)
  setRecordingUrl(
    @Param('sessionId') sessionId: string,
    @Body('url') url: string,
  ) {
    return this.sessionsService.setRecordingUrl(sessionId, url);
  }

  @Post(':sessionId/checkin-code')
  @Roles('ADMIN', 'INSTRUCTOR')
  @UseGuards(RolesGuard)
  generateCheckinCode(@Param('sessionId') sessionId: string) {
    return this.sessionsService.generateCheckinCode(sessionId);
  }
}
