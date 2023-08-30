import { CreatePostDto } from "../../src/posts/dto/create-post.dto";
import { PrismaService } from "../../src/prisma/prisma.service";

export class PostFactory {
  private title: string;
  private text: string;
  private image: string;

  constructor(private readonly prisma: PrismaService) { }

  withTitle(title: string) {
    this.title = title;
    return this;
  }

  withText(text: string) {
    this.text = text;
    return this;
  }

  withImage(image: string) {
    this.image = image;
    return this;
  }

  build(): CreatePostDto {
    return {
      title: this.title,
      text: this.text,
      image: this.image
    }
  }

  async persist() {
    const post = this.build();
    return await this.prisma.post.create({
      data: post
    });
  }

}