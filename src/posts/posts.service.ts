import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsRepository } from './posts.repository';

@Injectable()
export class PostsService {
  constructor(private readonly repository: PostsRepository) { }

  async create(createPostDto: CreatePostDto) {
    return this.repository.create(createPostDto);
  }

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: number) {
    const post = await this.repository.findOne(id);
    if (!post) throw new HttpException(`Post not found`, HttpStatus.NOT_FOUND);

    return post;
  }

  async update(id: number, updatePostDto: UpdatePostDto) {
    await this.findOne(id);
    return this.repository.update(id, updatePostDto);
  }

  async remove(id: number) {
    const post = await this.repository.findOneWithPublications(id);
    if (!post) throw new HttpException(`Post not found`, HttpStatus.NOT_FOUND);
    if (post.Publication.length > 0) throw new HttpException(`Cannot delete post in use`, HttpStatus.FORBIDDEN);

    return this.repository.remove(id);
  }
}
