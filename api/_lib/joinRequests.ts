import { prisma } from './prisma';
import { isPlatformAdminEmail } from './platformAdmin';

export async function approveJoinRequest(
  requestId: string,
  reviewerId: string,
  reviewerEmail: string,
  reviewerRole: string,
) {
  const req = await prisma.joinRequest.findUnique({
    where: { id: requestId },
    include: { organization: true },
  });

  if (!req || req.status !== 'pending') {
    throw new Error('Join request not found or already processed');
  }

  const isPlatform = isPlatformAdminEmail(reviewerEmail);

  if (req.requestType === 'new_org' || req.requestedRole === 'admin') {
    if (!isPlatform) throw new Error('Platform administrator approval required for manager requests');
  } else if (req.requestedRole === 'user') {
    if (!isPlatform && reviewerRole !== 'admin') {
      throw new Error('Organization manager approval required for employee requests');
    }
    if (!isPlatform && req.organizationId) {
      const reviewer = await prisma.user.findUnique({ where: { id: reviewerId } });
      if (!reviewer || reviewer.organizationId !== req.organizationId) {
        throw new Error('You can only approve employees for your organization');
      }
    }
  }

  if (req.requestType === 'new_org' && req.organizationId) {
    await prisma.organization.update({
      where: { id: req.organizationId },
      data: { status: 'active' },
    });
  }

  const user = await prisma.user.findFirst({
    where: {
      email: req.email,
      ...(req.organizationId ? { organizationId: req.organizationId } : {}),
    },
  });

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'active',
        role: req.requestedRole === 'founder' ? 'admin' : req.requestedRole,
      },
    });
  }

  await prisma.joinRequest.update({
    where: { id: requestId },
    data: {
      status: 'approved',
      reviewedById: reviewerId,
      reviewedAt: new Date(),
    },
  });

  if (req.organizationId) {
    await prisma.auditLog.create({
      data: {
        organizationId: req.organizationId,
        userId: reviewerId,
        event: 'join_request_approved',
        entityType: 'join_request',
        entityId: requestId,
        description: `${req.name} (${req.email}) approved as ${req.requestedRole}`,
      },
    });
  }

  return { success: true };
}

export async function rejectJoinRequest(
  requestId: string,
  reviewerId: string,
  reviewerEmail: string,
  reviewerRole: string,
  reason?: string,
) {
  const req = await prisma.joinRequest.findUnique({ where: { id: requestId } });
  if (!req || req.status !== 'pending') {
    throw new Error('Join request not found or already processed');
  }

  const isPlatform = isPlatformAdminEmail(reviewerEmail);
  const canReject =
    isPlatform ||
    (req.requestedRole === 'user' && reviewerRole === 'admin' && req.organizationId);

  if (!canReject) throw new Error('Not authorized to reject this request');

  const user = await prisma.user.findFirst({
    where: {
      email: req.email,
      ...(req.organizationId ? { organizationId: req.organizationId } : {}),
    },
  });

  if (user) {
    await prisma.user.update({ where: { id: user.id }, data: { status: 'banned' } });
  }

  await prisma.joinRequest.update({
    where: { id: requestId },
    data: {
      status: 'rejected',
      reviewedById: reviewerId,
      reviewedAt: new Date(),
      rejectionReason: reason || null,
    },
  });

  return { success: true };
}
