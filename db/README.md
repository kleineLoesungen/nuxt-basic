# 💾 Datenbank-Connector für Nuxt-Projekt

Dieses Projekt nutzt eine **abstrakte Treiberarchitektur** für Datenbankzugriffe. Die Konfiguration erfolgt dynamisch über die Umgebungsvariable `DB_URL`.

---

## 📌 Übersicht

- Unterstützt mehrere Datenbanksysteme über ein gemeinsames Interface
- Nutzt eine zentrale `schema.json` zur Definition der Tabellenstruktur
- Ermöglicht automatische Migrationen und Typgenerierung
- Bietet Skripte zur Inspektion und Prüfung des Datenbankschemas

---

## ⚙️ Nutzung

### .env

```env
DB_URL=sqlite://./data.db
```

### Verfügbare Skripte

```bash
# Führt Migration auf Basis der schema.json aus
npm run db:migrate

# ... mit optionalem Spaltenerzwingen (z. B. bei fehlenden Spalten)
npm run db:migrate -- --force

# Zeigt Tabellen, Spalten und Zeilenanzahl
npm run db:inspect

# Generiert TypeScript-Interfaces aus schema.json
npm run db:types
```

---

## 📂 Verzeichnisstruktur

```text
db/
├── drivers/           # Datenbankspezifische Treiber
│   ├── index.ts       # Treiber-Registry
│   └── sqlite.ts      # Beispieltreiber: SQLite (better-sqlite3)
├── index.ts           # Dynamischer Treiber-Lader via DB_URL
├── schema.json        # Zentrale Tabellendefinition
└── scripts/           # CLI-Tools: Migrate, Inspect, Type-Generator
```

---

## 🔌 Funktionsweise

### Dynamische Treiberauswahl

```ts
// db/index.ts
const dbUrl = process.env.DB_URL || 'sqlite://./data.db'
const scheme = dbUrl.split(':')[0] // => 'sqlite'

const driver = drivers[scheme]
```

Jeder Treiber muss das gemeinsame Interface `DatabaseDriver` implementieren. Dieses abstrahiert Datenbankdetails vollständig:

```ts
export interface DatabaseDriver {
  connect(): Promise<any>
  query<T = any>(sql: string, params?: any[]): Promise<T[]>
  exec(sql: string): Promise<void>
  close(): Promise<void>

  getTableNames(): Promise<string[]>
  getTableColumns(table: string): Promise<ColumnInfo[]>
  countRows(table: string): Promise<number>
}
```

---

## 📐 `schema.json` Beispiel

```json
{
  "tables": {
    "users": {
      "columns": {
        "id": { "type": "integer", "primary": true, "autoIncrement": true },
        "username": { "type": "string", "unique": true, "nullable": false },
        "email": { "type": "string", "unique": true, "nullable": false },
        "password": { "type": "string", "nullable": false },
        "created_at": { "type": "datetime", "default": "CURRENT_TIMESTAMP" }
      }
    }
  }
}
```

---

## 🧪 Migration (`npm run db:migrate`)

- Erstellt Tabellen aus `schema.json`, falls sie nicht existieren
- Prüft bestehende Spalten auf Übereinstimmung
- Optional (`--force`): Fügt fehlende Spalten hinzu (nur unterstützte Operationen!)
- SQLite-Hinweis: `ALTER COLUMN` wird nicht unterstützt (Warnung wird ausgegeben)

---

## 🔎 Inspektion (`npm run db:inspect`)

Zeigt für jede Tabelle:
- Spaltenname, Typ, Constraints (`PRIMARY KEY`, `NOT NULL`, `DEFAULT`)
- Aktuelle Anzahl der Einträge

Beispielausgabe:

```text
🧱 Tabelle: users
  - id: INTEGER | PRIMARY KEY
  - username: VARCHAR(255) | NOT NULL, UNIQUE
  🔢 Einträge: 5
```

---

## 🧬 Typen generieren (`npm run db:types`)

Erzeugt Datei: `types/db-types.ts`

```ts
export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  created_at?: string | null;
}
```

Beachte:
- `nullable` → `| null`
- `default`/`nullable` → optionales Feld (`?`)

---

## ➕ Neue Datenbanktreiber hinzufügen

### Schritt 1: Treiber implementieren

Erstelle z. B. `db/drivers/postgres.ts`:

```ts
import type { DatabaseDriver } from '@/types/db'

const postgresDriver: DatabaseDriver = {
  connect: async () => { ... },
  query: async (sql, params) => { ... },
  exec: async (sql) => { ... },
  close: async () => { ... },
  getTableNames: async () => { ... },
  getTableColumns: async (table) => { ... },
  countRows: async (table) => { ... }
}

export default postgresDriver
```

### Schritt 2: Registry erweitern

```ts
// db/drivers/index.ts
import sqlite from './sqlite'
import postgres from './postgres'

export const drivers = {
  sqlite,
  postgres
}
```

### Schritt 3: `.env` setzen

```env
DB_URL=postgres://user:password@localhost:5432/dbname
```

---

## 🧼 Hinweise

- Unterstützte Typen in `schema.json`: `integer`, `string`, `text`, `boolean`, `datetime`
- Wenn du neue Typen oder Constraints brauchst: Erweiterung der `columnSql()`-Funktion in `migrate.ts`
- Für vollständige ALTER TABLE-Unterstützung muss der Treiber diese Funktionalität abbilden

---

## 🧠 Warum dieses System?

- 🔌 Flexibel für verschiedene Datenbanksysteme
- 💡 Zentrale Schema-Definition statt händischer SQL-Migration
- 🛠 Entwicklertools zur Konsistenzprüfung und Generierung

---

## 📁 Lizenz

MIT – gerne kopieren, anpassen, verbessern.
