drop database if exists sistema_hotel;
create database sistema_hotel;
use sistema_hotel;

create table cargos(
  id_cargo int auto_increment primary key not null,
  tipo_cargo varchar(30) not null
);

create table usuario( 
  id_usuario int auto_increment primary key not null,
  nombre varchar(40) not null,
  apellido varchar(40) not null,
  username varchar(40) not null,
  contraseña varchar(40) not null,
  correo varchar(40) not null,
  dni varchar(20) not null unique,
  cargo int, -- 1: ADMIN, 2: RECEPCION
  foreign key (cargo) references cargos(id_cargo)
);

create table huesped(
  id_huesped int auto_increment not null primary key,
  nombre varchar(80) not null,
  dni varchar(20) not null,
  fecha_nacimiento date null,
  telefono varchar(40) null,
  direccion varchar(120) null,
  posee_vehiculo boolean default false,
  vehiculo_modelo varchar(60) null,
  patente varchar(30) null,
  tarjeta_credito varchar(50) null,
  creado_por_id INT null,
  foreign key (creado_por_id) references usuario(id_usuario)
);

create table caracteristicas_catalogo(
  id int auto_increment primary key,
  nombre varchar(60) not null unique
);

create table habitacion(
  nro_habitacion int primary key not null,
  tipo varchar(50) not null,
  cantidad_camas int not null default 1,
  estado varchar(15) not null default 'LIBRE',
  precio_noche int not null,
  caracteristicas text null,
  creado_por_id INT null,
  foreign key (creado_por_id) references usuario(id_usuario)
);

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
  monto decimal(10,2) not null,
  metodo_pago varchar(30) not null, 
  fecha_pago datetime default current_timestamp,
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
-- ESTRUCTURA INICIAL DE CONFIGURACIÓN (SOLO USUARIOS Y ROLES SISTEMA)
-- ===================================================

insert into cargos (id_cargo, tipo_cargo) values 
(1, 'ADMIN'), 
(2, 'RECEPCION');

insert into usuario (id_usuario, nombre, apellido, username, contraseña, correo, dni, cargo) values 
(1, 'admin', '', 'admin', 'admin', 'admin@hotel.com', '1111', 1),
(2, 'recep', '', 'recep', 'recep', 'recep@hotel.com', '2222', 2);

