// server/utils/data-schema.ts
import { z, ZodType } from 'zod'

/** Reusable primitives */
const IsoDate = z.string().datetime()
const Hex = (len?: number) =>
  z.string().regex(new RegExp(`^[0-9a-f]{${len ?? 64}}$`), 'hex string expected')

/** Username: 3–32, a-z0-9-_, keine führenden/trailing Sonderzeichen */
const Username = z.string()
  .min(3).max(32)
  .regex(/^[a-z0-9](?:[a-z0-9-_]*[a-z0-9])?$/, 'invalid username')
  .transform(s => s.toLowerCase())

/** Email optional; wenn gesetzt → valide und lowercase */
const Email = z.email().transform(s => s.toLowerCase())

/**
 * Argon2id Hash quick sanity:
 * - beginnt mit "$argon2id$"
 * - enthält Parameter/Salz/Hash (nicht vollständig strikt, aber schützt gegen Klartext)
 */
const Argon2idHash = z.string().regex(
  /^\$argon2id\$[^$]+\$[^$]+\$[A-Za-z0-9+/=]+$/,
  'invalid argon2id hash'
)

/** JSON Value (rekursiv) */
type JSONPrimitive = string | number | boolean | null
export type JSONValue = JSONPrimitive | JSONValue[] | { [k: string]: JSONValue }
export const JsonValue: ZodType<JSONValue> = z.lazy(() =>
  z.union<[
    ZodType<string>,
    ZodType<number>,
    ZodType<boolean>,
    ZodType<null>,
    ZodType<JSONValue[]>,
    ZodType<{ [key: string]: JSONValue }>
  ]>([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValue),
    z.record(z.string(), JsonValue) // <-- key: string, value: JsonValue
  ])
)

/** Bearer-Token-Metadaten (Hash statt Klartext) */
export const UserToken = z.object({
  id: z.string().uuid(),                  // zum gezielten Revoke
  name: z.string().min(1).max(64),
  hash: Hex(64),                          // z.B. HMAC-SHA256 hex
  createdAt: IsoDate,
  lastUsedAt: IsoDate.optional(),
  revokedAt: IsoDate.optional()
})

/** Rollen & Status */
export const UserRole = z.enum(['user', 'admin'])
export const UserStatus = z.enum(['active', 'locked'])

/** Der User selbst */
export const User = z.object({
  id: z.number().int().positive(),
  name: Username,
  email: Email.optional(),                // kein default: "" → eindeutiger
  password_hash: Argon2idHash,
  bearer_tokens: z.array(UserToken).default([]),
  role: UserRole.default('user'),
  status: UserStatus.default('active'),
  content: JsonValue.nullable().default(null),
  createdAt: IsoDate.default(() => new Date().toISOString()),
  updatedAt: IsoDate.default(() => new Date().toISOString())
})

/** Deine bestehende Collection: Array unter Key "users" */
export const Users = z.array(User)

/** Einzelne Session (ISO‑Zeiten für Serialisierung in JSON) */
export const Session = z.object({
  userId: z.number().int(),
  createdAt: z.string().datetime(),    // ISO 8601
  expiresAt: z.string().datetime(),    // ISO 8601
  // optionales Telemetrie
  ip: z.string().optional().default(''),
  userAgent: z.string().optional().default(''),
})

/** KV-Store: map sid -> Session */
export const SessionsStore = z.record(z.string().min(1), Session)

/** Bestehende Keys (andere bleiben wie gehabt) */
export const dataSchemas = {
  app: z.any().default({}),
  config: z.any().default({}),
  users: Users.default([]),
  sessions: SessionsStore.default({})
} as const

export type DataSchemaKey = keyof typeof dataSchemas
export type DataStoreTypes = { [K in DataSchemaKey]: z.infer<typeof dataSchemas[K]> }
export type UserType = z.infer<typeof User>
export type UsersType = z.infer<typeof Users>
