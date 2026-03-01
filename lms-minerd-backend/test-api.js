const axios = require('axios');

async function test() {
    try {
        // Necesitamos interceptar el response de la DB.
        // Haremos la prueba sin JWT asumiendo que el login no importa para el debug del crash
        const res = await axios.get('http://localhost:3000/api/curriculum/carreras');
        console.log("Success:", res.data);
    } catch (err) {
        console.log("Error status:", err.response?.status);
        console.log("Error data:", err.response?.data);
        console.log("Error message:", err.message);
    }
}
test();
