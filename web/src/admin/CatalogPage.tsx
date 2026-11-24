import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { useAdminCatalog, useDeleteCatalog, useSaveCatalog } from '@/api/queries'
import { adminApi } from '@/api/shop'
import type { CatalogItem, CatalogKind } from '@/api/types'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatVnd, imgUrl } from '@/lib/format'
import { DataTable } from './DataTable'

const TYPES: Record<CatalogKind, string[]> = { products: ['CAT', 'DOG', 'CLOTHES'], foods: ['DRY', 'SNACK', 'MILK', 'WET'] }

const schema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  price: z.number().int().min(0),
  description: z.string(),
})
type Values = z.infer<typeof schema>

function ItemForm({ kind, item, onClose }: { kind: CatalogKind; item: CatalogItem | null; onClose: () => void }) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const save = useSaveCatalog(kind)
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : imgUrl(item?.imageUrl ?? null)), [file, item])
  const { register, control, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: item?.name ?? '', type: item?.type ?? TYPES[kind][0], price: item?.price ?? 0, description: item?.description ?? '' },
  })

  // The image endpoint needs an existing id, so upload happens after the item is saved.
  const submit = async (input: Values) => {
    try {
      const saved = await save.mutateAsync({ id: item?.id, input })
      if (file) {
        await adminApi.uploadImage(kind, saved.id, file)
        await qc.invalidateQueries({ queryKey: ['admin', kind] })
      }
      toast.success(t('common.saved'))
      onClose()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{item ? t('admin.editItem') : t('admin.createItem')}</DialogTitle>
          <DialogDescription className="sr-only">{t(`admin.${kind}`)}</DialogDescription>
        </DialogHeader>
        <form id="catalog-form" className="grid gap-4" noValidate onSubmit={handleSubmit(submit)}>
          <div className="space-y-1.5">
            <Label htmlFor="name">{t('admin.name')}</Label>
            <Input id="name" {...register('name')} aria-invalid={!!errors.name} />
            {errors.name && <p className="text-xs text-destructive">{t('contact.required')}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t('admin.type')}</Label>
              <Controller control={control} name="type" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full" aria-label={t('admin.type')}><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES[kind].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">{t('admin.price')} ({t('common.currency')})</Label>
              <Input id="price" type="number" min={0} step={1000} {...register('price', { valueAsNumber: true })} aria-invalid={!!errors.price} />
              {errors.price && <p className="text-xs text-destructive">{t('admin.priceInvalid')}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t('admin.image')}</Label>
            <div className="flex items-center gap-3">
              <img src={preview} alt="" className="size-16 rounded-md border object-cover" />
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden data-testid="image-input" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload /> {t('admin.uploadImage')}</Button>
              <span className="truncate text-xs text-muted-foreground">{file?.name ?? (item ? '' : t('admin.imageAfterSave'))}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">{t('admin.description')}</Label>
            <Textarea id="description" rows={4} {...register('description')} />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" form="catalog-form" disabled={save.isPending}>{t('common.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function CatalogPage({ kind }: { kind: CatalogKind }) {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const page = Number(params.get('page') ?? 0)
  const q = params.get('q') ?? ''
  const { data, isPending } = useAdminCatalog(kind, { page, size: 10, q })
  const del = useDeleteCatalog(kind)
  const [editing, setEditing] = useState<CatalogItem | 'new' | null>(null)
  const [deleting, setDeleting] = useState<CatalogItem | null>(null)

  const patch = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params)
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v)
      else p.delete(k)
    }
    setParams(p)
  }

  const columns: ColumnDef<CatalogItem>[] = [
    { id: 'pic', header: t('admin.image'), cell: ({ row }) => <img src={imgUrl(row.original.imageUrl)} alt="" className="size-10 rounded-md object-cover" /> },
    { accessorKey: 'name', header: t('admin.name'), cell: ({ row }) => <span className="line-clamp-2 max-w-md">{row.original.name}</span> },
    { accessorKey: 'type', header: t('admin.type') },
    { accessorKey: 'price', header: t('admin.price'), cell: ({ row }) => <span className="tabular-nums">{formatVnd(row.original.price)}</span> },
    {
      id: 'actions', header: () => <span className="sr-only">{t('common.actions')}</span>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon-sm" aria-label={t('common.edit')} onClick={() => setEditing(row.original)}><Pencil /></Button>
          <Button variant="ghost" size="icon-sm" aria-label={t('common.delete')} onClick={() => setDeleting(row.original)}><Trash2 /></Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{t(`admin.${kind}`)}</h1>
      <DataTable columns={columns} data={data} loading={isPending} page={page}
        onPageChange={(p) => patch({ page: p ? String(p) : null })}
        search={q} onSearch={(v) => patch({ q: v || null, page: null })}
        toolbar={<Button onClick={() => setEditing('new')}><Plus /> {t('common.create')}</Button>} />
      {editing && <ItemForm kind={kind} item={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.confirmDelete', { name: deleting?.name })}</AlertDialogTitle>
            <AlertDialogDescription>{t('admin.confirmDeleteText')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => deleting && del.mutate(deleting.id, {
              onSuccess: () => toast.success(t('admin.deleted')),
              onError: (e) => toast.error(e.message),
            })}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
