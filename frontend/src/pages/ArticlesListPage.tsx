import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import LandingNav from '../components/landing/LandingNav';
import LandingFooter from '../components/landing/LandingFooter';
import { ARTICLES } from '../content/articles';

export default function ArticlesListPage() {
  return (
    <div className="min-h-screen bg-landing-bg text-white landing-page">
      <LandingNav />
      <main className="pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <h1 className="text-4xl font-bold text-white mb-3">Articles</h1>
          <p className="text-landing-muted mb-12 max-w-xl">Guides and insights on digital memos, compliance, and workplace productivity.</p>
          <div className="grid sm:grid-cols-2 gap-6">
            {ARTICLES.map((a) => (
              <Link key={a.slug} to={`/articles/${a.slug}`} className="group rounded-2xl border border-landing-border bg-landing-card overflow-hidden hover:border-accent/30 transition-colors">
                <div className="aspect-[16/9] overflow-hidden">
                  <img src={a.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
                <div className="p-6">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-accent bg-accent/10 px-2.5 py-0.5 rounded-full">{a.tag}</span>
                  <h2 className="text-white font-bold text-lg mt-3 mb-2 group-hover:text-accent transition-colors">{a.title}</h2>
                  <p className="text-sm text-landing-muted mb-4">{a.excerpt}</p>
                  <span className="text-sm text-accent flex items-center gap-1">Read article <ArrowRight size={14} /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
