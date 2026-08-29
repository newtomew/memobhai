import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import LandingNav from '../components/landing/LandingNav';
import LandingFooter from '../components/landing/LandingFooter';
import { getArticle } from '../content/articles';

export default function ArticlePage() {
  const { slug } = useParams();
  const article = slug ? getArticle(slug) : undefined;

  if (!article) return <Navigate to="/articles" replace />;

  return (
    <div className="min-h-screen bg-landing-bg text-white landing-page">
      <LandingNav />
      <main className="pt-24 pb-16">
        <article className="max-w-3xl mx-auto px-5 sm:px-8">
          <Link to="/articles" className="inline-flex items-center gap-2 text-sm text-landing-muted hover:text-white mb-8 transition-colors">
            <ArrowLeft size={16} /> All articles
          </Link>

          <div className="rounded-2xl overflow-hidden mb-8 aspect-[16/9]">
            <img src={article.image} alt="" className="w-full h-full object-cover" />
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-landing-muted">
            <span className="text-accent bg-accent/10 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider">{article.tag}</span>
            <span>{article.published}</span>
            <span>{article.readTime}</span>
            <span>By {article.author}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6 leading-tight">{article.title}</h1>
          <p className="text-lg text-landing-muted mb-10 leading-relaxed">{article.excerpt}</p>

          <div className="space-y-8">
            {article.sections.map((section, i) => (
              <section key={i}>
                {section.heading && <h2 className="text-xl font-bold text-white mb-3">{section.heading}</h2>}
                {section.paragraphs.map((p, j) => (
                  <p key={j} className="text-landing-muted leading-relaxed mb-4 last:mb-0">{p}</p>
                ))}
              </section>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-landing-border">
            <Link to="/register" className="inline-flex items-center gap-2 bg-accent text-charcoal font-semibold px-6 py-3 rounded-full hover:bg-accent-dark hover:text-white transition-all">
              Try MemoBhai free
            </Link>
          </div>
        </article>
      </main>
      <LandingFooter />
    </div>
  );
}
