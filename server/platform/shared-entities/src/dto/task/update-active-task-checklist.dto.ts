import { PartialType } from '@nestjs/swagger';
import { CreateActiveTaskChecklistDto } from './create-active-task-checklist.dto';

export class UpdateActiveTaskChecklistDto extends PartialType(CreateActiveTaskChecklistDto) {}
