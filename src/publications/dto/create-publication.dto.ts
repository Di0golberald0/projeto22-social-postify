import { IsDateString, IsPositive } from "class-validator";

export class CreatePublicationDto {

  @IsPositive()
  mediaId: number;

  @IsPositive()
  postId: number;

  @IsDateString()
  date: string;

  constructor(params?: Partial<CreatePublicationDto>) {
    Object.assign(this, params);
  }

}
