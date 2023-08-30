import { PrismaService } from "../../src/prisma/prisma.service";

export class PublicationFactory {
  private mediaId: number;
  private postId: number;
  private date: Date;

  constructor(private readonly prisma: PrismaService) { }

  withMediaId(mediaId: number) {
    this.mediaId = mediaId;
    return this;
  }

  withPostId(postId: number) {
    this.postId = postId;
    return this;
  }

  withDate(date: Date) {
    this.date = date;
    return this;
  }

  build() {
    return {
      mediaId: this.mediaId,
      postId: this.postId,
      date: this.date
    }
  }

  async persist() {
    return await this.prisma.publication.create({
      data: {
        date: this.date,
        media: {
          connect: {
            id: this.mediaId
          }
        },
        post: {
          connect: {
            id: this.postId
          }
        }
      }
    });
  }
}