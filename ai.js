// ai.js - Quantum Alpha PRO v22 | Ultimate Edition
let lastData = null;

/**
 * Función para determinar la tendencia mayor (Macro-Flujo)
 */
function getMajorTrend() {
    if (sequence.length < 20) return "NEUTRAL";
    const macro = sequence.slice(-40);
    const ups = macro.filter(s => s.val === 'A').length;
    const ratio = ups / macro.length;
    
    if (ratio >= 0.55) return "BULLISH";
    if (ratio <= 0.45) return "BEARISH";
    return "NEUTRAL";
}

/**
 * Módulo de Confluencia (Puntuación Pro)
 */
function getConfluenceScore(neuralPred, dnaConf, majorTrend, type, isFast) {
    let score = 0;
    if (type === "COMPRA" && neuralPred > 0.80) score += 3;
    if (type === "VENTA" && neuralPred < 0.20) score += 3;
    if (dnaConf > 0.70) score += 2;
    if (type === "COMPRA" && majorTrend === "BULLISH") score += 2;
    if (type === "VENTA" && majorTrend === "BEARISH") score += 2;
    if (isFast) score += 1;
    return score;
}

/**
 * Control visual de botones según datos recolectados
 */
function checkDynamicControls() {
    const totalOps = tradeHistory.length;
    const dataCount = sequence.length;
    const nBtn = document.getElementById('neuralBtn');
    const tBtn = document.getElementById('trendBtn');
    const cBtn = document.getElementById('confluenceBtn');

    if(!nBtn || !tBtn || !cBtn) return;

    const neuralReady = totalOps >= 10;
    nBtn.style.opacity = neuralReady ? "1" : "0.3";
    nBtn.style.pointerEvents = neuralReady ? "auto" : "none";

    const macroReady = dataCount >= 20;
    [tBtn, cBtn].forEach(btn => {
        btn.style.opacity = macroReady ? "1" : "0.3";
        btn.style.pointerEvents = macroReady ? "auto" : "none";
    });
}

/**
 * Detecta si el historial presenta una caída/subida fuera de lo normal
 */
function analyzeMarketCrash() {
    if (sequence.length < 10) return false;

    const recentDiffs = sequence.slice(-5).map(s => s.diff);
    // Calculamos el promedio de velocidad de los últimos 20 datos
    const averageDiff = sequence.slice(-20).reduce((a, b) => a + (b.diff || 500), 0) / 20;
    const currentMovement = recentDiffs[recentDiffs.length - 1];

    // Si el movimiento actual es 3 veces más rápido que el promedio y es un golpe seco (<150ms)
    if (currentMovement < averageDiff / 3 && currentMovement < 150) {
        return true; 
    }
    return false;
}
/**
 * Analiza el rendimiento histórico de la hora actual
 */
function getHourlyAdvice() {
    const hour = new Date().getHours();
    const stats = hourlyStats[hour];
    
    if (!stats || stats.total < 3) return "SIN DATOS HORARIOS";
    
    const winRate = (stats.wins / stats.total) * 100;
    
    if (winRate >= 70) return `HORA EXCELENTE (${winRate.toFixed(0)}% WR)`;
    if (winRate <= 45) return `HORA RIESGOSA (${winRate.toFixed(0)}% WR)`;
    return `HORA ESTABLE (${winRate.toFixed(0)}% WR)`;
}
/**
 * MOTOR DE ANÁLISIS PRINCIPAL - Quantum Alpha PRO v22
 */
