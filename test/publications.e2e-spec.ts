import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { E2EUtils } from './utils/e2e-utils';
import { PrismaService } from '../src/prisma/prisma.service';
import { PostFactory } from './factories/post.factory';
import { PublicationFactory } from './factories/publication.factory';
import { Publication } from '@prisma/client';
import { MediaFactory } from './factories/media.factory';
import { CreatePublicationDto } from '../src/publications/dto/create-publication.dto';
import { UpdatePublicationDto } from '../src/publications/dto/update-publication.dto';

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

  it('POST /publications => should create a publication', async () => {
    
    const { id: mediaId } = await new MediaFactory(prisma)
      .withTitle("Social Media")
      .withUsername("social.media")
      .persist();

    const { id: postId } = await new PostFactory(prisma)
      .withTitle("Fun Post")
      .withText("This post is fun!")
      .persist()

    const nextThreeDays = E2EUtils.generateDate(3);
    const publicationDTO: CreatePublicationDto = new CreatePublicationDto({
      mediaId,
      postId,
      date: nextThreeDays.toISOString()
    });

    await request(app.getHttpServer())
      .post('/publications')
      .send(publicationDTO)
      .expect(HttpStatus.CREATED)

    const publications = await prisma.publication.findMany();
    expect(publications).toHaveLength(1);
    const publication = publications[0];
    expect(publication).toEqual<Publication>({
      id: expect.any(Number),
      postId: postId,
      mediaId: mediaId,
      date: nextThreeDays
    })
  });

  it("POST /publications => should not create a publication with properties missing", async () => {
    
    const publicationDTO: CreatePublicationDto = new CreatePublicationDto(); // missing properties on purpose

    await request(app.getHttpServer())
      .post('/publications')
      .send(publicationDTO)
      .expect(HttpStatus.BAD_REQUEST)
  });

  it("GET /publications => should get all publications", async () => {
    const { id: mediaId } = await new MediaFactory(prisma)
      .withTitle("Social Media")
      .withUsername("social.media")
      .persist();

    const { id: postId } = await new PostFactory(prisma)
      .withTitle("Fun Post")
      .withText("This post is fun!")
      .persist()

    const nextThreeDays = E2EUtils.generateDate(3);
    const nextFourDays = E2EUtils.generateDate(4);

    await new PublicationFactory(prisma)
      .withPostId(postId)
      .withMediaId(mediaId)
      .withDate(nextThreeDays)
      .persist();

    await new PublicationFactory(prisma)
      .withPostId(postId)
      .withMediaId(mediaId)
      .withDate(nextFourDays)
      .persist();

    const { status, body } = await request(app.getHttpServer()).get("/publications");
    expect(status).toBe(HttpStatus.OK);
    expect(body).toHaveLength(2);
  });

  it("GET /publications => should get only publications that are published (published = true)", async () => {
    
    const mediaFactory = new MediaFactory(prisma);
    mediaFactory.withTitle("Social Media");
    mediaFactory.withUsername("social.media");
    const { id: mediaId } = await mediaFactory.persist();

    const postFactory = new PostFactory(prisma);
    postFactory.withTitle("Post");
    postFactory.withText("This is a Post.");
    const { id: postId } = await postFactory.persist();

    const threeDaysAgo = E2EUtils.generateDate(-3);
    const firstPublication = await new PublicationFactory(prisma)
      .withDate(threeDaysAgo)
      .withPostId(postId)
      .withMediaId(mediaId)
      .persist();

    const nextFourDays = E2EUtils.generateDate(4);
    await new PublicationFactory(prisma)
      .withDate(nextFourDays)
      .withPostId(postId)
      .withMediaId(mediaId)
      .persist();

    const { status, body } = await request(app.getHttpServer()).get("/publications?published=true");
    expect(status).toBe(HttpStatus.OK);
    expect(body).toHaveLength(1);
    expect(body[0]).toEqual({ ...firstPublication, date: firstPublication.date.toISOString() })
  });

  it("GET /publications => should get only publications that are not published (published = false)", async () => {
    
    const { id: mediaId } = await new MediaFactory(prisma)
      .withTitle("Social Media")
      .withUsername("social.media")
      .persist();

    const { id: postId } = await new PostFactory(prisma)
      .withTitle("Post")
      .withText("This is a Post.")
      .persist();


    const threeDaysAgo = E2EUtils.generateDate(-3);
    await new PublicationFactory(prisma)
      .withDate(threeDaysAgo)
      .withPostId(postId)
      .withMediaId(mediaId)
      .persist();

    const nextFourDays = E2EUtils.generateDate(4);
    const scheduledPublication = await new PublicationFactory(prisma)
      .withDate(nextFourDays)
      .withPostId(postId)
      .withMediaId(mediaId)
      .persist();

    const { status, body } = await request(app.getHttpServer()).get("/publications?published=false");
    expect(status).toBe(HttpStatus.OK);
    expect(body).toHaveLength(1);
    expect(body[0]).toEqual({ ...scheduledPublication, date: scheduledPublication.date.toISOString() })
  });

  it("GET /publications => should get only publications after specific date (after=[date])", async () => {
    
    const { id: mediaId } = await new MediaFactory(prisma)
      .withTitle("Social Media")
      .withUsername("social.media")
      .persist();

    const { id: postId } = await new PostFactory(prisma)
      .withTitle("Post")
      .withText("This is a Post.")
      .persist();

    const threeDaysAgo = E2EUtils.generateDate(-3);
    const pastPublication = await new PublicationFactory(prisma)
      .withDate(threeDaysAgo)
      .withPostId(postId)
      .withMediaId(mediaId)
      .persist();

    const nextFourDays = E2EUtils.generateDate(4);
    const futurePublication = await new PublicationFactory(prisma)
      .withDate(nextFourDays)
      .withPostId(postId)
      .withMediaId(mediaId)
      .persist();

    const filter = E2EUtils.formatDateToYearMonthDay(new Date());

    const { status, body } = await request(app.getHttpServer()).get(`/publications?after=${filter}`);
    expect(status).toBe(HttpStatus.OK);
    expect(body).toHaveLength(1);
    expect(body[0]).toEqual({ ...futurePublication, date: futurePublication.date.toISOString() })
  });

  it("GET /publications => should get none if looking for published in the future (published = true & after=[future])", async () => {
    
    const { id: mediaId } = await new MediaFactory(prisma)
      .withTitle("Social Media")
      .withUsername("social.media")
      .persist();

    const { id: postId } = await new PostFactory(prisma)
      .withTitle("Post")
      .withText("This is a Post.")
      .persist();

    const nextFourDays = E2EUtils.generateDate(4);
    await new PublicationFactory(prisma)
      .withDate(nextFourDays)
      .withPostId(postId)
      .withMediaId(mediaId)
      .persist();

    const nextThreeDays = E2EUtils.generateDate(3);
    const filter = E2EUtils.formatDateToYearMonthDay(nextThreeDays);

    const { status, body } = await request(app.getHttpServer()).get(`/publications?published=true&after=${filter}`);
    expect(status).toBe(HttpStatus.OK);
    expect(body).toHaveLength(0);
  });

  it("GET /publications => should get not published in the past (published = false & after=[past])", async () => {
    
    const { id: mediaId } = await new MediaFactory(prisma)
      .withTitle("Social Media")
      .withUsername("social.media")
      .persist();

    const { id: postId } = await new PostFactory(prisma)
      .withTitle("Post")
      .withText("This is a Post.")
      .persist();

    const threeDaysAgo = E2EUtils.generateDate(-3);
    await new PublicationFactory(prisma)
      .withDate(threeDaysAgo)
      .withPostId(postId)
      .withMediaId(mediaId)
      .persist();

    const nextThreeDays = E2EUtils.generateDate(4);
    await new PublicationFactory(prisma)
      .withDate(nextThreeDays)
      .withPostId(postId)
      .withMediaId(mediaId)
      .persist();

    const tenDaysAgo = E2EUtils.generateDate(-10);
    const filter = E2EUtils.formatDateToYearMonthDay(tenDaysAgo);

    const { status, body } = await request(app.getHttpServer()).get(`/publications?published=false&after=${filter}`);
    expect(status).toBe(HttpStatus.OK);
    expect(body).toHaveLength(1);
  });

  it("GET /publications => should get all from date until today (published=true & after=[past])", async () => {
    
    const { id: mediaId } = await new MediaFactory(prisma)
      .withTitle("Social Media")
      .withUsername("social.media")
      .persist();

    const { id: postId } = await new PostFactory(prisma)
      .withTitle("Post")
      .withText("This is a Post.")
      .persist();

    const tenDaysAgo = E2EUtils.generateDate(-10);
    const tenDaysAgoPublication = await new PublicationFactory(prisma)
      .withDate(tenDaysAgo)
      .withPostId(postId)
      .withMediaId(mediaId)
      .persist();

    const tweentyDaysAgo = E2EUtils.generateDate(-20);
    const tweentyDaysAgoPublication = await new PublicationFactory(prisma)
      .withDate(tweentyDaysAgo)
      .withPostId(postId)
      .withMediaId(mediaId)
      .persist();

    const fifteenDaysAgo = E2EUtils.generateDate(-15);
    const filter = E2EUtils.formatDateToYearMonthDay(fifteenDaysAgo);

    const { status, body } = await request(app.getHttpServer()).get(`/publications?published=true&after=${filter}`);
    expect(status).toBe(HttpStatus.OK);
    expect(body).toHaveLength(1);
    expect(body[0]).toEqual({
      ...tenDaysAgoPublication, date: tenDaysAgoPublication.date.toISOString()
    })
  });

  it("GET /publications => should get all from date forward (published=false & after=[future])", async () => {
    
    const { id: mediaId } = await new MediaFactory(prisma)
      .withTitle("Social Media")
      .withUsername("social.media")
      .persist();

    const { id: postId } = await new PostFactory(prisma)
      .withTitle("Post")
      .withText("This is a Post.")
      .persist();

    const tenDaysAgo = E2EUtils.generateDate(-10);
    await new PublicationFactory(prisma)
      .withDate(tenDaysAgo)
      .withPostId(postId)
      .withMediaId(mediaId)
      .persist();

    const nextTenDays = E2EUtils.generateDate(10);
    const nextTenDaysPublication = await new PublicationFactory(prisma)
      .withDate(nextTenDays)
      .withPostId(postId)
      .withMediaId(mediaId)
      .persist();

    const nextFiveDays = E2EUtils.generateDate(5);
    const filter = E2EUtils.formatDateToYearMonthDay(nextFiveDays);

    const { status, body } = await request(app.getHttpServer()).get(`/publications?published=false&after=${filter}`);
    expect(status).toBe(HttpStatus.OK);
    expect(body).toHaveLength(1);
    expect(body[0]).toEqual({
      ...nextTenDaysPublication, date: nextTenDaysPublication.date.toISOString()
    })
  });

  it("GET /publications/:id => should get specific publication", async () => {
    
    const { id: mediaId } = await new MediaFactory(prisma)
      .withTitle("Social Media")
      .withUsername("social.media")
      .persist();

    const { id: postId } = await new PostFactory(prisma)
      .withTitle("Post")
      .withText("This is a Post.")
      .persist();

    const nextThreeDays = E2EUtils.generateDate(3);
    const firstPublication = await new PublicationFactory(prisma)
      .withMediaId(mediaId)
      .withPostId(postId)
      .withDate(nextThreeDays)
      .persist()

    const nextFourDays = E2EUtils.generateDate(4);
    await new PublicationFactory(prisma)
      .withMediaId(mediaId)
      .withPostId(postId)
      .withDate(nextFourDays)
      .persist()

    const { status, body } = await request(app.getHttpServer()).get(`/publications/${firstPublication.id}`);
    expect(status).toBe(HttpStatus.OK);
    expect(body).toEqual({
      ...firstPublication, date: firstPublication.date.toISOString()
    })
  });

  it("GET /publications/:id => should get an error when specific publication does not exist", async () => {
    
    const { status } = await request(app.getHttpServer()).get(`/publications/9999`);
    expect(status).toBe(HttpStatus.NOT_FOUND);
  });

  it('PUT /publications => should update a publication', async () => {
    const { id: mediaId } = await new MediaFactory(prisma)
      .withTitle("Social Media")
      .withUsername("social.media")
      .persist();

    const { id: postId } = await new PostFactory(prisma)
      .withTitle("Post")
      .withText("This is a Post.")
      .persist();

    const today = new Date();
    const nextThreeDays = new Date(today.setDate(today.getDate() + 3));

    const publication = await new PublicationFactory(prisma)
      .withMediaId(mediaId)
      .withPostId(postId)
      .withDate(nextThreeDays)
      .persist();

    const nextFourDays = new Date(today.setDate(today.getDate() + 4));
    const updatePublicationDTO = new UpdatePublicationDto({
      date: nextFourDays.toISOString()
    });

    await request(app.getHttpServer())
      .put(`/publications/${publication.id}`)
      .send(updatePublicationDTO)
      .expect(HttpStatus.OK)

    const modifiedPublication = await prisma.publication.findUnique({
      where: { id: publication.id }
    });
    expect(modifiedPublication).toEqual({
      ...publication, date: nextFourDays
    })
  });

  it('PUT /publications => should not update a publication if does not exist', async () => {
    
    const publicationDTO: UpdatePublicationDto = new UpdatePublicationDto({
      mediaId: 1,
      postId: 1,
      date: new Date().toISOString()
    });

    await request(app.getHttpServer())
      .put(`/publications/9999`)
      .send(publicationDTO)
      .expect(HttpStatus.NOT_FOUND)
  });

  it('DELETE /publications => should delete a publication', async () => {
    
    const { id: mediaId } = await new MediaFactory(prisma)
      .withTitle("Social Media")
      .withUsername("social.media")
      .persist();

    const { id: postId } = await new PostFactory(prisma)
      .withTitle("Post")
      .withText("This is a Post.")
      .persist();

    const today = new Date();
    const nextThreeDays = new Date(today.setDate(today.getDate() + 3));

    const publication = await new PublicationFactory(prisma)
      .withMediaId(mediaId)
      .withPostId(postId)
      .withDate(nextThreeDays)
      .persist();

    await request(app.getHttpServer())
      .delete(`/publications/${publication.id}`)
      .expect(HttpStatus.OK);

    const publications = await prisma.publication.findMany();
    expect(publications).toHaveLength(0);
  });

});
