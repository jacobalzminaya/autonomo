// --- ORQUESTADOR PRINCIPAL ---
window.addEventListener('DOMContentLoaded', () => {
    loadConfig();
    initCanvas(); 
    
    // UI Inicial: Carga de historial
    const hSaved = localStorage.getItem('tradeHistory');
    if(hSaved) { 
        tradeHistory = JSON.parse(hSaved); 
        updateStats(); 
    }

    // --- BLOQUE DE SEGURIDAD DINÁMICA ---
    if (tradeHistory.length < 10) {
        neuralMode = false; 
        saveConfig(); 
    }

    // Sincronización visual de botones de configuración
    document.getElementById(`t${selectedTime}`)?.classList.add('active');
    document.getElementById(`r${riskLevel}`)?.classList.add('active');
    
    if(flexMode) document.getElementById('flexBtn')?.classList.add('active');
    
    if(trendFilterMode) {
        const tBtn = document.getElementById('trendBtn');
        if(tBtn) tBtn.classList.add('active');
    }

    const nBtn = document.getElementById('neuralBtn');
    if(nBtn) {
        if(neuralMode) {
            nBtn.classList.add('active');
            nBtn.style.background = 'rgba(137, 87, 229, 0.4)';
        } else {
            nBtn.classList.remove('active');
            nBtn.style.background = 'rgba(137, 87, 229, 0.1)';
        }
    }

    drawChart();
    updateSymbols();
});

