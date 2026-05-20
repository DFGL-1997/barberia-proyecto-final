const mysql = require('mysql2/promise');

const connection = mysql.createPool({
  host: process.env.DB_HOST || 'mysql-servicios',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'mysql',
  database: process.env.DB_NAME || 'db_servicios'
});

async function obtenerServicios() {
  const [rows] = await connection.query('SELECT * FROM servicios');
  return rows;
}
async function obtenerServicioPorId(id) {
  const [rows] = await connection.query(
    'SELECT * FROM servicios WHERE id = ?',
    [id]
  );
  return rows[0];
}
async function crearServicio(nombre, precio, duracion) {
  const [result] = await connection.query(
    'INSERT INTO servicios (nombre, precio, duracion) VALUES (?, ?, ?)',
    [nombre, precio, duracion]
  );
  return result;
}
async function editarServicio(id, nombre, precio, duracion) {
  const [result] = await connection.query(
    'UPDATE servicios SET nombre = ?, precio = ?, duracion = ? WHERE id = ?',
    [nombre, precio, duracion, id]
  );
  return result;
}
async function eliminarServicio(id) {
  const [result] = await connection.query(
    'DELETE FROM servicios WHERE id = ?',
    [id]
  );
  return result;
}

module.exports = {
  obtenerServicios,
  obtenerServicioPorId,
  crearServicio,
  editarServicio,
  eliminarServicio
};