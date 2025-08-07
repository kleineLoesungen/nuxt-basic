import { z } from 'zod'

export const dataSchemas = {
  app: z.array(z.any()),
  config: z.any(),
  user: z.object({
    id: z.number(),
    name: z.string(),
    password_hash: z.string()
  })
} as const

export type DataSchemaKey = keyof typeof dataSchemas

export type DataStoreTypes = {
  [K in DataSchemaKey]: z.infer<typeof dataSchemas[K]>
}
