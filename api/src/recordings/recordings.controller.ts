import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';
import { RecordingsService } from './recordings.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('programs/:programId/me/recordings')
export class RecordingsController {
  constructor(private readonly recordingsService: RecordingsService) {}

  @Get()
  findMyRecordings(
    @Param('programId') programId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.recordingsService.findMyRecordings(programId, user.id);
  }
}
