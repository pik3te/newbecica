import { useFetch as _useFetch } from '#app'

/**
 * Wrapper de `useFetch` con la base configurable vía runtime config.
 * Permite apuntar a un backend real solo cambiando `NUXT_PUBLIC_API_BASE`.
 *
 * Se tipa igual que `useFetch` para conservar la inferencia y evitar
 * los problemas de sobrecarga.
 */
export const useApiFetch: typeof _useFetch = (request, options) => {
  const config = useRuntimeConfig()

  const mergedOptions = Object.assign(
    {},
    options ?? {},
    { baseURL: options?.baseURL ?? config.public.apiBase }
  )

  return _useFetch(request, mergedOptions)
}
