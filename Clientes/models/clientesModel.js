const mysql = require('mysql2/promise');
const connection = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'mysql',
  database: process.env.DB_NAME || 'db_clientes'
});
async function obtenerClientes(limite = 100, offset = 0) {
  const [[{ total }]] = await connection.query('SELECT COUNT(*) as total FROM clientes');
  const [rows] = await connection.query('SELECT * FROM clientes LIMIT ? OFFSET ?', [limite, offset]);
  return { clientes: rows, total };
}
async function obtenerCliente(id) {
  const [rows] = await connection.query('SELECT * FROM clientes WHERE id = ?', [id]);
  return rows[0];
}
async function obtenerBarberos() {
  const [rows] = await connection.query(
    'SELECT id, nombre, usuario, rol FROM clientes WHERE rol = ? ORDER BY nombre ASC',
    ['barbero']
  );
  return rows;
}
async function crearCliente(nombre, telefono, email, usuario, password, rol) {
  const [result] = await connection.query(
    'INSERT INTO clientes (nombre, telefono, email, usuario, password, rol) VALUES (?, ?, ?, ?, ?, ?)',
    [nombre, telefono, email, usuario, password, rol]
  );
  return result;
}
async function actualizarCliente(nombre, telefono, email, id) {
  const [result] = await connection.query(
    'UPDATE clientes SET nombre = ?, telefono = ?, email = ? WHERE id = ?',
    [nombre, telefono, email, id]
  );
  return result;
}
async function eliminarCliente(id) {
  const [result] = await connection.query('DELETE FROM clientes WHERE id = ?', [id]);
  return result;
}
async function validarLogin(usuario, password) {
  const [rows] = await connection.query(
    'SELECT * FROM clientes WHERE usuario = ? AND password = ?',
    [usuario, password]
  );
  return rows[0];
}
module.exports = {
  obtenerClientes,
  obtenerCliente,
  obtenerBarberos,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
  validarLogin
};
