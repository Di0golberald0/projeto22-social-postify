import { PartialType } from '@nestjs/mapped-types';
import { CreatePublicationDto } from './create-publication.dto';

export class UpdatePublicationDto extends PartialType(CreatePublicationDto) {
  constructor(params?: Partial<CreatePublicationDto>) {
    super();
    Object.assign(this, params);
  }
}
