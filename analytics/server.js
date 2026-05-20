const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = 3004;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const RESULTADOS_PATH = '/app/spark/resultados.json';

app.get('/analytics', (req, res) => {
  try {
    if (!fs.existsSync(RESULTADOS_PATH)) {
      return res.status(404).json({ mensaje: 'No hay resultados aún. Ejecuta el análisis.' });
    }
    const data = JSON.parse(fs.readFileSync(RESULTADOS_PATH, 'utf8'));
    res.json(data);
  } catch (e) {
    res.status(500).json({ mensaje: 'Error leyendo resultados' });
  }
});

app.get('/analytics/status', (req, res) => {
  const existe = fs.existsSync(RESULTADOS_PATH);
  res.json({ resultados_disponibles: existe });
});

app.listen(PORT, () => {
  console.log(`Microservicio analytics corriendo en puerto ${PORT}`);
});
