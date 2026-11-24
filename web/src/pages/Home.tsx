import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/context'
import { DemoAccounts } from '@/components/DemoAccounts'
import { useCatalog } from '@/api/queries'
import { ProductCard } from '@/components/ProductCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { posts } from '@/data/blog'
import { formatDate } from '@/lib/format'

const slideImages = ['/img/hero/1.jpg', '/img/hero/a.jpg']
const slideLinks = ['/shop/products', '/shop/foods']

export function Home() {
  const { t } = useTranslation()
  const slides = t('home.slides', { returnObjects: true }) as { tag: string; title: string; text: string; cta: string }[]
  const [i, setI] = useState(0)
  const slide = slides[i]
  const { user } = useAuth()
  const featured = useCatalog('products', { size: 4, page: 0, sort: 'price,desc' })

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <img src={slideImages[i]} alt="" className="absolute inset-0 -z-10 size-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
        <div className="mx-auto flex min-h-[460px] max-w-6xl flex-col justify-center gap-5 px-4 py-16 text-white">
          <span className="w-fit rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold tracking-widest">{slide.tag}</span>
          <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight md:text-5xl">{slide.title}</h1>
          <p className="max-w-md text-lg text-white/85">{slide.text}</p>
          <div className="flex items-center gap-6">
            <Button asChild size="lg" className="h-10 px-5 text-base"><Link to={slideLinks[i]}>{slide.cta} <ArrowRight /></Link></Button>
            <div className="flex gap-2" role="tablist">
              {slides.map((s, n) => (
                <button key={s.tag} role="tab" aria-selected={n === i} aria-label={s.tag} onClick={() => setI(n)}
                  className={`h-2 rounded-full transition-all ${n === i ? 'w-8 bg-primary' : 'w-2 bg-white/60'}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {!user && <div className="mx-auto max-w-6xl px-4 pt-8"><DemoAccounts className="w-fit" /></div>}

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-12 md:grid-cols-3">
        {[
          { img: '/img/banner/b.jpg', title: t('home.banners.products'), cta: t('home.banners.shop'), to: '/shop/products' },
          { img: '/img/banner/e.jpg', title: t('home.banners.foods'), cta: t('home.banners.shop'), to: '/shop/foods' },
          { img: '/img/banner/c.jpg', title: t('home.banners.spa'), cta: t('home.banners.spaCta'), to: '/contact' },
        ].map((b) => (
          <Link key={b.title} to={b.to} className="group relative isolate flex aspect-[4/3] items-end overflow-hidden rounded-xl">
            <img src={b.img} alt="" className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="p-5 text-white">
              <h2 className="text-xl font-semibold">{b.title}</h2>
              <span className="text-sm underline-offset-4 group-hover:underline">{b.cta} →</span>
            </div>
          </Link>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{t('home.featured')}</h2>
            <p className="text-muted-foreground">{t('home.featuredSub')}</p>
          </div>
          <Button asChild variant="ghost"><Link to="/shop/products">{t('home.banners.shop')} <ArrowRight /></Link></Button>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {featured.isPending
            ? Array.from({ length: 4 }, (_, n) => <Skeleton key={n} className="aspect-[3/4]" />)
            : featured.data?.content.map((p) => <ProductCard key={p.id} kind="products" item={p} />)}
        </div>
      </section>

      <section className="bg-muted/40 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">{t('home.blog')}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {posts.map((p) => (
              <Link key={p.slug} to={`/blog/${p.slug}`} className="group overflow-hidden rounded-xl border bg-card">
                <img src={p.image} alt={p.title} loading="lazy" className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="space-y-1 p-4">
                  <p className="text-xs text-muted-foreground">{formatDate(p.date)}</p>
                  <h3 className="font-semibold">{p.title}</h3>
                  <span className="text-sm text-primary">{t('home.readMore')} →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-4 text-center text-lg font-medium text-muted-foreground">{t('home.gallery')}</h2>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
          {['a', 'b', 'c', 'd', 'e', 'f'].map((n) => (
            <img key={n} src={`/img/instagram/${n}.jpg`} alt="" loading="lazy" className="aspect-square rounded-lg object-cover" />
          ))}
        </div>
      </section>
    </>
  )
}
