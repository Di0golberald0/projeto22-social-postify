import { Module } from '@nestjs/common';
import { PublicationsService } from './publications.service';
import { PublicationsController } from './publications.controller';
import { MediasModule } from '../medias/medias.module';
import { PostsModule } from '../posts/posts.module';
import { PublicationsRepository } from './publications.repository';

@Module({
  imports: [MediasModule, PostsModule],
  controllers: [PublicationsController],
  providers: [PublicationsService, PublicationsRepository],
})
export class PublicationsModule { }
