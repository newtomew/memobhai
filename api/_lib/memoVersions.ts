import { prisma } from './prisma';

export async function snapshotMemoVersion(memoId: string, subject: string, body: string) {
  const latest = await prisma.memoVersion.findFirst({
    where: { memoId },
    orderBy: { versionNumber: 'desc' },
    select: { versionNumber: true },
  });

  const versionNumber = (latest?.versionNumber ?? 0) + 1;

  return prisma.memoVersion.create({
    data: { memoId, versionNumber, subject, body },
  });
}
