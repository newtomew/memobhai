export interface Article {
  slug: string;
  tag: string;
  title: string;
  excerpt: string;
  readTime: string;
  image: string;
  published: string;
  author: string;
  sections: { heading?: string; paragraphs: string[] }[];
}

export const ARTICLES: Article[] = [
  {
    slug: 'why-digital-memos-beat-paper-2026',
    tag: 'Workflow',
    title: 'Why Digital Memos Beat Paper in 2026',
    excerpt: 'Paper memos get lost, lack audit trails, and slow approvals. Here is how organizations are going fully digital.',
    readTime: '5 min read',
    image: '/landing/article-workflow.jpg',
    published: 'August 15, 2026',
    author: 'MemoBhai Team',
    sections: [
      {
        paragraphs: [
          'Internal memos are the backbone of formal communication in universities, corporates, and government offices. Yet many organizations still rely on printed forms, wet signatures, and filing cabinets. In 2026, the cost of paper workflows is higher than ever: lost documents, delayed decisions, and zero searchable history.',
        ],
      },
      {
        heading: 'The hidden cost of paper',
        paragraphs: [
          'A single procurement memo might pass through five desks over two weeks. If any copy is misplaced, the process restarts. Digital memos eliminate physical handoffs. Every recipient sees the same version, and the author always knows where the memo sits in the approval chain.',
          'Compliance teams increasingly require proof of who approved what and when. Paper trails are fragile. Digital systems like MemoBhai log every action automatically, creating audit-ready records without extra effort.',
        ],
      },
      {
        heading: 'Speed without sacrificing formality',
        paragraphs: [
          'Going digital does not mean informal. Structured workflows preserve the sequential review process your organization expects: reviewer first, then approver, then signatory. Approvers can act from their inbox on any device.',
          'When changes are requested, the author edits and resubmits without starting from scratch. Version history captures every revision, so nothing is lost in translation.',
        ],
      },
      {
        heading: 'Getting started',
        paragraphs: [
          'Organizations typically begin with one department pilot: HR, Finance, or the Registrar office. MemoBhai Starter plan supports up to 10 users and 50 memos per month, enough to prove value before scaling to Professional.',
          'The shift from paper to digital is not just technology. It is a cultural move toward transparency, accountability, and faster decisions. MemoBhai is built to make that transition straightforward.',
        ],
      },
    ],
  },
  {
    slug: 'building-audit-ready-approval-chains',
    tag: 'Compliance',
    title: 'Building Audit-Ready Approval Chains',
    excerpt: 'Every approval logged, every version saved. Learn how MemoBhai keeps your internal communications compliant.',
    readTime: '4 min read',
    image: '/landing/article-compliance.jpg',
    published: 'August 10, 2026',
    author: 'MemoBhai Team',
    sections: [
      {
        paragraphs: [
          'Regulators and accreditation bodies expect organizations to demonstrate control over internal approvals. An audit-ready approval chain answers three questions: who acted, what they decided, and when it happened.',
        ],
      },
      {
        heading: 'Immutable approval records',
        paragraphs: [
          'MemoBhai stores each approve, reject, request-changes, and forward action in a dedicated approvals table linked to the workflow step and user. Comments attached to actions become part of the permanent record.',
          'PDF export bundles the memo body, full approval timeline, and comments into a single document suitable for archival or external review. Organization logos can be embedded for official presentation.',
        ],
      },
      {
        heading: 'Version history on every edit',
        paragraphs: [
          'Draft edits and resubmissions after changes requested create version snapshots. Auditors can compare what was originally submitted versus what was approved after revision.',
          'Audit logs at the organization level capture admin actions: user creation, template changes, join request approvals, and plan upgrades.',
        ],
      },
      {
        heading: 'Delegation without losing accountability',
        paragraphs: [
          'When an approver is traveling, they can delegate authority for a defined date range. The system records both the delegate who acted and the original approver who granted delegation, preserving the chain of responsibility.',
        ],
      },
    ],
  },
  {
    slug: 'multi-org-memo-management-at-scale',
    tag: 'Enterprise',
    title: 'Multi-Org Memo Management at Scale',
    excerpt: 'Platform admins oversee dozens of organizations while each tenant stays fully isolated and branded.',
    readTime: '6 min read',
    image: '/landing/article-enterprise.jpg',
    published: 'August 5, 2026',
    author: 'MemoBhai Team',
    sections: [
      {
        paragraphs: [
          'SaaS platforms serving multiple institutions need two things: strict tenant isolation and cross-org visibility for operators. MemoBhai delivers both through multi-tenant architecture with a dedicated platform admin panel.',
        ],
      },
      {
        heading: 'Tenant isolation',
        paragraphs: [
          'Each organization has its own users, departments, categories, workflow templates, and memos. Data queries always filter by organizationId. Users cannot access memos outside their tenant unless they hold platform admin privileges.',
          'Organizations can upload custom logos, set contact emails, and configure branding that appears in PDF exports and the app shell.',
        ],
      },
      {
        heading: 'Platform oversight',
        paragraphs: [
          'Platform admins access /platform to list all organizations, review join requests for new orgs and managers, ban abusive users or memos, and drill into any organization memos including version history across tenants.',
          'This is essential for MSPs, education groups, and holding companies managing multiple subsidiaries from one account.',
        ],
      },
      {
        heading: 'Subscription tiers at scale',
        paragraphs: [
          'Starter suits pilots. Professional removes memo and workflow limits for growing teams. Enterprise adds custom onboarding and dedicated support. Payments via aamarPay sandbox integrate today with manual admin confirmation before plan activation.',
        ],
      },
    ],
  },
  {
    slug: 'cut-approval-time-days-to-hours',
    tag: 'Productivity',
    title: 'Cut Approval Time from Days to Hours',
    excerpt: 'Sequential workflows, delegation, and mobile-ready inbox: how teams reduce memo turnaround by 70%.',
    readTime: '3 min read',
    image: '/landing/article-productivity.jpg',
    published: 'July 28, 2026',
    author: 'MemoBhai Team',
    sections: [
      {
        paragraphs: [
          'The biggest complaint about internal memos is not the writing. It is the waiting. Memos sit on desks, get buried in email, or lose momentum when approvers are unavailable. MemoBhai targets each bottleneck directly.',
        ],
      },
      {
        heading: 'Inbox-first design',
        paragraphs: [
          'Approvers see pending memos in a dedicated inbox sorted by priority and date. Urgent memos surface with visual badges. One-click approve, reject, or request changes from the memo detail page without navigating nested folders.',
          'In-app notifications alert users when a memo requires action. Message polling keeps badge counts fresh without requiring email overload.',
        ],
      },
      {
        heading: 'Workflow templates',
        paragraphs: [
          'Repeated memo types use saved workflow templates. Finance requisitions always route through the same four approvers. HR policies follow a fixed chain. Templates eliminate setup time on every new memo.',
        ],
      },
      {
        heading: 'Measurable improvement',
        paragraphs: [
          'Admin dashboards show average completion time in hours, memos by department, and status breakdown charts. Teams use these metrics to identify bottlenecks: which approver or department slows the chain most often.',
          'Organizations reporting before-and-after data typically see 50 to 70 percent reduction in end-to-end approval time within the first quarter of adoption.',
        ],
      },
    ],
  },
];

export function getArticle(slug: string) {
  return ARTICLES.find((a) => a.slug === slug);
}
