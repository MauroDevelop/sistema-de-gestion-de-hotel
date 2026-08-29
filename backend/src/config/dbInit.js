import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export async function initDatabase() {
    try {
        const host = process.env.DB_HOST || 'localhost';
        const user = process.env.DB_USER || 'root';
        const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';
        const port = Number(process.env.DB_PORT) || 3306;
        const dbName = process.env.DB_NAME || 'sistema_hotel';

        // 1. Conexión a MySQL para crear la base de datos si no existe
        const rootConn = await mysql.createConnection({
            host,
            user,
            password,
            port,
            multipleStatements: true
        });

        await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        await rootConn.end();

        // 2. Conectar a la base de datos hotel para verificar tablas
        const dbConn = await mysql.createConnection({
            host,
            user,
            password,
            port,
            database: dbName,
            multipleStatements: true
        });

        const [tables] = await dbConn.query(`SHOW TABLES LIKE 'usuario'`);

        // 3. Si las tablas no existen, lee y ejecuta schema.sql automáticamente
        if (tables.length === 0) {
            console.log('[DB] Base de datos no inicializada. Importando schema.sql automáticamente...');

            let schemaPath = path.resolve(process.cwd(), '../schema.sql');
            if (!fs.existsSync(schemaPath)) {
                schemaPath = path.resolve(process.cwd(), 'schema.sql');
            }

            if (fs.existsSync(schemaPath)) {
                const sqlScript = fs.readFileSync(schemaPath, 'utf-8');
                await dbConn.query(sqlScript);
                console.log('[DB] Base de datos importada e inicializada con éxito desde schema.sql');
            } else {
                console.warn('[DB] No se encontró el archivo schema.sql para la autoinicialización.');
            }
        } else {
            console.log('[DB] Conexión con base de datos MySQL verificada correctamente.');
        }

        await dbConn.end();
    } catch (error) {
        console.error('[DB Error] Error al verificar/autoinicializar la base de datos MySQL:', error.message);
        console.error('[DB Error] Asegúrate de que el servidor MySQL esté corriendo en tu equipo (XAMPP, MySQL Server, etc.).');
    }
}
