drop database if exists sistema_hotel;
create database sistema_hotel;
use sistema_hotel;

-- Importante: El orden de las tablas tiene que ser el que se encuentra abajo por cuestion de dependencias:
-- O sea, huesped usa de referencia una columna de usuario, lo mismo con otras que dependen de las de arriba.
-- Es una tontera, pero es importante por si queres cambiar el orden de estas tablas o agregar una nueva.

create table cargos(
  id_cargo int auto_increment primary key not null,
  tipo_cargo varchar(20) not null
);

create table usuario( 
  id_usuario int auto_increment primary key not null,
  nombre varchar(40) not null,
  apellido varchar(40) not null,
  contraseña varchar(40) not null,
  correo varchar(40) not null,
  dni varchar(20) not null unique,
  cargo int, -- Es el tipo de cargo que tiene: O sea, admin o lo que sea.
  foreign key (cargo) references cargos(id_cargo)
);

create table huesped(
  id_huesped int auto_increment not null primary key,
  nombre varchar(40) not null,
  dni char(8) not null,
  fecha_nacimiento date not null,
  telefono varchar(40) not null, -- suena contradictorio que el numero sean letras, pero es para permitir los simbolos y no perder los 0 iniciales (lo saque de StackOverflow).
  creado_por_id INT not null,
  foreign key (creado_por_id) references usuario(id_usuario)
);
 
create table habitacion(
  nro_habitacion int primary key not null,
  tipo varchar(50) not null,
  cantidad_camas int not null default 1,
  estado varchar(15) not null default 'LIBRE',
  precio_noche int not null,
  caracteristicas text null,
  creado_por_id INT not null,
  foreign key (creado_por_id) references usuario(id_usuario)
);

-- Dato curioso: Podes hacer el calculo del precio usando el valor de "inicio" y "fin" combinado con el valor de habitación.
-- Por lo que ví, es una mala practica. La DB sirve para guardar y organizar datos, asi convertirlos en información.
-- Puede sonar logico, pero la DB no debe de hacer nada que no sea guardar datos e información :)

-- Importante: Explicar correctamente esta tabla es un dolor de cabeza. Pero es esencial.
-- Cuando hagamos pruebas y tal, mostrare correctamente como es esto.

create table reserva_data(
  id_reserva_data int auto_increment primary key not null,
  inicio date,
  fin date,
  comida varchar(50) default 'Ninguno',
  descuento int default 0,
  creado_por_id INT,
  foreign key (creado_por_id) references usuario(id_usuario)
);

create table reserva(
  id_reserva int auto_increment primary key not null,
  id_huesped int,
  nro_habitacion int,
  id_reserva_data int,
  creado_por_id INT,
  fecha_registro datetime default current_timestamp,
  foreign key (creado_por_id) references usuario(id_usuario),
  foreign key (id_huesped) references huesped(id_huesped),
  foreign key (nro_habitacion) references habitacion(nro_habitacion),
  foreign key (id_reserva_data) references reserva_data(id_reserva_data)
);

create table pago(
  id_pago int auto_increment primary key,
  id_reserva int not null,
  monto decimal(10,2) not null, -- Monto que se pago en esta transacción.
  metodo_pago varchar(30) not null, 
  fecha_pago datetime default current_timestamp, -- Esto guarda la hora y fecha actual.
  creado_por_id INT, 
  foreign key (creado_por_id) references usuario(id_usuario),
  foreign key (id_reserva) references reserva(id_reserva)
);

create table logs(
  id_log int auto_increment primary key,
  fecha datetime default current_timestamp,
  usuario varchar(50) not null,
  accion varchar(255) not null
);

-- ===================================================
-- DATOS INICIALES DE PRUEBA (SEED DATA)
-- ===================================================

insert into cargos (id_cargo, tipo_cargo) values 
(1, 'ADMIN'), 
(2, 'USER');

insert into usuario (id_usuario, nombre, apellido, contraseña, correo, dni, cargo) values 
(1, 'Admin Master', 'Sistema', 'admin', 'admin@hotel.com', '1111', 1),
(2, 'Juan Recepción', 'Pérez', 'recep', 'juan@hotel.com', '2222', 2);

insert into habitacion (nro_habitacion, tipo, cantidad_camas, estado, precio_noche, caracteristicas, creado_por_id) values
(101, 'Simple', 1, 'LIBRE', 25000, '["TV", "Ventilador", "Cama 1 Plaza"]', 1),
(102, 'Doble', 2, 'OCUPADA', 40000, '["TV", "Aire Acondicionado", "2 Camas 1 Plaza"]', 1),
(201, 'Matrimonial', 1, 'LIBRE', 45000, '["TV 42\\"", "Aire Acondicionado", "Sommier 2 Plazas"]', 1),
(301, 'Suite', 3, 'LIBRE', 80000, '["TV 55\\"", "Jacuzzi", "Minibar", "Vista al Parque"]', 1);

insert into huesped (id_huesped, nombre, dni, fecha_nacimiento, telefono, creado_por_id) values
(1, 'Carlos Rodríguez', '35123456', '1990-01-01', '11223344', 1);

insert into reserva_data (id_reserva_data, inicio, fin, comida, descuento, creado_por_id) values
(1, '2026-08-15', '2026-08-20', 'Desayuno', 0, 1);

insert into reserva (id_reserva, id_huesped, nro_habitacion, id_reserva_data, creado_por_id, fecha_registro) values
(1, 1, 102, 1, 1, '2026-08-15 08:30:00');

insert into logs (fecha, usuario, accion) values
('2026-08-19 07:55:00', 'Juan Recepción', 'Inicio de turno'),
('2026-08-19 08:30:00', 'Juan Recepción', 'Registro de huésped: Carlos Rodríguez (Hab. 102)'),
('2026-08-19 10:15:00', 'Juan Recepción', 'Check-out: María López (Hab. 201)'),
('2026-08-19 15:00:00', 'Admin Master', 'Inicio de turno (Admin)'),
('2026-08-19 15:30:00', 'Admin Master', 'Creación de nueva Habitación #301');
