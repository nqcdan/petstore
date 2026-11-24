import { ArrowRight } from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/context'
import { DemoAccounts } from '@/components/DemoAccounts'
import { FeaturedSection } from '@/components/FeaturedSection'
import { Button } from '@/components/ui/button'
import { posts } from '@/data/blog'
import { formatDate } from '@/lib/format'

// object-position keeps the dog's head (eyes, nose) inside the crop; [mobile, desktop]
const slideImages = [
  { src: '/img/hero/1.jpg', pos: ['68% 38%', '60% 24%'] },
  { src: '/img/hero/a.jpg', pos: ['100% 35%', '90% 25%'] },
]
const slideLinks = ['/shop/products', '/shop/foods']

export function Home() {
  const { t } = useTranslation()
  const slides = t('home.slides', { returnObjects: true }) as { tag: string; title: string; text: string; cta: string }[]
  const [i, setI] = useState(0)
  const slide = slides[i]
  const { user } = useAuth()

  return (
    <>
      <section className="relative isolate h-[640px] overflow-hidden bg-neutral-900 md:h-[500px] lg:h-[540px]">
        <div className="absolute inset-x-0 bottom-0 -z-10 h-[48%] [mask-image:linear-gradient(to_bottom,transparent,black_25%)] md:inset-y-0 md:left-auto md:right-0 md:h-full md:w-[62%] md:[mask-image:linear-gradient(to_right,transparent,black_40%)]">
          {slideImages.map((img, n) => (
            <img key={img.src} src={img.src} alt="" width={1600} height={n ? 1066 : 1299} fetchPriority={n === 0 ? 'high' : undefined}
              style={{ '--pos-m': img.pos[0], '--pos-d': img.pos[1] } as CSSProperties}
              className={`absolute inset-0 size-full object-cover [object-position:var(--pos-m)] transition-opacity duration-500 md:[object-position:var(--pos-d)] dark:brightness-90 ${n === i ? 'opacity-100' : 'opacity-0'}`} />
          ))}
        </div>
        <div className="mx-auto flex h-full max-w-6xl flex-col gap-5 px-4 py-10 text-white md:justify-center md:py-16">
          <span className="w-fit rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold tracking-widest">{slide.tag}</span>
          <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight md:max-w-xs lg:max-w-xl lg:text-5xl">{slide.title}</h1>
          <p className="max-w-md text-lg text-white/85 md:max-w-xs lg:max-w-md">{slide.text}</p>
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

      <FeaturedSection kind="products" title={t('home.featured')} sub={t('home.featuredSub')} count={8} />
      <FeaturedSection kind="foods" title={t('home.featuredFoods')} sub={t('home.featuredFoodsSub')} count={4} />

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
