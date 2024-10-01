const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json()); // Para parsear el cuerpo JSON

const SECRET = process.env.WOMPI_EVENT_KEY

app.post('/webhook', (req, res) => {
    const event = req.body;
    const properties = event.signature.properties;
    const timestamp = event.timestamp;

    // Paso 1: Concatenar valores de propiedades
    const concatenatedProperties = properties.map(prop => event.data.transaction[prop]).join('');
    
    // Paso 2: Concatenar el timestamp
    const stringToHash = concatenatedProperties + timestamp + SECRET;
    
    // Paso 3: Generar el checksum
    const generatedChecksum = crypto.createHash('sha256').update(stringToHash).digest('hex');
    
    // Paso 4: Comparar el checksum
    const receivedChecksum = req.headers['x-event-checksum'] || event.signature.checksum;

    if (generatedChecksum === receivedChecksum) {
        // Validar y procesar la transacción
        console.log('Evento válido:', event);
        // Lógica para procesar la transacción aquí
        res.status(200).send('Evento recibido y verificado');
    } else {
        console.log('Evento inválido:', event);
        res.status(403).send('Evento no autorizado');
    }
});



