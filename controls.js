// controls.js - Quantum Alpha PRO v22 | Ultimate Edition

// --- VARIABLES DE ESTADO AUTÓNOMO ---
let autoPilotMode = false;

// --- MANEJO DE RADAR Y MOUSE ---
function toggleMouse() {
    mouseEnabled = !mouseEnabled;
    
    // Iniciar audio en la primera interacción
    if(typeof AudioEngine !== 'undefined') AudioEngine.init();

    const overlay = document.getElementById('mouse-overlay');
    const btn = document.getElementById('mouseBtn');
    const touchZone = document.getElementById('manual-touch-zone');

    if (mouseEnabled) {
        overlay.classList.add('active-radar');
        btn.classList.add('radar-on');
        btn.innerText = "SENSOR ACTIVO";
        if(touchZone) touchZone.style.display = "grid";
    } else {
        overlay.classList.remove('active-radar');
        btn.classList.remove('radar-on');
        btn.innerText = "INICIAR SENSOR RADAR";
        if(touchZone) touchZone.style.display = "none";
        resetUI(true); 
    }
    
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
    if (selectedTime === null || riskLevel === null) {
        const statusMsg = document.getElementById('op-status');
        if(statusMsg) {
            statusMsg.innerHTML = "<span style='color:#ff2e63'>⚠️ SELECCIONE TIEMPO</span>";
        }
        if(typeof AudioEngine !== 'undefined') AudioEngine.play("CLICK"); 
        return; 
    }

    if (!mouseEnabled || isSignalActive || signalCooldown) return;

    const now = Date.now();
    const diff = (lastClickTime === 0) ? 0 : now - lastClickTime;
    if (diff > 0 && diff < 40) return;

    lastClickTime = now;

    if(typeof AudioEngine !== 'undefined') AudioEngine.play("CLICK");

    sequence.push({ val, diff });
    if (sequence.length > 30) sequence.shift(); 

    const lastPoint = chartData[chartData.length - 1];
    chartData.push(val === 'A' ? lastPoint + 5 : lastPoint - 5);
    if (chartData.length > 40) chartData.shift();

    if(typeof drawChart === 'function') drawChart();
    if(typeof updateSymbols === 'function') updateSymbols();
    
    // Ejecutar el cerebro de la IA
    if(typeof analyze === 'function') analyze();
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