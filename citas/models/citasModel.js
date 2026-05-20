const mysql = require('mysql2/promise');
const axios = require('axios');

const connection = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'mysql',
  database: process.env.DB_NAME || 'db_citas'
});

async function obtenerCitas(limite = 50, offset = 0) {
  const [[{ total }]] = await connection.query('SELECT COUNT(*) as total FROM citas');
  const [rows] = await connection.query('SELECT * FROM citas ORDER BY id DESC LIMIT ? OFFSET ?', [limite, offset]);

  const citasCompletas = await Promise.all(
    rows.map(async (cita) => {
      const fecha = new Date(cita.fecha_hora);
      try {
        const [clienteRes, servicioRes] = await Promise.all([
          axios.get(`http://usuarios:3001/clientes/${cita.cliente_id}`),
          axios.get(`http://servicios:3002/servicios/${cita.servicio_id}`)
        ]);
        const barberoRes = cita.barbero_id
          ? await axios.get(`http://usuarios:3001/clientes/${cita.barbero_id}`)
          : null;
        return {
          id: cita.id,
          cliente_id: cita.cliente_id,
          cliente: clienteRes.data?.nombre || 'No encontrado',
          servicio: servicioRes.data?.nombre || 'No encontrado',
          barbero_id: cita.barbero_id || null,
          barbero: barberoRes?.data?.nombre || null,
          precio: cita.precio,
          fecha: fecha.toISOString().split('T')[0],
          hora: fecha.toTimeString().slice(0, 5),
          estado: cita.estado,
          metodo_pago: cita.metodo_pago || 'no definido'
        };
      } catch (error) {
        return {
          id: cita.id,
          cliente_id: cita.cliente_id,
          cliente: 'No encontrado',
          servicio: 'No encontrado',
          barbero_id: cita.barbero_id || null,
          barbero: null,
          precio: cita.precio,
          fecha: fecha.toISOString().split('T')[0],
          hora: fecha.toTimeString().slice(0, 5),
          estado: cita.estado,
          metodo_pago: cita.metodo_pago || 'no definido'
        };
      }
    })
  );

  return { citas: citasCompletas, total };
}

async function obtenerCitaPorId(id) {
  const [rows] = await connection.query('SELECT * FROM citas WHERE id = ?', [id]);
  const cita = rows[0];
  if (!cita) return null;
  try {
    const clienteRes = await axios.get(`http://usuarios:3001/clientes/${cita.cliente_id}`);
    const servicioRes = await axios.get(`http://servicios:3002/servicios/${cita.servicio_id}`);
    const barberoRes = cita.barbero_id
      ? await axios.get(`http://usuarios:3001/clientes/${cita.barbero_id}`)
      : null;
    const fecha = new Date(cita.fecha_hora);
    return {
      id: cita.id,
      cliente_id: cita.cliente_id,
      cliente: clienteRes.data?.nombre,
      servicio: servicioRes.data?.nombre,
      barbero_id: cita.barbero_id || null,
      barbero: barberoRes?.data?.nombre || null,
      precio: cita.precio,
      fecha: fecha.toISOString().split('T')[0],
      hora: fecha.toTimeString().slice(0, 5),
      estado: cita.estado,
      metodo_pago: cita.metodo_pago
    };
  } catch (error) {
    return null;
  }
}

async function crearCita(cliente_id, servicio_id, fecha, hora, metodo_pago, barbero_id = null) {
  try {
    const clienteRes = await axios.get(`http://usuarios:3001/clientes/${cliente_id}`);
    if (!clienteRes.data) throw new Error("El cliente no existe");
  } catch (e) {
    throw new Error("El cliente no existe");
  }
  let servicioRes;
  try {
    servicioRes = await axios.get(`http://servicios:3002/servicios/${servicio_id}`);
    if (!servicioRes.data) throw new Error("El servicio no existe");
  } catch (e) {
    throw new Error("El servicio no existe");
  }
  if (barbero_id) {
    try {
      const barberoRes = await axios.get(`http://usuarios:3001/clientes/${barbero_id}`);
      if (!barberoRes.data || barberoRes.data.rol !== 'barbero') {
        throw new Error("El barbero no existe");
      }
    } catch (e) {
      throw new Error("El barbero seleccionado no es valido");
    }
  }
  const fecha_hora = `${fecha} ${hora}:00`;
  let citas;
  if (barbero_id) {
    [citas] = await connection.query(
      `SELECT id FROM citas WHERE fecha_hora = ? AND barbero_id = ? AND estado IN ('pendiente', 'atendida')`,
      [fecha_hora, barbero_id]
    );
  } else {
    [citas] = await connection.query(
      `SELECT id FROM citas WHERE fecha_hora = ? AND estado IN ('pendiente', 'atendida')`,
      [fecha_hora]
    );
  }
  if (citas.length > 0) {
    throw new Error(
      barbero_id
        ? "Ese barbero ya tiene una cita reservada para esa fecha y hora"
        : "Ya existe una cita reservada para esa fecha y hora"
    );
  }
  const precio = servicioRes.data.precio;
  if (!precio) throw new Error("El servicio no tiene precio definido");
  await connection.query(
    `INSERT INTO citas (cliente_id, servicio_id, barbero_id, fecha_hora, precio, estado, metodo_pago) VALUES (?, ?, ?, ?, ?, 'pendiente', ?)`,
    [cliente_id, servicio_id, barbero_id, fecha_hora, precio, metodo_pago]
  );
}

async function actualizarEstado(id, estado) {
  await connection.query('UPDATE citas SET estado = ? WHERE id = ?', [estado, id]);
}

async function actualizarFechaHora(id, fecha, hora) {
  const fecha_hora = `${fecha} ${hora}:00`;
  const [citas] = await connection.query(
    `SELECT * FROM citas WHERE fecha_hora = ? AND estado = 'pendiente' AND id != ?`,
    [fecha_hora, id]
  );
  if (citas.length > 0) throw new Error("Horario ocupado");
  await connection.query(`UPDATE citas SET fecha_hora = ? WHERE id = ?`, [fecha_hora, id]);
}

async function eliminarCita(id) {
  await connection.query('DELETE FROM citas WHERE id = ?', [id]);
}

async function cancelarCitasVencidas() {
  try {
    const [result] = await connection.query(`
      UPDATE citas SET estado = 'cancelada'
      WHERE estado = 'pendiente'
      AND fecha_hora < (NOW() - INTERVAL 15 MINUTE)
    `);
    if (result.affectedRows > 0) {
      console.log(`Citas canceladas: ${result.affectedRows}`);
    }
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
  obtenerCitas,
  obtenerCitaPorId,
  crearCita,
  actualizarEstado,
  actualizarFechaHora,
  eliminarCita,
  cancelarCitasVencidas
};
