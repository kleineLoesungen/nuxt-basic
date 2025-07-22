// ⚠️ Diese Datei wurde automatisch generiert von db/scripts/ts-types.ts. Nicht manuell bearbeiten!

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  created_at?: string;
}

export interface Post {
  id: number;
  user_id: number;
  title: string;
  content?: string | null;
  published?: boolean;
  created_at?: string;
}
