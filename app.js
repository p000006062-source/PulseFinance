// 1. Atrapamos todos los elementos de nuestra interfaz
const elementoPrecio = document.getElementById('precio-btc');
const elementoCambio = document.getElementById('cambio-24h');
const botonActualizar = document.getElementById('btn-actualizar');
const selectorMoneda = document.getElementById('selector-moneda'); // NUESTRO NUEVO MENÚ
let graficaBitcoin;

// 2. Función para obtener el precio
async function obtenerPrecio() {
    try {
        // Leemos qué moneda está seleccionada en el menú en este momento
        const moneda = selectorMoneda.value; 
        
        // Usamos comillas invertidas (`) para meter la variable ${moneda} en el enlace
        const respuesta = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${moneda}&vs_currencies=usd&include_24hr_change=true`);
        const datos = await respuesta.json();
        
        // Como el nombre cambia (datos.bitcoin, datos.ethereum), usamos corchetes [moneda]
        const precio = datos[moneda].usd;
        const cambio24h = datos[moneda].usd_24h_change;
        
        elementoPrecio.innerText = "$" + precio + " USD";
        
        const cambioRedondeado = cambio24h.toFixed(2);
        if (cambio24h > 0) {
            elementoCambio.innerText = "+" + cambioRedondeado + "% (24h)";
            elementoCambio.className = "positivo"; 
        } else {
            elementoCambio.innerText = cambioRedondeado + "% (24h)";
            elementoCambio.className = "negativo"; 
        }
        
    } catch (error) {
        // En lugar de un precio, mostramos una advertencia
        elementoPrecio.innerText = "⚠️ Límite alcanzado";
        
        // Cambiamos el porcentaje por un mensaje de espera y lo pintamos rojo
        elementoCambio.innerText = "Espera 1 minuto por favor...";
        elementoCambio.className = "negativo"; 
        
        console.error("Hubo un problema:", error);
    }
}

// 3. Función para dibujar la gráfica
async function dibujarGraficaReal() {
    try {
        const moneda = selectorMoneda.value; // Leemos la moneda nuevamente
        
        // Alteramos el enlace de la gráfica con la variable ${moneda}
        const respuesta = await fetch(`https://api.coingecko.com/api/v3/coins/${moneda}/market_chart?vs_currency=usd&days=7`);
        const datos = await respuesta.json();

        const preciosReales = datos.prices.map(item => item[1]); 
        const fechas = datos.prices.map(item => {
            const fechaReal = new Date(item[0]);
            return fechaReal.toLocaleDateString();
        });

        const lienzo = document.getElementById('miGrafica').getContext('2d');
        
        if (graficaBitcoin) {
            graficaBitcoin.destroy();
        }

        // Ponemos la primera letra en mayúscula para el título de la gráfica
        const nombreMayuscula = moneda.charAt(0).toUpperCase() + moneda.slice(1);

        graficaBitcoin = new Chart(lienzo, {
            type: 'line',
            data: {
                labels: fechas,
                datasets: [{
                    label: `Historial ${nombreMayuscula} (7 días)`,
                    data: preciosReales,
                    borderColor: '#00ff7f',
                    backgroundColor: 'rgba(0, 255, 127, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { labels: { color: '#ffffff' } } },
                scales: {
                    y: { ticks: { color: '#888888' }, grid: { color: '#333333' } },
                    x: { ticks: { color: '#888888', maxTicksLimit: 7 }, grid: { color: 'transparent' } } 
                }
            }
        });

    } catch (error) {
        if (graficaBitcoin) {
            graficaBitcoin.destroy();
        }
        
        const lienzoContexto = document.getElementById('miGrafica');
        const lienzo = lienzoContexto.getContext('2d');
        
        // Calculamos el centro exacto
        const centroX = lienzoContexto.width / 2;
        const centroY = lienzoContexto.height / 2;

        lienzo.font = "14px Arial"; // Letra un poco más pequeña
        lienzo.fillStyle = "#ff3b3b";
        lienzo.textAlign = "center";
        
        // Ponemos un texto más corto justo en el centro
        lienzo.fillText("⚠️ Gráfica en pausa (límite)", centroX, centroY);

        console.error("Hubo un error cargando el historial:", error);
        
    }
}

// --- EVENTOS (Las órdenes de cuándo ejecutar las cosas) ---

// Al dar clic en el botón azul
botonActualizar.addEventListener('click', () => {
    obtenerPrecio();
    dibujarGraficaReal();
});

// ¡NUEVO! Al cambiar de opción en el menú desplegable
selectorMoneda.addEventListener('change', () => {
    // Ponemos texto de carga temporal mientras viaja a internet
    elementoPrecio.innerText = "Cargando...";
    elementoCambio.innerText = "...";
    
    // Ejecutamos las funciones con la nueva moneda
    obtenerPrecio();
    dibujarGraficaReal();
});

// Al abrir la página por primera vez
obtenerPrecio();
dibujarGraficaReal();

// Temporizador automático: Actualiza la moneda elegida cada 30 segundos
setInterval(() => {
    obtenerPrecio();
    dibujarGraficaReal();
    console.log("Actualización automática ejecutada 🔄"); 
}, 30000);