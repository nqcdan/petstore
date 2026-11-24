import Keycloak from 'keycloak-js'

export const MOCK: boolean = import.meta.env.VITE_MOCK === 'true'

export const ADMIN_ROLE = 'admin'

export const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL ?? 'http://localhost:8180',
  realm: import.meta.env.VITE_KEYCLOAK_REALM ?? 'petstore',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'petstore-web',
})
