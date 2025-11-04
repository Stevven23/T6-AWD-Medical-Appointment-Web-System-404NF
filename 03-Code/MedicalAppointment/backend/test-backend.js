const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

// Ruta de prueba simple
app.get('/test', (req, res) => {
    res.json({ message: 'Backend funcionando correctamente' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📝 Prueba la API en http://localhost:${PORT}/api/test`);
});
