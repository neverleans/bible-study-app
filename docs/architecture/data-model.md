# Data Model

The PostgreSQL database uses Prisma ORM.

## Tables

### `books`
- `id`: Int (PK)
- `abbrev`: String (Unique)
- `name`: String
- `testament`: Enum ('OT', 'NT')
- `chapterCount`: Int
- `order`: Int

### `chapters`
- `id`: Int (PK)
- `bookId`: Int (FK to books)
- `number`: Int
- `verses`: Json

### `notes`
- `id`: Int (PK)
- `userId`: Int (FK to users)
- `chapterId`: Int (FK to chapters, nullable)
- `content`: String
- `createdAt`: DateTime
- `updatedAt`: DateTime

### `users`
- `id`: Int (PK)
- `email`: String (Unique)
- `name`: String
- `passwordHash`: String
- `createdAt`: DateTime

### `study_aids`
- `id`: Int (PK)
- `chapterId`: Int (FK to chapters)
- `aiContent`: String
- `promptHash`: String
- `createdAt`: DateTime

### `ai_cache`
- `id`: Int (PK)
- `key`: String (Unique)
- `response`: Json
- `expiresAt`: DateTime
