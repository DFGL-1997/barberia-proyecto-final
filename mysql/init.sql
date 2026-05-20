-- =============================================
--  BASE DE DATOS: db_clientes
-- =============================================
CREATE DATABASE IF NOT EXISTS db_clientes;
USE db_clientes;

CREATE TABLE IF NOT EXISTS clientes (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) DEFAULT NULL,
  telefono VARCHAR(20) DEFAULT NULL,
  email VARCHAR(100) DEFAULT NULL,
  usuario VARCHAR(50) DEFAULT NULL,
  password VARCHAR(100) DEFAULT NULL,
  rol VARCHAR(20) DEFAULT 'cliente',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Usuario admin por defecto
INSERT IGNORE INTO clientes (id, nombre, telefono, email, usuario, password, rol)
VALUES (1, 'Administrador', '0000000000', 'admin@barberia.com', 'admin', 'admin123', 'admin');

-- =============================================
--  BASE DE DATOS: db_servicios
-- =============================================
CREATE DATABASE IF NOT EXISTS db_servicios;
USE db_servicios;

CREATE TABLE IF NOT EXISTS servicios (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) DEFAULT NULL,
  precio DECIMAL(10,2) DEFAULT NULL,
  duracion INT DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Servicios de ejemplo
INSERT IGNORE INTO servicios (nombre, precio, duracion) VALUES
('Corte de cabello Basico', 12000, 30),
('Corte de cabello Basico + barba', 15000, 45),
('Arreglo de barba', 8000, 20),
('Corte + lavado', 18000, 60);

-- =============================================
--  BASE DE DATOS: db_citas
-- =============================================
CREATE DATABASE IF NOT EXISTS db_citas;
USE db_citas;

CREATE TABLE IF NOT EXISTS citas (
  id INT NOT NULL AUTO_INCREMENT,
  cliente_id INT DEFAULT NULL,
  servicio_id INT DEFAULT NULL,
  barbero_id INT DEFAULT NULL,
  fecha_hora DATETIME DEFAULT NULL,
  precio DECIMAL(10,2) DEFAULT NULL,
  estado VARCHAR(50) DEFAULT NULL,
  metodo_pago VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
