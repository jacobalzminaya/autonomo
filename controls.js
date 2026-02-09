// controls.js - Quantum Alpha PRO v22 | Ultimate Edition

// --- VARIABLES DE ESTADO AUTÓNOMO ---
let autoPilotMode = false;

// --- MANEJO DE RADAR Y MOUSE ---
function toggleMouse() {
    // 1. Inversión de estado
    mouseEnabled = !mouseEnabled;
    
    // 2. Inicialización de Audio (Solo la primera vez)
    if(typeof AudioEngine !== 'undefined') AudioEngine.init();

    // 3. Referencias del DOM
    const overlay = document.getElementById('mouse-overlay');
    const btn = document.getElementById('mouseBtn');
    const touchZone = document.getElementById('manual-touch-zone'); // Contenedor UP/DOWN

    if (mouseEnabled) {
        // --- ESTADO ACTIVO ---
        if(overlay) overlay.classList.add('active-radar');
        
        if(btn) {
            btn.classList.add('radar-on');
            btn.innerText = "SENSOR ACTIVO";
        }
        
        // MOSTRAR BOTONES UP/DOWN (Añade clase para flex horizontal)
        if(touchZone) {
            touchZone.classList.add('active-radar-ui');
            // Forzamos visibilidad en caso de que el CSS sea restrictivo
            touchZone.style.display = "flex"; 
        }

        console.log("🚀 Radar iniciado: Botones de entrada activados.");

    } else {
        // --- ESTADO INACTIVO ---
        if(overlay) overlay.classList.remove('active-radar');
        
        if(btn) {
            btn.classList.remove('radar-on');
            btn.innerText = "INICIAR SENSOR RADAR";
        }
        
        // OCULTAR BOTONES UP/DOWN
        if(touchZone) {
            touchZone.classList.remove('active-radar-ui');
            touchZone.style.display = "none";
        }
        
        // Limpiar interfaz y señales activas al apagar
        if(typeof resetUI === 'function') resetUI(true); 
    }
    
    // 4. Actualizar visualización de secuencia
    if(typeof updateSymbols === 'function') updateSymbols();
}

// --- FUNCIÓN FLEX (CON AUTO-APAGADO DE NEURAL) ---
function toggleFlex() {
    if (isSignalActive) return; 

    flexMode = !flexMode;
    const fBtn = document.getElementById('flexBtn');
    const nBtn = document.getElementById('neuralBtn');
    
    // SI ACTIVAMOS FLEX, APAGAMOS NEURAL
    if(flexMode) {
        neuralMode = false;
        if(nBtn) {
            nBtn.classList.remove('active');
            nBtn.style.backgroundColor = "transparent";
            nBtn.style.color = "#00f3ff"; // Color cian original
        }
    }

    // Actualización visual de Flex
    if(fBtn) {
        if(flexMode) {
            fBtn.classList.add('active');
            fBtn.style.backgroundColor = "#8957e5";
            fBtn.style.color = "#ffffff";
        } else {
            fBtn.classList.remove('active');
            fBtn.style.backgroundColor = "transparent";
            fBtn.style.color = "#8957e5";
        }
    }

    saveConfig();
    if(typeof AudioEngine !== 'undefined') AudioEngine.play("CLICK");
}

