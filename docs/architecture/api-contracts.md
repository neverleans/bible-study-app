# API Contracts

Planned REST endpoints grouped by module.

## Bible
- `GET /api/bible/books` - List all books
- `GET /api/bible/books/:abbrev` - Get book details
- `GET /api/bible/books/:abbrev/:chapter` - Get chapter content

## Search
- `GET /api/search?q={query}` - Search Bible verses

## Notes
- `GET /api/notes` - List user notes
- `POST /api/notes` - Create note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

## AI & Study Aids
- `POST /api/ai/explain` - Generate explanation for a verse/passage
- `POST /api/study-aids/generate` - Generate study aid for a chapter
- `GET /api/study-aids/:chapterId` - Get study aids for a chapter

## Auth
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Authenticate and get token
- `GET /api/auth/me` - Get current user info

## Health
- `GET /health` - API and database health status
