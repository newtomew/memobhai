import jsPDF from 'jspdf';

export interface MemoPdfData {
  memoNumber: string;
  subject: string;
  body: string;
  priority: string;
  status: string;
  createdAt?: string;
  submittedAt?: string;
  author?: { name?: string; email?: string; designation?: string };
  department?: { name?: string };
  category?: { name?: string };
  organization?: { name?: string; contactEmail?: string; logo?: string };
  workflowSteps?: Array<{
    status: string;
    user?: { name?: string; designation?: string };
  }>;
  approvals?: Array<{
    action?: string;
    comment?: string;
    createdAt?: string;
    user?: { name?: string; designation?: string };
  }>;
  comments?: Array<{
    text: string;
    createdAt?: string;
    author?: { name?: string };
  }>;
  attachments?: Array<{ fileName: string; fileSize?: number }>;
}

const PAGE = { w: 210, h: 297 };
const MARGIN = { top: 20, right: 20, bottom: 25, left: 25 };
const CONTENT_W = PAGE.w - MARGIN.left - MARGIN.right;

const COLORS = {
  charcoal: [28, 28, 30] as [number, number, number],
  accent: [137, 185, 246] as [number, number, number],
  gray: [107, 114, 128] as [number, number, number],
  lightGray: [243, 244, 246] as [number, number, number],
  border: [209, 213, 219] as [number, number, number],
};