// --- REGISTRO DE ENTRADAS (CLICS/TOUCH) ---
function registerInput(val) {
    // 1. Validación de Configuración con Limpieza Automática
    if (selectedTime === null || riskLevel === null) {
        const statusMsg = document.getElementById('op-status');
        if(statusMsg) {
            statusMsg.innerHTML = "<span style='color:var(--down-neon)'>⚠️ CONFIGURACIÓN PENDIENTE</span>";
        }
        if(typeof AudioEngine !== 'undefined') AudioEngine.play("CLICK"); 
        return; 
    }

    // 2. Filtros de Estado (Radar apagado o Señal en curso)
    if (!mouseEnabled || isSignalActive || (typeof signalCooldown !== 'undefined' && signalCooldown)) return;

    const now = Date.now();
    const diff = (lastClickTime === 0) ? 0 : now - lastClickTime;
    
    // Evitar ruidos de clics demasiado rápidos (menores a 60ms suelen ser errores de hardware)
    if (diff > 0 && diff < 60) return;

    lastClickTime = now;

    if(typeof AudioEngine !== 'undefined') AudioEngine.play("CLICK");

    // 3. Gestión de Memoria de Secuencia
    sequence.push({ val, diff });
    if (sequence.length > 30) sequence.shift(); 

    // 4. Actualización del Gráfico con Límites (Safe-Flow)
    const lastPoint = chartData[chartData.length - 1];
    let nextPoint = val === 'A' ? lastPoint + 5 : lastPoint - 5;
    
    // Mantener el gráfico dentro de un rango visible (entre 10 y 70 para base 40)
    if (nextPoint > 80) nextPoint = 78;
    if (nextPoint < 10) nextPoint = 12;

    chartData.push(nextPoint);
    if (chartData.length > 40) chartData.shift();

    // 5. Orquestación de Actualización
    if(typeof drawChart === 'function') drawChart();
    if(typeof updateSymbols === 'function') updateSymbols();
    
    // Limpiar mensajes de advertencia previos al recibir datos válidos
    const statusMsg = document.getElementById('op-status');
    if(statusMsg && statusMsg.innerText.includes("SELECCIONE")) {
        statusMsg.innerText = "RADAR ESCANEANDO...";
        statusMsg.style.color = "var(--up-neon)";
    }

    // 6. Disparo del Motor IA (Asíncrono)
    if(typeof analyze === 'function') {
        // Usamos un pequeño delay o requestAnimationFrame para no saturar el hilo principal
        setTimeout(analyze, 10);
    }
}

// --- DESHACER ÚLTIMA ENTRADA ---
function undoLastInput(e) {
    if(e) e.preventDefault(); 
    if (sequence.length === 0 || isSignalActive) return;

    sequence.pop();
    chartData = Array(40).fill(40);
    sequence.forEach(s => {
        const lastPoint = chartData[chartData.length - 1];
        chartData.push(s.val === 'A' ? lastPoint + 5 : lastPoint - 5);
    });

    lastClickTime = 0; 
    if(typeof AudioEngine !== 'undefined') AudioEngine.play("CLICK");
    
    if(typeof drawChart === 'function') drawChart();
    if(typeof updateSymbols === 'function') updateSymbols();
    if(typeof analyze === 'function') analyze();
}

// --- CONFIGURACIÓN DE PARÁMETROS ---

function setTime(s, btn) {
    if (isSignalActive) return;
    selectedTime = s;
    const buttons = document.querySelectorAll('#time-group .btn');
    buttons.forEach(b => b.classList.remove('active'));
    
    if(btn) {
        btn.classList.add('active');
    } else {
        document.getElementById(`t${s}`)?.classList.add('active');
    }
    saveConfig();
    if(typeof AudioEngine !== 'undefined') AudioEngine.play("CLICK");
}

function setRisk(r, btn) {
    if (isSignalActive) return;
    riskLevel = r;
    const buttons = document.querySelectorAll('#risk-group .btn');
    buttons.forEach(b => b.classList.remove('active'));
    
    if(btn) {
        btn.classList.add('active');
    } else {
        document.getElementById(`r${r}`)?.classList.add('active');
    }
    saveConfig();
    if(typeof AudioEngine !== 'undefined') AudioEngine.play("CLICK");
}

// --- BOTONES DE MODOS ---

function toggleFlexMode() { 
    toggleFlex();
}

function toggleNeuralMode() { 
    if (isSignalActive) return;
    
    if (tradeHistory.length < 10 && !neuralMode) {
        alert("IA requiere al menos 10 operaciones de entrenamiento.");
        return;
    }
    
    neuralMode = !neuralMode;
    const nBtn = document.getElementById('neuralBtn');
    const fBtn = document.getElementById('flexBtn');

    if(neuralMode) {
        flexMode = false;
        if(fBtn) {
            fBtn.classList.remove('active');
            fBtn.style.backgroundColor = "transparent";
            fBtn.style.color = "#8957e5"; 
        }
    }

    if(nBtn) {
        if(neuralMode) {
            nBtn.classList.add('active');
            nBtn.style.backgroundColor = "#00f3ff";
            nBtn.style.color = "#000000";
        } else {
            nBtn.classList.remove('active');
            nBtn.style.backgroundColor = "transparent";
            nBtn.style.color = "#00f3ff";
        }
    }

    saveConfig();
    if(typeof AudioEngine !== 'undefined') AudioEngine.play("CLICK");
}

