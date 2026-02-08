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
 * MOTOR DE ANÁLISIS PRINCIPAL - Quantum Alpha PRO v22
 */
// 1. FORZAR el cálculo de tendencia antes de cualquier otra cosa
    const majorTrend = getMajorTrend(); 
    
    // 2. Obtener el ruido y otros indicadores
    const noiseIndex = AICore.calculateNoise();
    // ... resto de tu lógica de ruido ...

    // 3. Aplicar el filtro en la condición de disparo (Signal Trigger)
    if (streak >= rachaReq && noiseIndex <= maxNoise) {
        let trendSafe = true;

        if (trendFilterMode && sequence.length >= 20) {
            // BLOQUEO: Si la señal es 'A' (Compra) pero la tendencia es Bajista, cancelamos.
            if (lastVal === 'A' && majorTrend === "BEARISH") trendSafe = false;
            // BLOQUEO: Si la señal es 'B' (Venta) pero la tendencia es Alcista, cancelamos.
            if (lastVal === 'B' && majorTrend === "BULLISH") trendSafe = false;
        }

        if (trendSafe) {
            triggerSignal(currentSide, power);
        } else {
            console.log("⚠️ SEÑAL BLOQUEADA POR FILTRO DE TENDENCIA:", majorTrend);
        }

    
    const statusMsg = document.getElementById('op-status');
    const logEl = document.getElementById('ia-log'); 

    if (selectedTime === null) {
        if (statusMsg) statusMsg.innerHTML = "<span style='color:var(--down-neon)'>⚠️ SELECCIONE TIEMPO</span>";
        return;
    }

    if (isSignalActive || sequence.length < 3 || signalCooldown) return;
    
    const recent = sequence.slice(-10); 
    const lastPoint = recent[recent.length - 1];
    const lastDiff = lastPoint.diff;
    const seqStr = recent.map(s => s.val).join('');
    
    // --- CÁLCULO DE RUIDO Y POTENCIA ---
    const oscillations = (seqStr.match(/AB|BA/g) || []).length;
    const noiseIndex = Math.round((oscillations / (seqStr.length - 1)) * 100);
    
    let rawPower = sequence.slice(-20).reduce((acc, s) => {
        let weight = 800 / Math.max(s.diff, 50); 
        return s.val === 'A' ? acc + weight : acc - weight;
    }, 0);
    
    const power = Math.max(-10, Math.min(10, rawPower));
    const majorTrend = getMajorTrend();

    // --- ESCUDO DE VOLATILIDAD Y LÓGICA DE PILOTO AUTÓNOMO ---
    if (typeof autoPilotMode !== 'undefined' && autoPilotMode) {
        
        // 1. BLOQUEO POR PÁNICO (Ruido Extremo)
        if (typeof volatilityShield !== 'undefined' && noiseIndex > volatilityShield.panicStop) {
            if(logEl) logEl.innerHTML = `<span style="color:var(--down-neon)">⚠️ PÁNICO: RUIDO CRÍTICO (${noiseIndex}%)</span>`;
            if(statusMsg) statusMsg.innerText = "MERCADO ERRÁTICO - ESPERANDO";
            return; // Detiene el análisis para no dar señales falsas
        }

        // 2. ADAPTACIÓN SEGÚN VOLATILIDAD
        if (noiseIndex < 35 && Math.abs(power) > 4.5) {
            riskLevel = 1; 
            flexMode = true; 
            if(logEl) logEl.innerText = "IA: FLUJO ÓPTIMO - MODO AGRESIVO (N1)";
        } 
        else if (noiseIndex >= 35 && noiseIndex <= 45) {
            riskLevel = 2; 
            flexMode = false; 
            if(logEl) logEl.innerText = "IA: EVALUANDO RIESGO - EQUILIBRADO (N2)";
        } 
        // 3. AUTO-SNIPER (Escudo de Volatilidad Activo)
        else if (noiseIndex > 45 || (typeof volatilityShield !== 'undefined' && noiseIndex > volatilityShield.criticalNoise)) {
            riskLevel = 3; 
            flexMode = false;
            adaptiveVolatility = true; 
            if(logEl) logEl.innerHTML = `<span style="color:#00ff88">🛡️ ESCUDO ACTIVO: SNIPER (N3)</span>`;
        }

        trendFilterMode = (Math.abs(power) > 3.0); 
        confluenceMode = (sequence.length >= 25); 
        
        if (tradeHistory.length >= 10 && noiseIndex > 45) {
            neuralMode = true;
        }

        if(typeof refreshVisualButtons === 'function') refreshVisualButtons();
    }

    // --- CÁLCULO NEURAL (PROCESO ORIGINAL) ---
    let neuralPrediction = 0.5;
    try {
        if (typeof NeuralCore !== 'undefined' && NeuralCore.model && neuralMode) {
            const currentData = [Math.min(lastDiff/2000, 1), lastPoint.val === 'A' ? 1 : 0, noiseIndex/100, Math.abs(power)/10];
            neuralPrediction = await NeuralCore.getPrediction(currentData);
            lastData = currentData; 
        }
    } catch (e) { }

    checkDynamicControls(); 
    if(typeof updateAnalyticUI === 'function') updateAnalyticUI(noiseIndex, power, lastDiff, recent, majorTrend);

    const currentDNA = sequence.slice(-4).map(s => s.val).join('');
    const dnaConfidence = (typeof AICore !== 'undefined') ? AICore.getConfidence(currentDNA) : 0;
    const lastVal = lastPoint.val;
    const currentSide = lastVal === 'A' ? "COMPRA" : "VENTA";
    const isAccelerated = recent.slice(-3).every(s => s.val === lastVal && s.diff < 400);

    // --- LÓGICA DE DISPARO (MANTENIENDO CONFLUENCIA Y RACHA) ---
    if (riskLevel === null) {
        let streak = 0;
        for (let i = recent.length - 1; i >= 0; i--) {
            if (recent[i].val === lastVal) streak++; else break;
        }
        if (streak >= 2 && noiseIndex < 70 && Math.abs(power) > 2) {
            triggerSignal(currentSide, power);
            return;
        }
    } else {
        if (confluenceMode && sequence.length >= 20) {
            const score = getConfluenceScore(neuralPrediction, dnaConfidence, majorTrend, currentSide, isAccelerated);
            let scoreRequerido = riskLevel === 1 ? 4 : (riskLevel === 2 ? 6 : 7);

            if (score >= scoreRequerido) {
                triggerSignal(currentSide, score);
                return;
            }
        }

        let rachaReq = config.racha[riskLevel] || 3;
        if (riskLevel === 1) rachaReq = flexMode ? 2 : 3;

        let maxNoise = (config.ruido[riskLevel] || 60) + (flexMode ? 15 : 0);
        let streak = 0;
        for (let i = recent.length - 1; i >= 0; i--) {
            if (recent[i].val === lastVal) streak++; else break;
        }

        if (streak >= rachaReq && noiseIndex <= maxNoise) {
            let trendSafe = true;
            if (trendFilterMode && sequence.length >= 20) {
                if (lastVal === 'A' && majorTrend === "BEARISH") trendSafe = false;
                if (lastVal === 'B' && majorTrend === "BULLISH") trendSafe = false;
            }
            if (trendSafe) triggerSignal(currentSide, power);
        }
    }
}

/**
 * PUENTE DE COMUNICACIÓN CON MAIN.JS
 * Esta función ya no ejecuta el timer aquí, lo delega al main.js
 */
function triggerSignal(side, strength) {
    if (typeof window.triggerSignal === 'function') {
        window.triggerSignal(side, strength);
    }
}

/**
 * Limpia el estado de la señal para permitir nuevos análisis
 */
function finishSignal() {
    isSignalActive = false;
    signalCooldown = true;
    document.body.classList.remove('signal-active');
    
    if(typeof resetUI === 'function') resetUI(false);
    
    // Cooldown de 3 segundos para evitar señales falsas inmediatas
    setTimeout(() => { 
        signalCooldown = false; 
    }, 3000);
}