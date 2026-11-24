// Token holder shared between AuthProvider (writer) and the fetch layer (reader).
type TokenSource = () => Promise<string | undefined>

let source: TokenSource = async () => undefined

export const setTokenSource = (s: TokenSource) => {
  source = s
}
export const getToken = () => source()
