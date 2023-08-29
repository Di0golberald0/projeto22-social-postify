import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { MediasRepository } from './medias.repository';

@Injectable()
export class MediasService {

  constructor(private readonly repository: MediasRepository) { }

  async create(createMediaDto: CreateMediaDto) {
    const { title, username } = createMediaDto;
    const media = await this.repository.findByTitleAndUsername(title, username);
    if (media) throw new HttpException("Media with this info already exists", HttpStatus.CONFLICT);

    return this.repository.create(createMediaDto);
  }

  findAll() {
    return `This action returns all medias`;
  }

  findOne(id: number) {
    return `This action returns a #${id} media`;
  }

  update(id: number, updateMediaDto: UpdateMediaDto) {
    return `This action updates a #${id} media`;
  }

  remove(id: number) {
    return `This action removes a #${id} media`;
  }
}