async function analyze() {
    const statusMsg = document.getElementById('op-status');
    const logEl = document.getElementById('ia-log'); 

    // 1. Validaciones Iniciales
    if (selectedTime === null) {
        if (statusMsg) statusMsg.innerHTML = "<span style='color:var(--down-neon)'>⚠️ SELECCIONE TIEMPO</span>";
        return;
    }

    // CORRECCIÓN DE SEGURIDAD: Validar que existan datos suficientes para los cálculos posteriores
    if (isSignalActive || sequence.length < 3 || signalCooldown) return;
    
    const recent = sequence.slice(-10); 
    const lastPoint = recent[recent.length - 1];
    const lastDiff = lastPoint.diff;
    const seqStr = recent.map(s => s.val).join('');
    const lastVal = lastPoint.val;
    const currentSide = lastVal === 'A' ? "COMPRA" : "VENTA";
    
    // 2. Cálculos de Mercado e Interpretación de Caídas
    const isCrash = analyzeMarketCrash(); 
    const oscillations = (seqStr.match(/AB|BA/g) || []).length;
    const noiseIndex = Math.round((oscillations / (seqStr.length - 1)) * 100);
    
    // CORRECCIÓN CRÍTICA: Se añade slice() dinámico para evitar errores si sequence < 20
    const powerSample = sequence.slice(-20);
    let rawPower = powerSample.reduce((acc, s) => {
        let weight = 800 / Math.max(s.diff, 50); 
        return s.val === 'A' ? acc + weight : acc - weight;
    }, 0);
    
    // Normalización del poder basada en la muestra real para evitar "fuerza fantasma"
    const power = Math.max(-10, Math.min(10, rawPower));
    const majorTrend = getMajorTrend();

    // --- NUEVO: OBTENER CONSEJO HORARIO ---
    const hourlyAdvice = (typeof getHourlyAdvice === 'function') ? getHourlyAdvice() : "ANALIZANDO HORA...";
    const bestHour = (typeof getBestHour === 'function') ? getBestHour() : "--:--";

    // --- PANEL DE DIAGNÓSTICO VISUAL ---
    let streakCount = 0;
    for (let i = recent.length - 1; i >= 0; i--) {
        if (recent[i].val === lastVal) streakCount++; else break;
    }

    if(logEl) {
        let crashWarning = isCrash ? "<b style='color:yellow'>[!] CAÍDA</b> " : "";
        logEl.innerHTML = `
            <div style="font-size:10px; color:#aaa; background: rgba(0,0,0,0.3); padding: 5px; border-radius: 5px; border-left: 2px solid var(--accent);">
                <div style="margin-bottom:3px">
                    <b style="color:var(--accent)">SCANNER:</b> ${crashWarning}
                    TRD: <span style="color:white">${majorTrend}</span> | 
                    <span style="color:var(--up-neon)">${hourlyAdvice}</span>
                </div>
                <div style="display:flex; justify-content:space-between; opacity:0.8">
                    <span>RACHA: ${streakCount}</span>
                    <span>PWR: ${power.toFixed(1)}</span>
                    <span>NOISE: ${noiseIndex}%</span>
                    <span style="color:var(--f-gold)">TOP: ${bestHour}</span>
                </div>
            </div>
        `;
    }

    // 3. Piloto Autónomo
    if (typeof autoPilotMode !== 'undefined' && autoPilotMode) {
        if (typeof volatilityShield !== 'undefined' && noiseIndex > volatilityShield.panicStop) {
            if(logEl) logEl.innerHTML += `<div style="color:var(--down-neon); font-size:9px">⚠️ PÁNICO: RUIDO CRÍTICO</div>`;
            if(statusMsg) statusMsg.innerText = "MERCADO ERRÁTICO";
            return;
        }

        if (isCrash) {
            riskLevel = 3; flexMode = false;
        } else if (noiseIndex < 35 && Math.abs(power) > 4.5) {
            riskLevel = 1; flexMode = true;
        } else if (noiseIndex > 45) {
            riskLevel = 3; flexMode = false;
        }
        if(typeof refreshVisualButtons === 'function') refreshVisualButtons();
    }

    // 4. Predicción Neural
    let neuralPrediction = 0.5;
    try {
        if (typeof NeuralCore !== 'undefined' && NeuralCore.model && neuralMode) {
            const currentData = [Math.min(lastDiff/2000, 1), lastPoint.val === 'A' ? 1 : 0, noiseIndex/100, Math.abs(power)/10];
            neuralPrediction = await NeuralCore.getPrediction(currentData);
            lastData = currentData; 
        }
    } catch (e) { console.error("Neural Error", e); }

    if (typeof checkDynamicControls === 'function') checkDynamicControls(); 
    if(typeof updateAnalyticUI === 'function') updateAnalyticUI(noiseIndex, power, lastDiff, recent, majorTrend);

    const currentDNA = sequence.slice(-4).map(s => s.val).join('');
    const dnaConfidence = (typeof AICore !== 'undefined') ? AICore.getConfidence(currentDNA) : 0;
    const isAccelerated = recent.slice(-3).every(s => s.val === lastVal && s.diff < 400);

    // 5. LÓGICA DE DISPARO CON FILTROS VISUALES
    if (confluenceMode && sequence.length >= 20) {
        const score = getConfluenceScore(neuralPrediction, dnaConfidence, majorTrend, currentSide, isAccelerated);
        let scoreRequerido = riskLevel === 1 ? 4 : (riskLevel === 2 ? 6 : 7);

        if (isCrash) scoreRequerido++;

        if (score >= scoreRequerido) {
            triggerSignal(currentSide, score);
            return;
        } else {
            if(statusMsg) statusMsg.innerHTML = `<span style="color:#555">PUNTUACIÓN: ${score}/${scoreRequerido}</span>`;
        }
    } else {
        let rachaReq = config.racha[riskLevel] || 3;
        if (riskLevel === 1) rachaReq = flexMode ? 2 : 3;
        if (isCrash) rachaReq++;

        let maxNoise = (config.ruido[riskLevel] || 60) + (flexMode ? 15 : 0);

        if (streakCount >= rachaReq && noiseIndex <= maxNoise) {
            let trendSafe = true;
            if (trendFilterMode && sequence.length >= 20) {
                if (lastVal === 'A' && majorTrend === "BEARISH") trendSafe = false;
                if (lastVal === 'B' && majorTrend === "BULLISH") trendSafe = false;
            }

            if (trendSafe) {
                let pwrLimit = isCrash ? 3.0 : 1.5;
                if (Math.abs(power) > pwrLimit) {
                    triggerSignal(currentSide, power);
                } else {
                    if(statusMsg) statusMsg.innerHTML = `<span style='color:#777'>DÉBIL PARA REBOTE</span>`;
                }
            } else {
                if(statusMsg) statusMsg.innerHTML = `<span style='color:var(--down-neon)'>BLOQUEO TENDENCIA</span>`;
            }
        }
    }
}
/**
 * PUENTE DE COMUNICACIÓN CON MAIN.JS
 */
