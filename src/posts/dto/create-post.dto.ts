import { IsNotEmpty, IsOptional, IsString, IsUrl } from "class-validator";

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsUrl()
  @IsNotEmpty()
  @IsOptional()
  image: string;

  constructor(params?: Partial<CreatePostDto>) {
    Object.assign(this, params);
  }
}
