import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto, ReviewSubmissionDto } from './dto/create-submission.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Controller('programs/:programId')
export class SubmissionsController {
  constructor(private submissionsService: SubmissionsService) {}

  @Post('missions/:missionId/submit')
  submit(
    @Param('programId') programId: string,
    @Param('missionId') missionId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSubmissionDto,
  ) {
    return this.submissionsService.submit(programId, missionId, userId, dto);
  }

  @Post('missions/:missionId/submit-with-file')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  submitWithFile(
    @Param('programId') programId: string,
    @Param('missionId') missionId: string,
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateSubmissionDto,
  ) {
    return this.submissionsService.submitWithFile(programId, missionId, userId, dto, file);
  }

  @Get('submissions/:submissionId/attachments')
  listAttachments(@Param('submissionId') submissionId: string) {
    return this.submissionsService.listAttachments(submissionId);
  }

  @Get('submissions/:submissionId/attachments/:attachmentId/download')
  async downloadAttachment(
    @Param('attachmentId') attachmentId: string,
    @Res() res: Response,
  ) {
    const { stream, attachment } =
      await this.submissionsService.downloadAttachment(attachmentId);
    res.set({
      'Content-Type': attachment.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.filename)}"`,
    });
    stream.pipe(res);
  }

  @Get('me/submissions')
  findMySubmissions(
    @Param('programId') programId: string,
    @CurrentUser('id') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.submissionsService.findMySubmissions(programId, userId, query);
  }

  @Put('submissions/:submissionId/review')
  @Roles('ADMIN', 'INSTRUCTOR')
  @UseGuards(RolesGuard)
  review(
    @Param('submissionId') submissionId: string,
    @Body() dto: ReviewSubmissionDto,
  ) {
    return this.submissionsService.review(submissionId, dto);
  }
}
