import 'dotenv/config';
export const env = {
  port: Number(process.env.PORT || 3000),
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true,
    decimalNumbers: false
  },
  jwtSecret: process.env.JWT_SECRET || '',
  origin: process.env.CORS_ORIGIN || ''
};
export function checkEnv() {
  for (const [k, v] of Object.entries({ DB_USER: env.db.user, DB_NAME: env.db.database, JWT_SECRET: env.jwtSecret })) {
    if (!v || (k === 'JWT_SECRET' && v.length < 32)) throw new Error(`Configura ${k} en backend/.env`);
  }
}
