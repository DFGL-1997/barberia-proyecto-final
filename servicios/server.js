const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const serviciosController = require('./controllers/serviciosController');

const app = express();

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

app.use(serviciosController);

app.listen(3002, '0.0.0.0', () => {
 console.log("Microservicio servicios corriendo en red (3002)");
});