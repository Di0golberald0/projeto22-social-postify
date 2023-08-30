import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { E2EUtils } from './utils/e2e-utils';
import { PrismaService } from '../src/prisma/prisma.service';
import { PostFactory } from './factories/post.factory';
import { PublicationFactory } from './factories/publication.factory';
import { CreatePostDto } from '../src/posts/dto/create-post.dto';
import { Post } from '@prisma/client';
import { MediaFactory } from './factories/media.factory';
import { UpdatePostDto } from '../src/posts/dto/update-post.dto';

describe('Post E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService = new PrismaService();

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe())
    await app.init();

    await E2EUtils.cleanDb(prisma);
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('POST /posts => should create a post', async () => {
    
    const postDto: CreatePostDto = new CreatePostDto({
      title: "Fun Post",
      text: "This post is fun!"
    });

    await request(app.getHttpServer())
      .post('/posts')
      .send(postDto)
      .expect(HttpStatus.CREATED)

    const posts = await prisma.post.findMany();
    expect(posts).toHaveLength(1);
    const post = posts[0];
    expect(post).toEqual({
      id: expect.any(Number),
      title: postDto.title,
      text: postDto.text,
      image: null
    })
  });

  it("POST /posts => should not create a post with properties missing", async () => {
    
    const postDto = new CreatePostDto();
    await request(app.getHttpServer())
      .post('/posts')
      .send(postDto)
      .expect(HttpStatus.BAD_REQUEST)
  });

  it("GET /posts => should get all posts", async () => {
    
    await new PostFactory(prisma)
      .withTitle("Fun Post")
      .withText("This post is fun!")
      .persist()

    await new PostFactory(prisma)
      .withTitle("Fun Post 2")
      .withText("This post is funnier!")
      .persist()

    const { status, body } = await request(app.getHttpServer()).get("/posts");
    expect(status).toBe(HttpStatus.OK);
    expect(body).toHaveLength(2);
  });

  it("GET /posts/:id => should get specific post", async () => {
    
    const post = await new PostFactory(prisma)
      .withTitle("Fun Post")
      .withText("This post is fun!")
      .persist()

    await new PostFactory(prisma)
      .withTitle("Fun Post 2")
      .withText("This post is funnier!")
      .persist()

    const { status, body } = await request(app.getHttpServer()).get(`/posts/${post.id}`);
    expect(status).toBe(HttpStatus.OK);
    expect(body).toEqual({
      id: expect.any(Number),
      title: "Fun Post",
      text: "This post is fun!",
      image: null
    })
  });

  it("GET /posts/:id => should get an error when specific post does not exist", async () => {
    
    const { status } = await request(app.getHttpServer()).get(`/posts/9999`);
    expect(status).toBe(HttpStatus.NOT_FOUND);
  });

  it('PUT /posts => should update a post', async () => {
    
    const post = await new PostFactory(prisma)
      .withTitle("Fun Post")
      .withText("This post is fun!")
      .persist();

    const updatePostDto = new UpdatePostDto({
      title: "Awesome Post",
      text: "This post is awesome!",
      image: "https://fun.com?image=2",
    });

    await request(app.getHttpServer())
      .put(`/posts/${post.id}`)
      .send(updatePostDto)
      .expect(HttpStatus.OK)

    const posts = await prisma.post.findMany();
    expect(posts).toHaveLength(1);
    expect(posts[0]).toEqual<Post>({
      id: expect.any(Number),
      title: updatePostDto.title,
      text: updatePostDto.text,
      image: updatePostDto.image
    })
  });

  it('PUT /posts => should not update a post if does not exist', async () => {
    
    const postDto: CreatePostDto = new CreatePostDto({
      title: "Fun Post!",
      text: "This is post is fun!"
    });

    await request(app.getHttpServer())
      .put(`/posts/9999`)
      .send(postDto)
      .expect(HttpStatus.NOT_FOUND)
  });

  it('DELETE /posts => should delete a post', async () => {
    
    const post = await new PostFactory(prisma)
      .withTitle("Fun Post")
      .withText("This post is fun!")
      .persist()

    await request(app.getHttpServer())
      .delete(`/posts/${post.id}`)
      .expect(HttpStatus.OK);

    const posts = await prisma.post.findMany();
    expect(posts).toHaveLength(0);
  });

  it('DELETE /posts => should not delete a post if does not exist', async () => {
    await request(app.getHttpServer())
      .delete(`/posts/9999`)
      .expect(HttpStatus.NOT_FOUND);
  });

  it('DELETE /posts => should not delete a post if scheduled or published', async () => {
    
    const media = await new MediaFactory(prisma)
      .withTitle("Social Media")
      .withUsername("social.media")
      .persist();

    const post = await new PostFactory(prisma)
      .withTitle("Fun Post")
      .withText("This post is fun!")
      .persist()

    await new PublicationFactory(prisma)
      .withMediaId(media.id)
      .withPostId(post.id)
      .withDate(new Date())
      .persist();

    await request(app.getHttpServer())
      .delete(`/posts/${post.id}`)
      .expect(HttpStatus.FORBIDDEN);
  });

});
