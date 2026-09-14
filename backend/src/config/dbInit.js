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

        // 2. Conectar a la base de datos hotel para verificar y actualizar tablas
        const dbConn = await mysql.createConnection({
            host,
            user,
            password,
            port,
            database: dbName,
            multipleStatements: true
        });

        // Crear tabla cargos de 2 roles estrictos (ADMIN y RECEPCION)
        await dbConn.query(`
            CREATE TABLE IF NOT EXISTS cargos (
                id_cargo INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
                tipo_cargo VARCHAR(30) NOT NULL
            );
        `);

        // Insertar cargos si no existen
        await dbConn.query(`
            INSERT IGNORE INTO cargos (id_cargo, tipo_cargo) VALUES (1, 'ADMIN'), (2, 'RECEPCION');
        `);

        // Crear tabla usuario
        await dbConn.query(`
            CREATE TABLE IF NOT EXISTS usuario (
                id_usuario INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
                nombre VARCHAR(40) NOT NULL,
                apellido VARCHAR(40) NOT NULL,
                username VARCHAR(40) NOT NULL DEFAULT '',
                contraseña VARCHAR(40) NOT NULL,
                correo VARCHAR(40) NOT NULL,
                dni VARCHAR(20) NOT NULL UNIQUE,
                cargo INT,
                FOREIGN KEY (cargo) REFERENCES cargos(id_cargo)
            );
        `);

        // Verificar si columna username existe en usuario, si no, agregarla
        const [colUsername] = await dbConn.query(`SHOW COLUMNS FROM usuario LIKE 'username'`);
        if (colUsername.length === 0) {
            await dbConn.query(`ALTER TABLE usuario ADD COLUMN username VARCHAR(40) NOT NULL DEFAULT '' AFTER apellido;`);
        }

        // Asegurar que usuarios por defecto tengan username y contraseña correctos
        await dbConn.query(`
            INSERT INTO usuario (id_usuario, nombre, apellido, username, contraseña, correo, dni, cargo)
            VALUES 
                (1, 'admin', '', 'admin', 'admin', 'admin@hotel.com', '1111', 1),
                (2, 'recep', '', 'recep', 'recep', 'recep@hotel.com', '2222', 2)
            ON DUPLICATE KEY UPDATE 
                nombre = VALUES(nombre),
                username = VALUES(username), 
                contraseña = VALUES(contraseña);
        `);

        // Crear tabla caracteristicas_catalogo
        await dbConn.query(`
            CREATE TABLE IF NOT EXISTS caracteristicas_catalogo (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(60) NOT NULL UNIQUE
            );
        `);

        // Crear tabla habitacion
        await dbConn.query(`
            CREATE TABLE IF NOT EXISTS habitacion (
                nro_habitacion INT PRIMARY KEY NOT NULL,
                tipo VARCHAR(50) NOT NULL,
                cantidad_camas INT NOT NULL DEFAULT 1,
                estado VARCHAR(15) NOT NULL DEFAULT 'LIBRE',
                precio_noche INT NOT NULL,
                caracteristicas TEXT NULL,
                creado_por_id INT NULL,
                FOREIGN KEY (creado_por_id) REFERENCES usuario(id_usuario)
            );
        `);

        // Crear tabla huesped
        await dbConn.query(`
            CREATE TABLE IF NOT EXISTS huesped (
                id_huesped INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
                nombre VARCHAR(80) NOT NULL,
                dni VARCHAR(20) NOT NULL,
                fecha_nacimiento DATE NULL,
                telefono VARCHAR(40) NULL,
                direccion VARCHAR(120) NULL,
                posee_vehiculo BOOLEAN DEFAULT FALSE,
                vehiculo_modelo VARCHAR(60) NULL,
                patente VARCHAR(30) NULL,
                tarjeta_credito VARCHAR(50) NULL,
                creado_por_id INT NULL,
                FOREIGN KEY (creado_por_id) REFERENCES usuario(id_usuario)
            );
        `);

        // Migraciones dinámicas para columnas de huesped
        const columnasHuesped = [
            { name: 'nombres', type: 'VARCHAR(80) NULL' },
            { name: 'apellidos', type: 'VARCHAR(80) NULL' },
            { name: 'tipo_documento', type: "VARCHAR(20) NOT NULL DEFAULT 'DNI'" },
            { name: 'numero_documento', type: 'VARCHAR(30) NULL' },
            { name: 'nacionalidad', type: "VARCHAR(50) NOT NULL DEFAULT 'Argentina'" },
            { name: 'email', type: 'VARCHAR(80) NULL' },
            { name: 'direccion', type: 'VARCHAR(120) NULL' },
            { name: 'posee_vehiculo', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'vehiculo_modelo', type: 'VARCHAR(60) NULL' },
            { name: 'patente', type: 'VARCHAR(30) NULL' },
            { name: 'tarjeta_credito', type: 'VARCHAR(50) NULL' }
        ];
        for (const col of columnasHuesped) {
            const [check] = await dbConn.query(`SHOW COLUMNS FROM huesped LIKE ?`, [col.name]);
            if (check.length === 0) {
                await dbConn.query(`ALTER TABLE huesped ADD COLUMN ${col.name} ${col.type}`);
            }
        }

        // Crear tabla reserva_data
        await dbConn.query(`
            CREATE TABLE IF NOT EXISTS reserva_data (
                id_reserva_data INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
                inicio DATETIME,
                fin DATETIME,
                adultos INT DEFAULT 1,
                ninos INT DEFAULT 0,
                precio_noche DECIMAL(10,2) DEFAULT 0.00,
                precio_total DECIMAL(10,2) DEFAULT 0.00,
                comida VARCHAR(50) DEFAULT 'Ninguno',
                descuento INT DEFAULT 0,
                creado_por_id INT,
                FOREIGN KEY (creado_por_id) REFERENCES usuario(id_usuario)
            );
        `);

        // Migraciones para reserva_data si ya existía con campos anteriores
        const columnasResData = [
            { name: 'adultos', type: 'INT DEFAULT 1' },
            { name: 'ninos', type: 'INT DEFAULT 0' },
            { name: 'precio_noche', type: 'DECIMAL(10,2) DEFAULT 0.00' },
            { name: 'precio_total', type: 'DECIMAL(10,2) DEFAULT 0.00' }
        ];
        for (const col of columnasResData) {
            const [check] = await dbConn.query(`SHOW COLUMNS FROM reserva_data LIKE ?`, [col.name]);
            if (check.length === 0) {
                await dbConn.query(`ALTER TABLE reserva_data ADD COLUMN ${col.name} ${col.type}`);
            }
        }

        // Crear tabla reserva
        await dbConn.query(`
            CREATE TABLE IF NOT EXISTS reserva (
                id_reserva INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
                id_huesped INT,
                nro_habitacion INT,
                id_reserva_data INT,
                vehiculo_patente VARCHAR(30) NULL,
                creado_por_id INT,
                fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (creado_por_id) REFERENCES usuario(id_usuario),
                FOREIGN KEY (id_huesped) REFERENCES huesped(id_huesped),
                FOREIGN KEY (nro_habitacion) REFERENCES habitacion(nro_habitacion),
                FOREIGN KEY (id_reserva_data) REFERENCES reserva_data(id_reserva_data)
            );
        `);

        // Migración de vehiculo_patente en reserva
        const [checkPatReserva] = await dbConn.query(`SHOW COLUMNS FROM reserva LIKE 'vehiculo_patente'`);
        if (checkPatReserva.length === 0) {
            await dbConn.query(`ALTER TABLE reserva ADD COLUMN vehiculo_patente VARCHAR(30) NULL;`);
        }

        // Crear tabla intermedia reserva_acompanantes
        await dbConn.query(`
            CREATE TABLE IF NOT EXISTS reserva_acompanantes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                id_reserva INT NOT NULL,
                id_huesped INT NOT NULL,
                fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_reserva) REFERENCES reserva(id_reserva) ON DELETE CASCADE,
                FOREIGN KEY (id_huesped) REFERENCES huesped(id_huesped) ON DELETE CASCADE,
                UNIQUE KEY uq_reserva_huesped (id_reserva, id_huesped)
            );
        `);

        // Crear Vistas para compatibilidad con nomenclatura plural
        await dbConn.query(`CREATE OR REPLACE VIEW huespedes AS SELECT * FROM huesped;`);
        await dbConn.query(`CREATE OR REPLACE VIEW habitaciones AS SELECT * FROM habitacion;`);
        await dbConn.query(`CREATE OR REPLACE VIEW reservas AS SELECT * FROM reserva;`);

        // Crear tabla pago
        await dbConn.query(`
            CREATE TABLE IF NOT EXISTS pago (
                id_pago INT AUTO_INCREMENT PRIMARY KEY,
                id_reserva INT NOT NULL,
                monto DECIMAL(10,2) NOT NULL,
                metodo_pago VARCHAR(30) NOT NULL,
                fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
                creado_por_id INT,
                FOREIGN KEY (creado_por_id) REFERENCES usuario(id_usuario),
                FOREIGN KEY (id_reserva) REFERENCES reserva(id_reserva)
            );
        `);

        // Crear tabla logs
        await dbConn.query(`
            CREATE TABLE IF NOT EXISTS logs (
                id_log INT AUTO_INCREMENT PRIMARY KEY,
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                usuario VARCHAR(50) NOT NULL,
                accion VARCHAR(255) NOT NULL
            );
        `);

        console.log('[DB] Base de datos verificada y estructurada correctamente en MySQL.');
        await dbConn.end();
    } catch (error) {
        console.error('[DB Error] Error al verificar/autoinicializar la base de datos MySQL:', error.message);
    }
}
