import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { posts } from '@/data/blog'
import { formatDate } from '@/lib/format'
import { NotFound } from './NotFound'

export function Blog() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t('blog.title')} />
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 md:grid-cols-3">
        {posts.map((p) => (
          <Link key={p.slug} to={`/blog/${p.slug}`} className="group overflow-hidden rounded-xl border bg-card">
            <img src={p.image} alt={p.title} loading="lazy" className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="space-y-1 p-4">
              <p className="text-xs text-muted-foreground">{formatDate(p.date)}</p>
              <h2 className="font-semibold">{p.title}</h2>
              <span className="text-sm text-primary">{t('home.readMore')} →</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}

export function BlogDetail() {
  const { t } = useTranslation()
  const { slug } = useParams()
  const post = posts.find((p) => p.slug === slug)
  if (!post) return <NotFound />
  return (
    <>
      <PageHeader title={post.title} sub={`${formatDate(post.date)} · ${post.author}`} />
      <article className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <img src={post.image} alt={post.title} className="w-full rounded-xl object-cover" />
        {post.paragraphs.map((para) => <p key={para.slice(0, 20)} className="leading-7 text-muted-foreground">{para}</p>)}
        <div className="flex flex-wrap gap-2">{post.tags.map((tag) => <Badge key={tag} variant="secondary">#{tag}</Badge>)}</div>
        <Link to="/blog" className="inline-block text-sm text-primary">← {t('common.back')}</Link>
      </article>
    </>
  )
}
