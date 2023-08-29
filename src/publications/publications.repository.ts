import { Injectable } from '@nestjs/common';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicationsRepository {

  constructor(private readonly prisma: PrismaService) { }

  create(createPublicationDto: CreatePublicationDto) {
    return this.prisma.publication.create({
      data: createPublicationDto
    })
  }

  findAll() {
    return this.prisma.publication.findMany();
  }

  findOne(id: number) {
    return this.prisma.publication.findUnique({
      where: { id }
    })
  }

  findAllPublished(published: boolean) {
    const today = new Date;
    const filter = published ? { lt: today } : { gt: today };
    return this.prisma.publication.findMany({
      where: {
        date: filter
      }
    })
  }

  findAllAfter(after: Date) {
    return this.prisma.publication.findMany({
      where: {
        date: {
          gt: after
        }
      }
    })
  }

  filter(published: boolean, after: Date) {
    const today = new Date();

    if (published) {
      if (after > today) return [];
      return this.prisma.publication.findMany({ // from date to today
        where: {
          AND: [
            { date: { gt: after } },
            { date: { lt: today } }
          ]
        }
      })
    }

    const refDate = after > today ? after : today;
    return this.prisma.publication.findMany({
      where: {
        date: {
          gt: refDate
        }
      }
    })
  }

  update(id: number, updatePublicationDto: UpdatePublicationDto) {
    return this.prisma.publication.update({
      where: { id },
      data: updatePublicationDto
    })
  }

  remove(id: number) {
    return this.prisma.publication.delete({
      where: { id }
    })
  }
}
