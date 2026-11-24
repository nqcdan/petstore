// Compile-time guard: if the backend OpenAPI changes (pnpm gen:api) and types.ts no longer fits, tsc fails here.
import type { components } from './schema'
import type * as T from './types'

type S = components['schemas']
type DeepRequired<X> = X extends (infer U)[] ? DeepRequired<U>[] : X extends object ? { [K in keyof X]-?: DeepRequired<NonNullable<X[K]>> } : X
type Ok<Actual extends Wanted, Wanted> = Actual // fails to compile when Actual is not assignable to Wanted

// responses: what the server sends must fit what the UI expects
export type ResponseChecks = [
  Ok<DeepRequired<S['CatalogItem']>, T.CatalogItem>,
  Ok<DeepRequired<S['OrderSummary']>, T.OrderSummary>,
  Ok<DeepRequired<S['OrderDetail']>, T.OrderDetail>,
  Ok<DeepRequired<S['AccountDto']>, T.Account>,
  Ok<DeepRequired<S['Me']>, T.Me>,
  Ok<DeepRequired<S['Stats']>, T.AdminStats>,
  Ok<DeepRequired<S['PageDtoCatalogItem']>, T.Page<T.CatalogItem>>,
]

// requests: what the UI sends must fit what the server accepts
export type RequestChecks = [
  Ok<T.CatalogInput, S['CatalogItemRequest']>,
  Ok<T.OrderRequest, S['OrderRequest']>,
  Ok<{ state: T.OrderState }, S['StateRequest']>,
]
