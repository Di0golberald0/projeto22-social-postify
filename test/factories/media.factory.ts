import { PrismaService } from "../../src/prisma/prisma.service";

export class MediaFactory {
  private title: string;
  private username: string;

  constructor(private readonly prisma: PrismaService) { }

  withTitle(title: string) {
    this.title = title;
    return this;
  }

  withUsername(username: string) {
    this.username = username;
    return this;
  }

  build() {
    return {
      title: this.title,
      username: this.username
    }
  }

  async persist() {
    const media = this.build();
    return await this.prisma.media.create({
      data: media
    })
  }

}