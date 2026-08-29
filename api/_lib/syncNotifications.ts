import { prisma } from './prisma';

const PENDING_STATUSES = ['submitted', 'pending_review', 'pending_approval', 'changes_requested'] as const;

interface EnsureNotificationInput {
  userId: string;
  type: string;
  message: string;
  memoNumber?: string;
  memoId?: string;
}

/** Create notification only if an identical unread one does not already exist. Returns true if created. */
async function ensureNotification(input: EnsureNotificationInput): Promise<boolean> {
  const existing = await prisma.notification.findFirst({
    where: {
      userId: input.userId,
      type: input.type,
      memoNumber: input.memoNumber ?? null,
      isRead: false,
    },
  });
  if (existing) return false;

  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      message: input.message,
      memoNumber: input.memoNumber ?? null,
      memoId: input.memoId ?? null,
    },
  });
  return true;
}

function daysSince(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Generates role-aware notifications since the user's previous login.
 * Also checks overdue memos on every sync.
 */
export async function syncUserNotifications(
  userId: string,
  role: string,
  organizationId: string,
  since: Date,
): Promise<number> {
  const isAdmin = role === 'admin';
  let created = 0;

  const track = async (input: EnsureNotificationInput) => {
    if (await ensureNotification(input)) created++;
  };

  if (isAdmin) {
    // New memos submitted to the org since last login
    const newMemos = await prisma.memo.findMany({
      where: {
        organizationId,
        status: { not: 'draft' },
        submittedAt: { gt: since },
      },
      select: { id: true, memoNumber: true, subject: true, author: { select: { name: true } } },
      orderBy: { submittedAt: 'desc' },
      take: 20,
    });

    for (const memo of newMemos) {
      await track({
        userId,
        type: 'since_login_new_memo',
        memoId: memo.id,
        memoNumber: memo.memoNumber,
        message: `New memo submitted: ${memo.memoNumber} — "${memo.subject}" by ${memo.author?.name || 'Unknown'}`,
      });
    }

    // Org memos waiting for approval > 2 days (manager alert)
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const overdueAdmin = await prisma.memo.findMany({
      where: {
        organizationId,
        status: { in: [...PENDING_STATUSES] },
        submittedAt: { lt: twoDaysAgo },
      },
      select: { id: true, memoNumber: true, subject: true, submittedAt: true },
      take: 30,
    });

    for (const memo of overdueAdmin) {
      const days = memo.submittedAt ? daysSince(memo.submittedAt) : 2;
      await track({
        userId,
        type: 'overdue_approval',
        memoId: memo.id,
        memoNumber: memo.memoNumber,
        message: `⚠️ Memo ${memo.memoNumber} awaiting approval for ${days} days — "${memo.subject}"`,
      });
    }
  } else {
    // Employee: own memos approved since last login
    const approved = await prisma.memo.findMany({
      where: {
        authorId: userId,
        organizationId,
        status: 'approved',
        completedAt: { gt: since },
      },
      select: { id: true, memoNumber: true, subject: true },
      take: 20,
    });

    for (const memo of approved) {
      await track({
        userId,
        type: 'since_login_approved',
        memoId: memo.id,
        memoNumber: memo.memoNumber,
        message: `✅ Your memo ${memo.memoNumber} was approved — "${memo.subject}"`,
      });
    }

    // Employee: own memos rejected since last login
    const rejected = await prisma.memo.findMany({
      where: {
        authorId: userId,
        organizationId,
        status: 'rejected',
        completedAt: { gt: since },
      },
      select: { id: true, memoNumber: true, subject: true },
      take: 20,
    });

    for (const memo of rejected) {
      await track({
        userId,
        type: 'since_login_rejected',
        memoId: memo.id,
        memoNumber: memo.memoNumber,
        message: `❌ Your memo ${memo.memoNumber} was rejected — "${memo.subject}"`,
      });
    }

    // Employee: own memos pending approval > 5 days
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const overdueUser = await prisma.memo.findMany({
      where: {
        authorId: userId,
        organizationId,
        status: { in: [...PENDING_STATUSES] },
        submittedAt: { lt: fiveDaysAgo },
      },
      select: { id: true, memoNumber: true, subject: true, submittedAt: true },
      take: 20,
    });

    for (const memo of overdueUser) {
      const days = memo.submittedAt ? daysSince(memo.submittedAt) : 5;
      await track({
        userId,
        type: 'overdue_approval',
        memoId: memo.id,
        memoNumber: memo.memoNumber,
        message: `⏳ Your memo ${memo.memoNumber} has been awaiting approval for ${days} days — "${memo.subject}"`,
      });
    }
  }

  // All users: new inbox assignments since last login
  const newAssignments = await prisma.memo.findMany({
    where: {
      organizationId,
      workflowSteps: {
        some: {
          userId,
          status: 'pending',
          createdAt: { gt: since },
        },
      },
    },
    select: { id: true, memoNumber: true, subject: true },
    take: 20,
  });

  for (const memo of newAssignments) {
    await track({
      userId,
      type: 'memo_assigned',
      memoId: memo.id,
      memoNumber: memo.memoNumber,
      message: `📥 Memo ${memo.memoNumber} requires your review — "${memo.subject}"`,
    });
  }

  return created;
}

export async function recordLogin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastLoginAt: true, createdAt: true, role: true, organizationId: true },
  });
  if (!user) return { previousLoginAt: null as Date | null, synced: 0 };

  const previousLoginAt = user.lastLoginAt ?? user.createdAt;
  const synced = await syncUserNotifications(
    userId,
    user.role,
    user.organizationId,
    previousLoginAt,
  );

  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });

  return { previousLoginAt, synced };
}
