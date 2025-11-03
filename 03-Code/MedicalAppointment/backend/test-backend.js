const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

// Ruta de prueba simple
app.get('/test', (req, res) => {
    res.json({ message: 'Backend funcionando correctamente' });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor de prueba corriendo en http://localhost:${PORT}`);
    console.log('Para probar, abre en el navegador: http://localhost:3000/test');
});