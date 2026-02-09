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

    // --- BLOQUEO INICIAL DEL BOTÓN AUTÓNOMO ---
    const autoBtn = document.getElementById('autoPilotBtn');
    if (autoBtn) {
        if (tradeHistory.length < 10) {
            autoBtn.disabled = true;
            autoBtn.style.opacity = "0.5";
            autoBtn.style.cursor = "not-allowed";
            autoBtn.innerText = `AUTÓNOMO BLOQUEADO (${10 - tradeHistory.length})`;
        } else {
            autoBtn.disabled = false;
            autoBtn.style.opacity = "1";
            autoBtn.style.cursor = "pointer";
            if (typeof autoPilotMode !== 'undefined' && !autoPilotMode) {
                autoBtn.innerText = "MODO AUTÓNOMO (READY)";
            }
        }
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

    if(typeof drawChart === 'function') drawChart();
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

    if (countdownInterval) clearInterval(countdownInterval); 

    let count = parseInt(selectedTime) || 30;
    
    if(timerBar) {
        timerBar.style.transition = "none";
        timerBar.style.width = "100%";
        void timerBar.offsetWidth; 
        
        setTimeout(() => {
            timerBar.style.transition = `width ${count}s linear`;
            timerBar.style.width = "0%";
        }, 50);
    }

    if(timerEl) timerEl.innerText = count < 10 ? "0" + count : count;
    
    countdownInterval = setInterval(() => {
        count--;
        if(timerEl) timerEl.innerText = count < 10 ? "0" + count : count;
        
        if(count <= 0) {
            clearInterval(countdownInterval);
            if (typeof resetUI === 'function') resetUI(false);
        }
    }, 1000);
}

function resetUI(fullReset = true) {
    if (countdownInterval) clearInterval(countdownInterval);
    isSignalActive = false;
    signalCooldown = false;
    
    const btnWin = document.getElementById('btn-win'); 
    const btnLoss = document.getElementById('btn-loss');
    if(btnWin) btnWin.classList.remove('active');
    if(btnLoss) btnLoss.classList.remove('active');

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
    const now = new Date();
    const currentHour = now.getHours();
    const timestamp = now.getTime();

    const noiseEl = document.getElementById('noise-index');
    const currentNoise = noiseEl ? parseInt(noiseEl.innerText) : 0;

    const lastSequence = sequence.slice(-5).map(s => s.val).join(''); 
    const eventSnapshot = {
        win: win,
        hour: currentHour,
        noise: currentNoise,
        trend: currentTrend,
        pattern: lastSequence,
        timestamp: timestamp
    };

    let detailedLogs = JSON.parse(localStorage.getItem('quantum_detailed_logs')) || [];
    detailedLogs.push(eventSnapshot);
    if(detailedLogs.length > 100) detailedLogs.shift();
    localStorage.setItem('quantum_detailed_logs', JSON.stringify(detailedLogs));

    tradeHistory.push({ win: win, time: timestamp });
    if(tradeHistory.length > 50) tradeHistory.shift(); 
    localStorage.setItem('tradeHistory', JSON.stringify(tradeHistory));

    // Sesión de 30 minutos para el escudo
    const recentTrades = tradeHistory.filter(t => (timestamp - (t.time || 0)) < (30 * 60 * 1000));
    const recentLossesInSession = recentTrades.filter(t => t.win === false).length;

    if (win) {
        consecutiveLosses = 0; 
        if (neuralMode && typeof NeuralCore !== 'undefined' && lastData) {
            await NeuralCore.train(lastData, win);
        }
    } else {
        consecutiveLosses++;
        if (consecutiveLosses === 1) lastTrendAtLoss = currentTrend;

        const isPanicNoise = typeof volatilityShield !== 'undefined' && currentNoise > volatilityShield.criticalNoise;
        
        if (recentLossesInSession >= maxLossLimit || (autoPilotMode && isPanicNoise)) {
            if (autoPilotMode) {
                autoPilotMode = false; 
                const autoBtn = document.getElementById('autoPilotBtn');
                if (autoBtn) {
                    autoBtn.classList.remove('active');
                    autoBtn.style.background = ""; 
                    autoBtn.innerText = "MODO AUTÓNOMO (OFF)";
                }

                let reason = `Se alcanzó el límite de ${maxLossLimit} pérdidas en esta sesión.`;
                if (isPanicNoise) reason = `RUIDO CRÍTICO (${currentNoise}%).`;
                else if (lastTrendAtLoss !== currentTrend) reason = `CAMBIO DE TENDENCIA (${lastTrendAtLoss} ➔ ${currentTrend}).`;

                setTimeout(() => {
                    alert("⚠️ ESCUDO DE SEGURIDAD ACTIVADO\n\n" + 
                          "Motivo: " + reason + "\n\n" +
                          "Análisis IA: A las " + currentHour + ":00h sueles tener mejor rendimiento.");
                }, 500);
            }
        }
    }

    if (typeof AICore !== 'undefined') {
        AICore.calibrate(win);
        if(win) AICore.learn();
    }
    
    updateStats();
    resetUI(false);
    if (typeof updateHourlyIntelligence === 'function') updateHourlyIntelligence();
}

function updateStats() {
    const wins = tradeHistory.filter(x => {
        if (typeof x === 'object' && x !== null) return x.win === true;
        return x === true;
    }).length;

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
        if (isSignalActive || (typeof signalCooldown !== 'undefined' && signalCooldown)) return;
        if (e.button === 0) registerInput('A');
        else if (e.button === 2) registerInput('B');
    });
    
    radarOverlay.addEventListener('contextmenu', e => e.preventDefault());
    
    radarOverlay.addEventListener('touchstart', (e) => {
        if (isSignalActive || (typeof signalCooldown !== 'undefined' && signalCooldown)) {
            e.preventDefault();
            return;
        }
        if (e.touches.length > 1) e.preventDefault();
    }, { passive: false });
}
