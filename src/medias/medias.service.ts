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

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: number) {
    const media = await this.repository.findOne(id);
    if (!media) throw new HttpException("Media not found", HttpStatus.NOT_FOUND);

    return media;
  }

  async update(id: number, updateMediaDto: UpdateMediaDto) {
    await this.findOne(id);

    const { title, username } = updateMediaDto;
    const media = await this.repository.findByTitleAndUsername(title, username);
    if (media) throw new HttpException("Media with this info already exists", HttpStatus.CONFLICT);

    return this.repository.update(id, updateMediaDto);
  }

  async remove(id: number) {
    const media = await this.repository.findOneWithPublications(id);
    if (!media) throw new HttpException("Media not found", HttpStatus.NOT_FOUND);
    if (media.Publication.length > 0) throw new HttpException("Cannot delete media in use", HttpStatus.FORBIDDEN);

    return this.repository.remove(id);
  }
}
