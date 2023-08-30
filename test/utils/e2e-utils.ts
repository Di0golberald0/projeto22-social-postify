import { PrismaService } from "../../src/prisma/prisma.service";

export class E2EUtils {
  static async cleanDb(prisma: PrismaService) {
    await prisma.publication.deleteMany();
    await prisma.media.deleteMany();
    await prisma.post.deleteMany();
  }

  static generateDate(daysAfterOrBefore: number) {
    const today = new Date();
    return new Date(today.setDate(today.getDate() + daysAfterOrBefore));
  }

  static formatDateToYearMonthDay(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

}