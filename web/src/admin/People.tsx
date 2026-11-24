import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { useAdminAccounts, useDeleteAccount, useSaveAccount } from '@/api/queries'
import type { Account, AccountInput, AccountKind } from '@/api/types'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from './DataTable'

const ROLES = ['Admin', 'Moderator', 'Write', 'Read'] as const
const NONE = '__none__' // Radix Select cannot hold an empty value

const optional = <T extends z.ZodType>(schema: T) => z.union([z.literal(''), schema])
const schema = z.object({
  username: z.string().trim().min(1).max(255),
  fullName: z.string().trim().min(1).max(255),
  email: optional(z.email()),
  phone: optional(z.string().regex(/^0\d{9}$/)),
  address: z.string().max(255),
  gender: z.enum(['', 'Male', 'Female']),
  role: z.enum(['', ...ROLES]),
  birthday: z.string(),
})
type Values = z.infer<typeof schema>

// Empty form fields are omitted from the request.
const toInput = (v: Values, kind: AccountKind): AccountInput => ({
  username: v.username,
  fullName: v.fullName,
  email: v.email || undefined,
  phone: v.phone || undefined,
  address: v.address || undefined,
  gender: v.gender || undefined,
  role: kind === 'employees' ? v.role || undefined : undefined,
  birthday: v.birthday || undefined,
})

function AccountForm({ kind, account, onClose }: { kind: AccountKind; account: Account | null; onClose: () => void }) {
  const { t } = useTranslation()
  const save = useSaveAccount(kind)
  const { register, control, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: account?.username ?? '', fullName: account?.fullName ?? '', email: account?.email ?? '', phone: account?.phone ?? '',
      address: account?.address ?? '', gender: account?.gender ?? '', role: account?.role ?? (kind === 'employees' ? 'Read' : ''), birthday: account?.birthday ?? '',
    },
  })
  const err = (msg: string | undefined) => msg && <p className="text-xs text-destructive">{msg}</p>
  const required = t('contact.required')

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{account ? t('admin.editAccount') : t('admin.createAccount')}</DialogTitle>
          <DialogDescription className="sr-only">{t(`admin.${kind}`)}</DialogDescription>
        </DialogHeader>
        <form id="account-form" className="grid gap-4 sm:grid-cols-2" noValidate
          onSubmit={handleSubmit((v) => save.mutate({ id: account?.id, input: toInput(v, kind) }, {
            onSuccess: () => { toast.success(t('common.saved')); onClose() },
            onError: (e) => toast.error(e.message),
          }))}>
          <div className="space-y-1.5">
            <Label htmlFor="username">{t('admin.username')}</Label>
            <Input id="username" {...register('username')} aria-invalid={!!errors.username} />
            {err(errors.username && required)}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fullName">{t('admin.fullName')}</Label>
            <Input id="fullName" {...register('fullName')} aria-invalid={!!errors.fullName} />
            {err(errors.fullName && required)}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">{t('admin.email')}</Label>
            <Input id="email" type="email" {...register('email')} aria-invalid={!!errors.email} />
            {err(errors.email && t('contact.emailInvalid'))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">{t('admin.phone')}</Label>
            <Input id="phone" inputMode="numeric" maxLength={10} {...register('phone')} aria-invalid={!!errors.phone} />
            {err(errors.phone && t('admin.phoneInvalid'))}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="address">{t('admin.address')}</Label>
            <Input id="address" {...register('address')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="birthday">{t('admin.birthday')}</Label>
            <Input id="birthday" type="date" {...register('birthday')} />
          </div>
          <div className="space-y-1.5">
            <Label>{t('admin.gender')}</Label>
            <Controller control={control} name="gender" render={({ field }) => (
              <Select value={field.value || NONE} onValueChange={(v) => field.onChange(v === NONE ? '' : v)}>
                <SelectTrigger className="w-full" aria-label={t('admin.gender')}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>{t('admin.unset')}</SelectItem>
                  <SelectItem value="Male">{t('admin.male')}</SelectItem>
                  <SelectItem value="Female">{t('admin.female')}</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </div>
          {kind === 'employees' && (
            <div className="space-y-1.5">
              <Label>{t('admin.role')}</Label>
              <Controller control={control} name="role" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full" aria-label={t('admin.role')}><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </div>
          )}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" form="account-form" disabled={save.isPending}>{t('common.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AccountsPage({ kind }: { kind: AccountKind }) {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const page = Number(params.get('page') ?? 0)
  const q = params.get('q') ?? ''
  const { data, isPending } = useAdminAccounts(kind, { page, size: 10, q })
  const del = useDeleteAccount(kind)
  const [editing, setEditing] = useState<Account | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Account | null>(null)

  const patch = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params)
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v)
      else p.delete(k)
    }
    setParams(p)
  }

  const columns: ColumnDef<Account>[] = [
    { accessorKey: 'fullName', header: t('admin.fullName') },
    { accessorKey: 'username', header: t('admin.username') },
    { accessorKey: 'email', header: t('admin.email') },
    { accessorKey: 'phone', header: t('admin.phone') },
    ...(kind === 'employees'
      ? [{ accessorKey: 'role', header: t('admin.role'), cell: ({ row }) => row.original.role && <Badge variant={row.original.role === 'Admin' ? 'default' : 'secondary'}>{row.original.role}</Badge> } satisfies ColumnDef<Account>]
      : [{ accessorKey: 'verified', header: t('admin.verified'), cell: ({ row }) => (row.original.verified ? '✓' : '') } satisfies ColumnDef<Account>]),
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
      {editing && <AccountForm kind={kind} account={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.confirmDelete', { name: deleting?.fullName })}</AlertDialogTitle>
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

export const CustomersPage = () => <AccountsPage kind="customers" />
export const EmployeesPage = () => <AccountsPage kind="employees" />
