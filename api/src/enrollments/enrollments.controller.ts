import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
} from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('programs/:programId')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post('sessions/:sessionId/enroll')
  enroll(
    @Param('programId') programId: string,
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.enrollmentsService.enroll(programId, sessionId, userId);
  }

  @Delete('sessions/:sessionId/enroll')
  cancel(
    @Param('programId') programId: string,
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.enrollmentsService.cancel(programId, sessionId, userId);
  }

  @Get('me/enrollments')
  findMyEnrollments(
    @Param('programId') programId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.enrollmentsService.findMyEnrollments(programId, userId);
  }
}
