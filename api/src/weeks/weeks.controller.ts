import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { WeeksService } from './weeks.service';
import { CreateWeekDto, UpdateWeekDto } from './dto/create-week.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('programs/:programId/weeks')
export class WeeksController {
  constructor(private readonly weeksService: WeeksService) {}

  @Get()
  findAll(@Param('programId') programId: string) {
    return this.weeksService.findAll(programId);
  }

  @Post()
  @Roles('ADMIN', 'INSTRUCTOR')
  @UseGuards(RolesGuard)
  create(
    @Param('programId') programId: string,
    @Body() dto: CreateWeekDto,
  ) {
    return this.weeksService.create(programId, dto);
  }

  @Put(':weekId')
  @Roles('ADMIN', 'INSTRUCTOR')
  @UseGuards(RolesGuard)
  update(
    @Param('weekId') weekId: string,
    @Body() dto: UpdateWeekDto,
  ) {
    return this.weeksService.update(weekId, dto);
  }

  @Post(':weekId/publish')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  publish(@Param('weekId') weekId: string) {
    return this.weeksService.publish(weekId);
  }
}