function loadImageAsDataUrl(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

export async function exportMemoPdf(memo: MemoPdfData, orgName?: string) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = MARGIN.top;
  let pageNum = 1;

  const organizationName = memo.organization?.name || orgName || 'Organization';
  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
  const fmtDateTime = (d?: string) =>
    d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  const statusLabel = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const addFooter = () => {
    doc.setDrawColor(...COLORS.border);
    doc.line(MARGIN.left, PAGE.h - 18, PAGE.w - MARGIN.right, PAGE.h - 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray);
    doc.text(`${organizationName} — Official Inter-Office Memorandum · MemoBhai`, MARGIN.left, PAGE.h - 12);
    doc.text(`Page ${pageNum}`, PAGE.w - MARGIN.right, PAGE.h - 12, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  };

  const checkPageBreak = (needed: number) => {
    if (y + needed > PAGE.h - MARGIN.bottom) {
      addFooter();
      doc.addPage();
      pageNum += 1;
      y = MARGIN.top;
    }
  };

  // ── Letterhead ──
  doc.setFillColor(...COLORS.charcoal);
  doc.rect(0, 0, PAGE.w, 38, 'F');
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 38, PAGE.w, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);

  const logoUrl = memo.organization?.logo;
  let logoLoaded = false;
  if (logoUrl) {
    const dataUrl = await loadImageAsDataUrl(logoUrl);
    if (dataUrl) {
      try {
        doc.addImage(dataUrl, 'PNG', PAGE.w - MARGIN.right - 24, 8, 22, 22);
        logoLoaded = true;
      } catch {
        /* fall through to text-only letterhead */
      }
    }
  }

  const titleX = logoLoaded ? MARGIN.left : MARGIN.left;
  doc.text(organizationName.toUpperCase(), titleX, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Powered by MemoBhai', MARGIN.left, 22);
  doc.setFontSize(9);
  doc.text('INTER-OFFICE MEMORANDUM', MARGIN.left, 28);
  if (memo.organization?.contactEmail) {
    doc.text(memo.organization.contactEmail, MARGIN.left, 34);
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(memo.memoNumber, PAGE.w - MARGIN.right, 20, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Date: ${fmtDate(memo.createdAt)}`, PAGE.w - MARGIN.right, 28, { align: 'right' });

  doc.setTextColor(0, 0, 0);
  y = 50;

  // ── Metadata box ──
  const metaRows: [string, string][] = [
    ['TO', 'Workflow Recipients (see Approval Chain below)'],
    ['FROM', `${memo.author?.name || '—'}${memo.author?.designation ? `, ${memo.author.designation}` : ''}`],
    ['DEPARTMENT', memo.department?.name || '—'],
    ['SUBJECT', memo.subject],
    ['CATEGORY', memo.category?.name || 'General'],
    ['PRIORITY', statusLabel(memo.priority || 'normal')],
    ['STATUS', statusLabel(memo.status || 'draft')],
  ];
  if (memo.submittedAt) metaRows.push(['SUBMITTED', fmtDateTime(memo.submittedAt)]);

  const boxH = 8 + metaRows.length * 9;
  checkPageBreak(boxH + 10);
  doc.setDrawColor(...COLORS.border);
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(MARGIN.left, y, CONTENT_W, boxH, 2, 2, 'FD');

  let metaY = y + 7;
  metaRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray);
    doc.text(label, MARGIN.left + 4, metaY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(value, CONTENT_W - 38);
    doc.text(lines, MARGIN.left + 34, metaY);
    metaY += Math.max(9, lines.length * 5);
  });
  y += boxH + 12;

  // ── Body ──
  checkPageBreak(20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.charcoal);
  doc.text('MEMORANDUM', MARGIN.left, y);
  y += 8;

  doc.setDrawColor(...COLORS.border);
  doc.line(MARGIN.left, y, PAGE.w - MARGIN.right, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  const plainBody = memo.body?.includes('<') ? stripHtml(memo.body) : (memo.body || '(No content)');
  const bodyLines = doc.splitTextToSize(plainBody, CONTENT_W);
  bodyLines.forEach((line: string) => {
    checkPageBreak(6);
    doc.text(line, MARGIN.left, y);
    y += 6;
  });
  y += 10;

  // ── Attachments ──
  if (memo.attachments?.length) {
    checkPageBreak(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('ATTACHMENTS', MARGIN.left, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    memo.attachments.forEach((a, i) => {
      checkPageBreak(6);
      const size = a.fileSize ? ` (${(a.fileSize / 1024).toFixed(1)} KB)` : '';
      doc.text(`${i + 1}. ${a.fileName}${size}`, MARGIN.left + 4, y);
      y += 5;
    });
    y += 6;
  }

  // ── Approval chain table ──
  if (memo.workflowSteps?.length) {
    checkPageBreak(24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('APPROVAL CHAIN', MARGIN.left, y);
    y += 8;

    const cols = [12, 55, 45, 38];
    const headers = ['#', 'Name / Designation', 'Status', 'Signature'];
    doc.setFillColor(...COLORS.charcoal);
    doc.rect(MARGIN.left, y - 4, CONTENT_W, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    let cx = MARGIN.left + 2;
    headers.forEach((h, i) => {
      doc.text(h, cx, y);
      cx += cols[i];
    });
    y += 8;
    doc.setTextColor(0, 0, 0);

    memo.workflowSteps.forEach((step, i) => {
      checkPageBreak(10);
      if (i % 2 === 0) {
        doc.setFillColor(...COLORS.lightGray);
        doc.rect(MARGIN.left, y - 4, CONTENT_W, 9, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      cx = MARGIN.left + 2;
      doc.text(String(i + 1), cx, y);
      cx += cols[0];
      const nameLine = step.user?.name || '—';
      const desig = step.user?.designation ? `\n${step.user.designation}` : '';
      doc.text(nameLine + desig, cx, y);
      cx += cols[1];
      doc.text(statusLabel(step.status), cx, y);
      cx += cols[2];
      doc.setTextColor(...COLORS.gray);
      doc.text('_______________', cx, y);
      doc.setTextColor(0, 0, 0);
      y += 10;
    });
    y += 6;
  }

  // ── Approval history ──
  if (memo.approvals?.length) {
    checkPageBreak(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('APPROVAL HISTORY', MARGIN.left, y);
    y += 8;
    memo.approvals.forEach((a) => {
      checkPageBreak(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(
        `${a.user?.name || '—'} — ${statusLabel(a.action || '')} — ${fmtDateTime(a.createdAt)}`,
        MARGIN.left + 2,
        y,
      );
      y += 5;
      if (a.comment) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.gray);
        const commentLines = doc.splitTextToSize(`"${a.comment}"`, CONTENT_W - 8);
        doc.text(commentLines, MARGIN.left + 6, y);
        y += commentLines.length * 4.5 + 2;
        doc.setTextColor(0, 0, 0);
      }
      y += 3;
    });
    y += 4;
  }

  // ── Comments ──
  if (memo.comments?.length) {
    checkPageBreak(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('COMMENTS & NOTES', MARGIN.left, y);
    y += 8;
    memo.comments.forEach((c) => {
      checkPageBreak(14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`${c.author?.name || '—'} (${fmtDateTime(c.createdAt)})`, MARGIN.left + 2, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(c.text, CONTENT_W - 8);
      doc.text(lines, MARGIN.left + 6, y);
      y += lines.length * 4.5 + 6;
    });
  }

  // ── Certification footer ──
  checkPageBreak(30);
  y += 8;
  doc.setDrawColor(...COLORS.border);
  doc.line(MARGIN.left, y, PAGE.w - MARGIN.right, y);
  y += 8;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gray);
  doc.text(
    'This document is an official inter-office memorandum generated by MemoBhai. ' +
      'Unauthorized alteration of this document is prohibited.',
    MARGIN.left,
    y,
    { maxWidth: CONTENT_W },
  );

  addFooter();
  doc.save(`${memo.memoNumber.replace(/\s+/g, '_')}_Official_Memo.pdf`);
}
