import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ARTICLES } from '../../content/articles';

export default function ArticlesSection() {
  return (
    <section id="articles" className="py-20 sm:py-28 bg-landing-bg">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <p className="text-accent text-sm font-semibold uppercase tracking-widest mb-3">Articles</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Insights for modern workplaces</h2>
          </div>
          <Link to="/articles" className="text-sm text-accent hover:text-accent-light flex items-center gap-1 transition-colors">
            View all articles <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {ARTICLES.map((a) => (
            <Link
              key={a.slug}
              to={`/articles/${a.slug}`}
              className="group rounded-2xl border border-landing-border bg-landing-card overflow-hidden hover:border-accent/30 transition-colors"
            >
              <div className="aspect-[16/9] overflow-hidden">
                <img src={a.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-accent bg-accent/10 px-2.5 py-0.5 rounded-full">{a.tag}</span>
                  <span className="text-xs text-landing-muted">{a.readTime}</span>
                </div>
                <h3 className="text-white font-bold text-lg mb-2 group-hover:text-accent transition-colors">{a.title}</h3>
                <p className="text-sm text-landing-muted leading-relaxed mb-4">{a.excerpt}</p>
                <span className="text-sm text-accent flex items-center gap-1">
                  Read more <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
