const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const clientesController = require('./controllers/clientesController');

const app = express();

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

app.use(clientesController);

app.listen(3001, '0.0.0.0', () => {
 console.log("Microservicio clientes corriendo en red (3001)");
});