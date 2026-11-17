// Must be imported BEFORE app.module: ConfigModule.forRoot() validates the environment when
// app.module is first loaded, and the contract generator runs with no .env (e.g. in CI).
// The values are never used to connect to anything.
process.env.DATABASE_URL ??= 'postgresql://contract:contract@127.0.0.1:1/contract';
process.env.REDIS_HOST ??= '127.0.0.1';
process.env.REDIS_PORT ??= '1';
process.env.FRONTEND_URL ??= 'http://localhost:5173';
