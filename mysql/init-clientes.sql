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

INSERT IGNORE INTO clientes (id, nombre, telefono, email, usuario, password, rol)
VALUES (1, 'Administrador', '0000000000', 'admin@barberia.com', 'admin', 'admin123', 'admin');
