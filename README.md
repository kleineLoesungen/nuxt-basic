# Starter-Kit Nuxt-App
## Features

### General Configuration
- nuxt 3
- tailwindcss support

### PostgresSQL Database Driver
#### Files
- `server/db/client.ts` - db connector
- `server/db/init.ts` & `server/plugins.init-db.ts` - insert/update app_\<env.APP_ID> table (schema: `key: string, data: jsonb`)
- `server/utils/db.ts` - db object with `db.getItem(key)` and `db.setItem<T>(key)`
- `server/utils/data-schema.ts` - **db app key and data configuration**

#### Routes
- `GET api/keys` - list of valid db keys
- `GET api/data/:key` - get data of key
- `POST api/data/:key` - set data of key

#### ENV
PG_HOST, PG_PORT (psql: 5432), PG_USER, PG_PASSWORD, PG_DATABASE, APP_ID

### Next
- bearer auth
- basic auth TODO: NEXT
- default layout