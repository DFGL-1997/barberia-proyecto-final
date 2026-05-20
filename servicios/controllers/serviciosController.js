const { Router } = require('express');
const router = Router();
const serviciosModel = require('../models/serviciosModel');

// CONSULTAR TODOS LOS SERVICIOS
router.get('/servicios', async (req, res) => {
  try {
    const servicios = await serviciosModel.obtenerServicios();
    res.json(servicios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener servicios" });
  }
});

// CONSULTAR UN SERVICIO
router.get('/servicios/:id', async (req, res) => {
  try {
    const servicio = await serviciosModel.obtenerServicioPorId(req.params.id);

    if (!servicio) {
      return res.status(404).json({ mensaje: "Servicio no encontrado" });
    }

    res.json(servicio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al consultar servicio" });
  }
});

// CREAR SERVICIO
router.post('/servicios', async (req, res) => {
  try {
    const { nombre, precio, duracion } = req.body;

    await serviciosModel.crearServicio(nombre, precio, duracion);

    res.json({ mensaje: "Servicio creado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al crear servicio" });
  }
});

// ACTUALIZAR SERVICIO
router.put('/servicios/:id', async (req, res) => {
  try {
    const { nombre, precio, duracion } = req.body;

    await serviciosModel.editarServicio(
      req.params.id,
      nombre,
      precio,
      duracion
    );

    res.json({ mensaje: "Servicio actualizado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al actualizar servicio" });
  }
});

// ELIMINAR SERVICIO
router.delete('/servicios/:id', async (req, res) => {
  try {
    await serviciosModel.eliminarServicio(req.params.id);

    res.json({ mensaje: "Servicio eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al eliminar servicio" });
  }
});

module.exports = router;