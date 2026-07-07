import { Conversation, Prisma } from '@prisma/client';
import { IConversationRepository } from '../../domain/repositories/conversation.repository.interface.js';
import { prisma } from '../prisma/prisma.js';
import { logger } from '../../utils/logger.js';

export class ConversationRepository implements IConversationRepository {
  async findById(id: string): Promise<Conversation | null> {
    return prisma.conversation.findUnique({ where: { id } });
  }

  async findByUserId(userId: string): Promise<Conversation | null> {
    return prisma.conversation.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findAll(): Promise<Conversation[]> {
    return prisma.conversation.findMany();
  }

  async create(data: Partial<Conversation>): Promise<Conversation> {
    // Explicit type cast for Prisma Json fields or let Prisma handle it
    return prisma.conversation.create({ data: data as Prisma.ConversationUncheckedCreateInput });
  }

  async update(id: string, data: Partial<Conversation>): Promise<Conversation> {
    logger.info("[TRACE] ConversationRepository.update");
    logger.info(
      "[ConversationRepository] update() payload\n" +
      JSON.stringify(data, null, 2)
    );
    const updated = await prisma.conversation.update({
      where: { id },
      data: data as Prisma.ConversationUncheckedUpdateInput,
    });
    logger.info(
      "[ConversationRepository] database returned\n" +
      JSON.stringify(updated.metadata, null, 2)
    );
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    await prisma.conversation.delete({ where: { id } });
    return true;
  }
}
