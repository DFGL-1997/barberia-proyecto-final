const express = require('express');
const router = express.Router();
const citasModel = require('../models/citasModel');

// GET TODAS LAS CITAS (con paginación)
router.get('/citas', async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 50;
    const offset = (pagina - 1) * limite;
    const { citas, total } = await citasModel.obtenerCitas(limite, offset);
    res.json({
      citas,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite)
    });
  } catch {
    res.status(500).json({ mensaje: "Error al obtener citas" });
  }
});

// GET CITA POR ID
router.get('/citas/:id', async (req, res) => {
  try {
    const cita = await citasModel.obtenerCitaPorId(req.params.id);
    if (!cita) return res.status(404).json({ mensaje: "No encontrada" });
    res.json(cita);
  } catch {
    res.status(500).json({ mensaje: "Error" });
  }
});

// CREAR CITA (POST)
router.post('/citas', async (req, res) => {
  try {
    const { cliente_id, servicio_id, fecha, hora, metodo_pago, barbero_id } = req.body;
    if (!cliente_id || !servicio_id || !fecha || !hora || !metodo_pago) {
      return res.status(400).json({ mensaje: "Faltan datos" });
    }
    await citasModel.crearCita(cliente_id, servicio_id, fecha, hora, metodo_pago, barbero_id || null);
    res.json({ mensaje: "Cita creada correctamente" });
  } catch (error) {
    console.error("ERROR BACKEND:", error.message);
    res.status(500).json({ mensaje: error.message });
  }
});

// ACTUALIZAR CITA (PUT)
router.put('/citas/:id', async (req, res) => {
  try {
    const { estado, fecha, hora } = req.body;
    const id = req.params.id;
    if (estado) await citasModel.actualizarEstado(id, estado);
    if (fecha && hora) await citasModel.actualizarFechaHora(id, fecha, hora);
    res.json({ mensaje: "Cita actualizada" });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// ELIMINAR CITA (DELETE)
router.delete('/citas/:id', async (req, res) => {
  try {
    await citasModel.eliminarCita(req.params.id);
    res.json({ mensaje: "Cita eliminada" });
  } catch {
    res.status(500).json({ mensaje: "Error al eliminar" });
  }
});

module.exports = router;