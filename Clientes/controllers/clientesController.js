const { Router } = require('express');
const router = Router();
const clientesModel = require('../models/clientesModel');
router.get('/clientes', async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 100;
    const offset = (pagina - 1) * limite;
    const { clientes, total } = await clientesModel.obtenerClientes(limite, offset);
    res.json({ clientes, total, pagina, totalPaginas: Math.ceil(total / limite) });
  } catch {
    res.status(500).json({ mensaje: "Error al obtener clientes" });
  }
});
router.get('/clientes/:id', async (req, res) => {
  try {
    const cliente = await clientesModel.obtenerCliente(req.params.id);
    if (!cliente) return res.status(404).json({ mensaje: "Cliente no encontrado" });
    res.json(cliente);
  } catch {
    res.status(500).json({ mensaje: "Error al consultar cliente" });
  }
});
router.get('/barberos', async (req, res) => {
  try {
    const barberos = await clientesModel.obtenerBarberos();
    res.json(barberos);
  } catch {
    res.status(500).json({ mensaje: "Error al obtener barberos" });
  }
});
router.post('/clientes', async (req, res) => {
  try {
    const { nombre, telefono, email, usuario, password, rol } = req.body;
    await clientesModel.crearCliente(nombre, telefono, email, usuario, password, rol || "cliente");
    res.json({ mensaje: "Cliente creado" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al crear cliente" });
  }
});
router.post('/login', async (req, res) => {
  try {
    const { usuario, password } = req.body;
    const cliente = await clientesModel.validarLogin(usuario, password);
    if (!cliente) return res.status(401).json({ mensaje: "Credenciales incorrectas" });
    res.json({ id: cliente.id, nombre: cliente.nombre, usuario: cliente.usuario, rol: cliente.rol });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en login" });
  }
});
router.put('/clientes/:id', async (req, res) => {
  try {
    const { nombre, telefono, email } = req.body;
    await clientesModel.actualizarCliente(nombre, telefono, email, req.params.id);
    res.json({ mensaje: "Cliente actualizado" });
  } catch {
    res.status(500).json({ mensaje: "Error al actualizar cliente" });
  }
});
router.delete('/clientes/:id', async (req, res) => {
  try {
    await clientesModel.eliminarCliente(req.params.id);
    res.json({ mensaje: "Cliente eliminado" });
  } catch {
    res.status(500).json({ mensaje: "Error al eliminar cliente" });
  }
});
module.exports = router;
