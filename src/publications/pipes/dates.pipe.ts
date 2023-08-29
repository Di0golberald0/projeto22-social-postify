import { ArgumentMetadata, BadRequestException, PipeTransform } from "@nestjs/common";

export class ParseDatePipe implements PipeTransform<string, Date> {

  transform(value: string, metadata: ArgumentMetadata): Date {
    if (!value) return undefined;

    const parsedDate = new Date(value);
    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestException(`Invalid date: ${value}`);
    }

    return parsedDate;
  }


}