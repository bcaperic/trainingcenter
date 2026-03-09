import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { MissionsService } from './missions.service';
import { CreateMissionDto, UpdateMissionDto } from './dto/create-mission.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('programs/:programId/missions')
export class MissionsController {
  constructor(private missionsService: MissionsService) {}

  @Get()
  @Roles('ADMIN', 'INSTRUCTOR')
  @UseGuards(RolesGuard)
  findAll(@Param('programId') programId: string) {
    return this.missionsService.findAll(programId);
  }

  @Get('weeks/:weekId')
  findByWeek(
    @Param('programId') programId: string,
    @Param('weekId') weekId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.missionsService.findByWeek(programId, weekId, userId);
  }

  @Post()
  @Roles('ADMIN', 'INSTRUCTOR')
  @UseGuards(RolesGuard)
  create(
    @Param('programId') programId: string,
    @Body() dto: CreateMissionDto,
  ) {
    return this.missionsService.create(programId, dto);
  }

  @Put(':missionId')
  @Roles('ADMIN', 'INSTRUCTOR')
  @UseGuards(RolesGuard)
  update(
    @Param('missionId') missionId: string,
    @Body() dto: UpdateMissionDto,
  ) {
    return this.missionsService.update(missionId, dto);
  }

  @Post(':missionId/publish')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  publish(@Param('missionId') missionId: string) {
    return this.missionsService.publish(missionId);
  }

  // ── Mission Attachments ──

  @Get(':missionId/attachments')
  listAttachments(@Param('missionId') missionId: string) {
    return this.missionsService.listMissionAttachments(missionId);
  }

  @Post(':missionId/attachments')
  @Roles('ADMIN', 'INSTRUCTOR')
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  uploadAttachment(
    @Param('missionId') missionId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    return this.missionsService.uploadMissionAttachment(missionId, file, userId);
  }

  @Get(':missionId/attachments/:attachmentId/download')
  async downloadAttachment(
    @Param('missionId') missionId: string,
    @Param('attachmentId') attachmentId: string,
    @Res() res: Response,
  ) {
    const { stream, attachment } =
      await this.missionsService.downloadMissionAttachment(missionId, attachmentId);
    res.set({
      'Content-Type': attachment.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.filename)}"`,
      'Content-Length': String(attachment.size),
    });
    stream.pipe(res);
  }

  @Delete(':missionId/attachments/:attachmentId')
  @Roles('ADMIN', 'INSTRUCTOR')
  @UseGuards(RolesGuard)
  deleteAttachment(
    @Param('missionId') missionId: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.missionsService.deleteMissionAttachment(missionId, attachmentId);
  }
}
