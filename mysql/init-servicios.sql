CREATE DATABASE IF NOT EXISTS db_servicios;
USE db_servicios;

CREATE TABLE IF NOT EXISTS servicios (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) DEFAULT NULL,
  precio DECIMAL(10,2) DEFAULT NULL,
  duracion INT DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO servicios (nombre, precio, duracion) VALUES
('Corte de cabello Basico', 12000, 30),
('Corte de cabello Basico + barba', 15000, 45),
('Arreglo de barba', 8000, 20),
('Corte + lavado', 18000, 60);