function initCanvas() {
    const canvas = document.getElementById('flow-chart');
    if(!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.getContext('2d').scale(dpr, dpr);
}

// main.js - Orquestador Único del Tiempo
function triggerSignal(side, strength) {
    if (isSignalActive) return;
    isSignalActive = true;
    signalCooldown = true;

    const statusMsg = document.getElementById('op-status');
    const timerEl = document.getElementById('op-timer');
    const bigIcon = document.getElementById('big-icon');
    const timerBar = document.getElementById('timer-bar');

    // Efectos Visuales
    if(statusMsg) {
        statusMsg.innerHTML = `<span style="color:${side === 'COMPRA' ? 'var(--up-neon)' : 'var(--down-neon)'}; font-weight:bold;">${side} DETECTADA</span>`;
    }

    if(bigIcon) {
        bigIcon.innerText = side === 'COMPRA' ? "▲" : "▼";
        bigIcon.style.color = side === 'COMPRA' ? "var(--up-neon)" : "var(--down-neon)";
        bigIcon.style.display = "flex";
        document.body.classList.add('signal-active');
    }

    if(typeof AudioEngine !== 'undefined') AudioEngine.play(side);

    // --- SINCRONIZACIÓN TOTAL (NÚMERO + BARRA) ---
    let count = parseInt(selectedTime) || 30;
    
    // Animamos la barra CSS
    if(timerBar) {
        timerBar.style.transition = "none";
        timerBar.style.width = "100%";
        setTimeout(() => {
            timerBar.style.transition = `width ${count}s linear`;
            timerBar.style.width = "0%";
        }, 50);
    }

    // Iniciamos el contador numérico
    if (countdownInterval) clearInterval(countdownInterval); 
    if(timerEl) timerEl.innerText = count < 10 ? "0" + count : count;
    
    countdownInterval = setInterval(() => {
        count--;
        if(timerEl) timerEl.innerText = count < 10 ? "0" + count : count;
        
        if(count <= 0) {
            clearInterval(countdownInterval);
            // resetUI(false) limpia la señal y habilita el radar de nuevo
            resetUI(false);
        }
    }, 1000);
}

/**
 * LÓGICA DE CONTADOR CORREGIDA
 */
function startCountdown() {
    const timerBar = document.getElementById('timer-bar');
    const timerEl = document.getElementById('op-timer'); // Elemento de texto para el tiempo
    
    // 1. Animación de la barra
    if(timerBar) {
        timerBar.style.transition = "none";
        timerBar.style.width = "100%";
        setTimeout(() => {
            timerBar.style.transition = `width ${selectedTime}s linear`;
            timerBar.style.width = "0%";
        }, 50);
    }

    // 2. Lógica del cronómetro numérico
    let timeLeft = parseInt(selectedTime) || 30;
    
    // Mostrar tiempo inicial
    if(timerEl) timerEl.innerText = timeLeft < 10 ? "0" + timeLeft : timeLeft;

    if(countdownInterval) clearInterval(countdownInterval);
    
    countdownInterval = setInterval(() => {
        timeLeft--;
        
        // Actualizar texto cada segundo
        if(timerEl) {
            timerEl.innerText = timeLeft < 10 ? "0" + timeLeft : timeLeft;
        }

        if (timeLeft <= 0) { 
            clearInterval(countdownInterval); 
            // Pequeño delay para que el usuario vea el "00" antes de resetear
            setTimeout(() => resetUI(false), 300);
        }
    }, 1000);
}

function resetUI(fullReset = true) {
    if (countdownInterval) clearInterval(countdownInterval);
    isSignalActive = false;
    signalCooldown = false;
    
    const terminal = document.getElementById('main-terminal');
    if(terminal) terminal.classList.remove('signal-active', 'border-up', 'border-down');
    
    const bigIcon = document.getElementById('big-icon');
    if(bigIcon) bigIcon.style.display = "none";
    
    const statusMsg = document.getElementById('op-status');
    if(statusMsg) {
        statusMsg.innerText = "SYSTEM IDLE";
        statusMsg.className = "";
    }

    const btn = document.getElementById('mouseBtn');
    if(btn) btn.disabled = false;

    // Resetear contador visual a 00
    const timerEl = document.getElementById('op-timer');
    if(timerEl) timerEl.innerText = "00";

    if(fullReset) {
        sequence = [];
        chartData = Array(40).fill(40);
        if(typeof drawChart === 'function') drawChart();
        if(typeof updateSymbols === 'function') updateSymbols();
    }
}

async function logResult(win) {
    const currentTrend = typeof getMajorTrend === 'function' ? getMajorTrend() : "NEUTRAL";
    
    // Capturamos el ruido actual para el reporte de seguridad
    const noiseEl = document.getElementById('noise-index');
    const currentNoise = noiseEl ? parseInt(noiseEl.innerText) : 0;

    if (win) {
        // Si ganamos, reseteamos el contador de pérdidas
        consecutiveLosses = 0; 
        
        if (neuralMode && typeof NeuralCore !== 'undefined' && lastData) {
            await NeuralCore.train(lastData, win);
        }
    } else {
        // Si perdemos, aumentamos el contador
        consecutiveLosses++;

        // En la primera pérdida, guardamos qué tendencia había para comparar después
        if (consecutiveLosses === 1) {
            lastTrendAtLoss = currentTrend;
        }

        // --- LÓGICA DE AUTO-APAGADO (Circuit Breaker + Escudo de Volatilidad) ---
        // Se apaga si: llega al límite de pérdidas O si pierde una sola vez con ruido crítico
        const isPanicNoise = typeof volatilityShield !== 'undefined' && currentNoise > volatilityShield.criticalNoise;
        
        if (consecutiveLosses >= maxLossLimit || (autoPilotMode && isPanicNoise)) {
            autoPilotMode = false; // Apagamos el motor autónomo
            
            // Actualizamos visualmente el botón del piloto automático
            const autoBtn = document.getElementById('autoPilotBtn');
            if (autoBtn) {
                autoBtn.classList.remove('active');
                autoBtn.style.background = ""; // Reset al color original
                autoBtn.innerText = "MODO AUTÓNOMO (OFF)";
            }

            // Detectamos el motivo exacto del apagado
            let reason = `Se alcanzó el límite de ${maxLossLimit} pérdidas seguidas.`;
            
            if (isPanicNoise) {
                reason = `RUIDO CRÍTICO DETECTADO (${currentNoise}%). El mercado está demasiado inestable para operar en automático.`;
            } else if (lastTrendAtLoss !== currentTrend) {
                reason = `CAMBIO DE TENDENCIA DETECTADO (${lastTrendAtLoss} ➔ ${currentTrend}). El mercado se volvió errático.`;
            }

            // Notificación crítica al usuario
            setTimeout(() => {
                alert("⚠️ ESCUDO DE SEGURIDAD ACTIVADO\n\n" + 
                      "Motivo: " + reason + "\n\n" +
                      "ACCION SUGERIDA: Espera a que el Noise Index baje de 40% antes de reactivar.");
            }, 500);
            
            console.warn("Seguridad: Modo Autónomo desactivado por volatilidad o límite de pérdidas.");
        }
    }

    if (typeof AICore !== 'undefined') {
        AICore.calibrate(win);
        if(win) AICore.learn();
    }
    
    tradeHistory.push(win);
    if(tradeHistory.length > 50) tradeHistory.shift(); 
    localStorage.setItem('tradeHistory', JSON.stringify(tradeHistory));
    
    updateStats();
    resetUI(false);
}

function updateStats() {
    const wins = tradeHistory.filter(x => x).length;
    const total = tradeHistory.length;
    const totalEl = document.getElementById('stat-total');
    const winRateEl = document.getElementById('stat-winrate');
    
    if(totalEl) totalEl.innerText = total;
    if(winRateEl) winRateEl.innerText = total > 0 ? Math.round((wins/total)*100) + "%" : "0%";
}

const radarOverlay = document.getElementById('mouse-overlay');
if(radarOverlay) {
    radarOverlay.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (e.button === 0) registerInput('A');
        else if (e.button === 2) registerInput('B');
    });
    
    radarOverlay.addEventListener('contextmenu', e => e.preventDefault());
    
    radarOverlay.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) e.preventDefault();
    }, { passive: false });
}