function triggerSignal(side, strength) {
    if (typeof window.triggerSignal === 'function') {
        window.triggerSignal(side, strength);
    }
}

/**
 * Limpia el estado de la señal
 */
function finishSignal() {
    isSignalActive = false;
    signalCooldown = true;
    document.body.classList.remove('signal-active');
    if(typeof resetUI === 'function') resetUI(false);
    setTimeout(() => { signalCooldown = false; }, 3000);
}
function getAdvancedDiagnostics() {
    const logs = JSON.parse(localStorage.getItem('quantum_detailed_logs')) || [];
    if (logs.length < 5) return "Necesito al menos 5 operaciones para darte un diagnóstico real.";

    // 1. Análisis por Hora
    const hourlySuccess = {};
    // 2. Análisis por Tendencia
    const trendPerformance = { BULLISH: { w:0, t:0 }, BEARISH: { w:0, t:0 }, NEUTRAL: { w:0, t:0 } };
    // 3. Análisis de Ruido
    let avgNoiseWin = 0; let winCount = 0;

    logs.forEach(log => {
        // Horas
        if (!hourlySuccess[log.hour]) hourlySuccess[log.hour] = { w: 0, t: 0 };
        hourlySuccess[log.hour].t++;
        if (log.win) hourlySuccess[log.hour].w++;

        // Tendencias
        if (trendPerformance[log.trend]) {
            trendPerformance[log.trend].t++;
            if (log.win) trendPerformance[log.trend].w++;
        }

        // Ruido
        if (log.win) { avgNoiseWin += log.noise; winCount++; }
    });

    // Encontrar mejor hora
    let bestHour = -1; let maxRate = -1;
    for (let h in hourlySuccess) {
        let rate = hourlySuccess[h].w / hourlySuccess[h].t;
        if (rate > maxRate) { maxRate = rate; bestHour = h; }
    }

    // Encontrar mejor tendencia
    let bestTrend = Object.keys(trendPerformance).reduce((a, b) => 
        (trendPerformance[a].w / (trendPerformance[a].t || 1)) > (trendPerformance[b].w / (trendPerformance[b].t || 1)) ? a : b
    );

    const diagnostic = `
📊 DIAGNÓSTICO MAESTRO V22:
---------------------------
✅ MEJOR HORA: ${bestHour}:00h (Winrate: ${Math.round(maxRate*100)}%)
📈 MEJOR TENDENCIA: ${bestTrend}
📉 RUIDO IDEAL: Menor a ${winCount > 0 ? Math.round(avgNoiseWin/winCount) : 0}%
🔍 PATRÓN RECIENTE: ${logs[logs.length-1].pattern}
    `;
    
    console.log(diagnostic);
    return diagnostic;
}