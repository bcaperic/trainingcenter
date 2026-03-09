import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { SessionsService } from './sessions.service';
import { CreateSessionDto, UpdateSessionDto } from './dto/create-session.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
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

  // ── Session Attachments ──

  @Get(':sessionId/attachments')
  listAttachments(@Param('sessionId') sessionId: string) {
    return this.sessionsService.listSessionAttachments(sessionId);
  }

  @Post(':sessionId/attachments')
  @Roles('ADMIN', 'INSTRUCTOR')
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  uploadAttachment(
    @Param('sessionId') sessionId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    return this.sessionsService.uploadSessionAttachment(sessionId, file, userId);
  }

  @Get(':sessionId/attachments/:attachmentId/download')
  async downloadAttachment(
    @Param('sessionId') sessionId: string,
    @Param('attachmentId') attachmentId: string,
    @Res() res: Response,
  ) {
    const { stream, attachment } =
      await this.sessionsService.downloadSessionAttachment(sessionId, attachmentId);
    res.set({
      'Content-Type': attachment.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.filename)}"`,
      'Content-Length': String(attachment.size),
    });
    stream.pipe(res);
  }

  @Delete(':sessionId/attachments/:attachmentId')
  @Roles('ADMIN', 'INSTRUCTOR')
  @UseGuards(RolesGuard)
  deleteAttachment(
    @Param('sessionId') sessionId: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.sessionsService.deleteSessionAttachment(sessionId, attachmentId);
  }
}
