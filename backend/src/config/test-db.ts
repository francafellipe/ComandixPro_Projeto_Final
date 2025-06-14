import { Pool } from "pg";

const pool = new Pool();

async function testConnection() {
    try {
        const res = await pool.query('SELECT NOW()');
        console.log('✅ Conectado ao PostgreSQL:', res.rows[0]);
    } catch (err) {
        console.error('❌ Erro ao conectar:', err);
    } finally {
        await pool.end();
    }
}

testConnection();
