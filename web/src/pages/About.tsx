import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/PageHeader'

const team = [
  { name: 'Nguyễn Tấn Trọng', img: 'team-1.jpg', leader: false },
  { name: 'Lưu Nguyễn Thanh Phương', img: 'team-2.jpg', leader: false },
  { name: 'Nguyễn Thị Thanh Phương', img: 'team-3.jpg', leader: true },
  { name: 'Nguyễn Văn Nhật', img: 'team-4.jpg', leader: false },
  { name: 'Lê Ngọc Đàn', img: 'team-5.jpg', leader: false },
]

export function About() {
  const { t } = useTranslation()
  const stats = [['1000', 'customers'], ['10', 'items'], ['8', 'partners'], ['98%', 'satisfaction']] as const
  return (
    <>
      <PageHeader title={t('about.title')} />
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <img src="/img/about/about-us.jpg" alt="" className="w-full rounded-xl object-cover" />
          <p className="text-lg leading-8 text-muted-foreground">{t('about.body')}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map(([n, k]) => (
            <div key={k} className="rounded-xl border bg-card p-6 text-center">
              <p className="text-3xl font-bold text-primary">{n}</p>
              <p className="text-sm text-muted-foreground">{t(`about.stats.${k}`)}</p>
            </div>
          ))}
        </div>
        <div>
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">{t('about.team')}</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {team.map((m) => (
              <div key={m.name} className="text-center">
                <img src={`/img/about/${m.img}`} alt={m.name} loading="lazy" className="aspect-square w-full rounded-xl object-cover" />
                <p className="mt-2 text-sm font-medium">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.leader ? t('about.leader') : t('about.member')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
