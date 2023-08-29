import { Injectable } from '@nestjs/common';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MediasRepository {
  
  constructor(private readonly prisma: PrismaService) { }

  create(createMediaDto: CreateMediaDto) {
    return this.prisma.media.create ({
      data: createMediaDto
    })
  }

  findAll() {
    return this.prisma.media.findMany();
  }

  findOne(id: number) {
    return this.prisma.media.findUnique({
      where: { id }
    });
  }

  update(id: number, updateMediaDto: UpdateMediaDto) {
    return `This action updates a #${id} media`;
  }

  remove(id: number) {
    return `This action removes a #${id} media`;
  }
}
