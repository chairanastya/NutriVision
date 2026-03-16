import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

export async function queryDatabase(
    query: string,
    values?: (string | number | null)[]
) {
    const client = await pool.connect();
    try {
        const result = await client.query(query, values);
        return result;
    } finally {
        client.release();
    }
}

export default pool;
