import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { PublicationsRepository } from './publications.repository';
import { PostsService } from '../posts/posts.service';
import { MediasService } from '../medias/medias.service';

@Injectable()
export class PublicationsService {

  constructor(
    private readonly repository: PublicationsRepository,
    private readonly postsService: PostsService,
    private readonly mediasService: MediasService
  ) { }

  async create(createPublicationDto: CreatePublicationDto) {
    await this.isValidPublication(createPublicationDto);
    return this.repository.create(createPublicationDto);
  }

  private async isValidPublication(dto: CreatePublicationDto | UpdatePublicationDto) {
    const { mediaId, postId, date } = dto;

    if (mediaId) await this.mediasService.findOne(mediaId);
    if (postId) await this.postsService.findOne(postId);
    if (date) this.isPastDate(new Date(date))
  }

  private isPastDate(date: Date) {
    const current = new Date();
    if (date < current) throw new HttpException("Cannot schedule in the past", HttpStatus.FORBIDDEN);
  }

  async findAll() {
    return await this.repository.findAll();
  }

  async findAllPublished(published: boolean) {
    return await this.repository.findAllPublished(published);
  }

  async findAllAfter(after: Date) {
    return await this.repository.findAllAfter(after);
  }

  async filter(published: boolean, after: Date) {
    return await this.repository.filter(published, after);
  }

  async findOne(id: number) {
    const publication = await this.repository.findOne(id);
    if (!publication) throw new HttpException("Publication not found", HttpStatus.NOT_FOUND)

    return publication;
  }

  async update(id: number, updatePublicationDto: UpdatePublicationDto) {
    await this.isValidPublication(updatePublicationDto);
    return this.repository.update(id, updatePublicationDto);
  }

  async remove(id: number) {
    await this.findOne(id);
    return await this.repository.remove(id);
  }
}
