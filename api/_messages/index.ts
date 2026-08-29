import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withActiveUser } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { apiHandler } from '../_lib/handler';

export default apiHandler(
  withActiveUser(async (ctx, req, res) => {
    if (req.method === 'GET') {
    // Lightweight badge poll for navbar — single count query
    if (req.query.unread === '1' || req.query.badge === '1') {
      const unreadTotal = await prisma.directMessage.count({
        where: { recipientId: ctx.userId, organizationId: ctx.organizationId, isRead: false },
      });
      return res.json({ unreadTotal });
    }

    const peerId = req.query.peerId as string | undefined;

      if (peerId) {
        const peer = await prisma.user.findFirst({
          where: { id: peerId, organizationId: ctx.organizationId, status: 'active' },
          select: { id: true, name: true, email: true, avatarUrl: true, role: true },
        });
        if (!peer) return res.status(404).json({ error: 'Member not found' });

        const messages = await prisma.directMessage.findMany({
          where: {
            organizationId: ctx.organizationId,
            OR: [
              { senderId: ctx.userId, recipientId: peerId },
              { senderId: peerId, recipientId: ctx.userId },
            ],
          },
          orderBy: { createdAt: 'asc' },
          take: 200,
          include: {
            sender: { select: { id: true, name: true, avatarUrl: true } },
            recipient: { select: { id: true, name: true, avatarUrl: true } },
          },
        });

        await prisma.directMessage.updateMany({
          where: { recipientId: ctx.userId, senderId: peerId, isRead: false },
          data: { isRead: true },
        });

        return res.json({ peer, messages });
      }

      const members = await prisma.user.findMany({
        where: { organizationId: ctx.organizationId, status: 'active', id: { not: ctx.userId } },
        select: { id: true, name: true, email: true, avatarUrl: true, role: true, designation: true },
        orderBy: { name: 'asc' },
      });

      const recentMessages = await prisma.directMessage.findMany({
        where: {
          organizationId: ctx.organizationId,
          OR: [{ senderId: ctx.userId }, { recipientId: ctx.userId }],
        },
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { id: true, name: true, avatarUrl: true } },
          recipient: { select: { id: true, name: true, avatarUrl: true } },
        },
      });

      const conversationMap = new Map<
        string,
        {
          peerId: string;
          peer: { id: string; name: string; avatarUrl: string | null };
          lastMessage: string;
          lastAt: Date;
          unread: number;
        }
      >();

      for (const msg of recentMessages) {
        const peerIdKey = msg.senderId === ctx.userId ? msg.recipientId : msg.senderId;
        if (conversationMap.has(peerIdKey)) continue;

        const peer = msg.senderId === ctx.userId ? msg.recipient : msg.sender;
        const unread = recentMessages.filter(
          (m) => m.senderId === peerIdKey && m.recipientId === ctx.userId && !m.isRead,
        ).length;

        conversationMap.set(peerIdKey, {
          peerId: peerIdKey,
          peer: { id: peer.id, name: peer.name, avatarUrl: peer.avatarUrl },
          lastMessage: msg.body,
          lastAt: msg.createdAt,
          unread,
        });
      }

      const unreadTotal = await prisma.directMessage.count({
        where: { recipientId: ctx.userId, organizationId: ctx.organizationId, isRead: false },
      });

      return res.json({
        members,
        conversations: Array.from(conversationMap.values()),
        unreadTotal,
      });
    }

    if (req.method === 'POST') {
      const { recipientId, body } = req.body as { recipientId?: string; body?: string };
      if (!recipientId || !body?.trim()) {
        return res.status(400).json({ error: 'recipientId and body are required' });
      }

      const recipient = await prisma.user.findFirst({
        where: { id: recipientId, organizationId: ctx.organizationId, status: 'active' },
      });
      if (!recipient) return res.status(404).json({ error: 'Recipient not found' });

      const message = await prisma.directMessage.create({
        data: {
          organizationId: ctx.organizationId,
          senderId: ctx.userId,
          recipientId,
          body: body.trim(),
        },
        include: {
          sender: { select: { id: true, name: true, avatarUrl: true } },
          recipient: { select: { id: true, name: true, avatarUrl: true } },
        },
      });

      return res.status(201).json({ message });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }),
);
