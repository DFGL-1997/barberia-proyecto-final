const express = require('express'); //importa express para crear el servidor WEB (API REST)
const morgan = require('morgan'); //importa morgan para logs de peticiones
const cors = require('cors'); //cors para permitir llamadas desde el frontend (OTRO SERVIDOR)

const citasController = require('./controllers/citasController'); //importa el controlador de citas
const citasModel = require('./models/citasModel');

const app = express(); //Crea la aplicación de Express, es decir, el servidor.

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

app.use(citasController);

// 🔥 AUTO-CANCELACIÓN CADA 1 MINUTO
setInterval(() => {
  citasModel.cancelarCitasVencidas();
}, 60000);

app.listen(3003, '0.0.0.0', () => {
 console.log("Microservicio citas corriendo en red (3003)");
});