function toggleTrendMode() {
    if (isSignalActive) return;
    trendFilterMode = !trendFilterMode;
    const tBtn = document.getElementById('trendBtn');
    if(tBtn) tBtn.classList.toggle('active', trendFilterMode);
    saveConfig();
    if(typeof AudioEngine !== 'undefined') AudioEngine.play("CLICK");
}

function toggleConfluence() {
    if (isSignalActive) return;
    confluenceMode = !confluenceMode;
    const btn = document.getElementById('confluenceBtn');
    if(btn) btn.classList.toggle('active', confluenceMode);
    saveConfig();
    if(typeof AudioEngine !== 'undefined') AudioEngine.play("CLICK");
}

function toggleAdaptive() {
    if (isSignalActive) return;
    adaptiveVolatility = !adaptiveVolatility;
    const btn = document.getElementById('adaptiveBtn');
    if(btn) btn.classList.toggle('active', adaptiveVolatility);
    saveConfig();
    if(typeof AudioEngine !== 'undefined') AudioEngine.play("CLICK");
}

// --- NUEVAS FUNCIONES DE MODO AUTÓNOMO ---

function toggleAutoPilot() {
    if (isSignalActive) return;
    
    autoPilotMode = !autoPilotMode;
    const btn = document.getElementById('autoPilotBtn');
    
    if(btn) {
        if(autoPilotMode) {
            btn.classList.add('active');
            btn.style.boxShadow = "0 0 15px #ff9f43";
            btn.innerText = "PILOTO AUTO: ON";
        } else {
            btn.classList.remove('active');
            btn.style.boxShadow = "none";
            btn.innerText = "MODO AUTÓNOMO";
        }
    }
    saveConfig();
    if(typeof AudioEngine !== 'undefined') AudioEngine.play("CLICK");
}

function refreshVisualButtons() {
    // Refrescar Filtros Principales
    document.getElementById('trendBtn')?.classList.toggle('active', trendFilterMode);
    document.getElementById('flexBtn')?.classList.toggle('active', flexMode);
    document.getElementById('adaptiveBtn')?.classList.toggle('active', adaptiveVolatility);
    document.getElementById('confluenceBtn')?.classList.toggle('active', confluenceMode);
    document.getElementById('neuralBtn')?.classList.toggle('active', neuralMode);

    // Refrescar Niveles de Riesgo (N1, N2, N3)
    for (let i = 1; i <= 3; i++) {
        const rBtn = document.getElementById(`r${i}`);
        if (rBtn) {
            if (riskLevel === i) rBtn.classList.add('active');
            else rBtn.classList.remove('active');
        }
    }
}

// --- ATAJOS DE TECLADO ---
window.addEventListener('keydown', (e) => {
    if (isSignalActive) return;
    if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') registerInput('A');
    if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') registerInput('B');
    if ((e.key.toLowerCase() === 'z') && e.ctrlKey) undoLastInput();
});

// --- LIMPIEZA ---
function clearFullHistory() {
    if (confirm("¿RESET TOTAL?")) {
        localStorage.clear();
        location.reload();
    }
}
function exportHistoryToCSV() {
    if (tradeHistory.length === 0) {
        alert("No hay datos en la sesión actual.");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    // Cabeceras de las columnas para tu análisis
    csvContent += "Fecha,Resultado,Riesgo,Tiempo,Modo_Neural,Modo_Flex,Tendencia,Confluencia,Fuerza_IA\r\n";

    tradeHistory.forEach(trade => {
        const row = [
            new Date(trade.timestamp || Date.now()).toLocaleTimeString(),
            trade.win ? "WIN" : "LOSS",
            trade.riskAtTrade || riskLevel,
            trade.timeAtTrade || selectedTime,
            trade.neuralAtTrade ? "ON" : "OFF",
            trade.flexAtTrade ? "ON" : "OFF",
            trade.trendAtTrade || "N/A",
            trade.confluenceAtTrade ? "ON" : "OFF",
            trade.strength || "0"
        ].join(",");
        csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Quantum_Alpha_Session_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}