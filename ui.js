// ui.js - Quantum Alpha PRO v22 | Ultimate Edition

/**
 * Actualiza la pista visual de triángulos (A/B)
 */
function updateSymbols() {
    const symbolsTrack = document.getElementById('symbols-track');
    if (!symbolsTrack) return;

    if (sequence.length === 0) {
        symbolsTrack.innerHTML = '<span style="color: var(--text-dim); font-size: 11px;">ESPERANDO DATOS DEL SENSOR...</span>';
        return;
    }

    // Muestra los últimos 14 movimientos
    symbolsTrack.innerHTML = sequence.slice(-14).map(s => 
        `<span style="color:${s.val === 'A' ? 'var(--up-neon)' : 'var(--down-neon)'}; 
        font-size:16px; font-weight:bold; margin: 0 2px;">${s.val === 'A' ? '▲' : '▼'}</span>`
    ).join('');
}

/**
 * UI ANALYTICS + IA ADVISOR SYSTEM
 * Esta función es llamada por analyze() en ai.js
 */
function updateAnalyticUI(noise, power, ms, recent, majorTrend) {
    const term = document.getElementById('main-terminal');
    const iaLogic = document.getElementById('ia-logic');
    const iaStake = document.getElementById('ia-stake');
    const statusMsg = document.getElementById('op-status'); 
    
    // 1. Actualizar Marcadores de Telemetría (Header)
    const noiseEl = document.getElementById('noise-index');
    const powerEl = document.getElementById('power-index');
    const speedEl = document.getElementById('speed-meter');

    if(noiseEl) noiseEl.innerText = `NOISE: ${Math.round(noise)}%`;
    if(powerEl) powerEl.innerText = `POWER: ${power.toFixed(1)}`;
    if(speedEl) speedEl.innerText = `MS: ${ms === 0 ? '--' : ms}`;

    // --- LÓGICA DEL ASESOR DE IA ---
    let advice = "ESCANEANDO FLUJO...";
    let adviceColor = "var(--text-dim)";
    perfectFlow = false;

    if (noise > 50) {
        advice = "⚠️ RUIDO CRÍTICO: NO OPERAR";
        adviceColor = "#ff2e63"; 
    } 
    else if (noise < 20 && Math.abs(power) < 4 && ms > 700) {
        advice = "🐢 MERCADO LENTO: MODALIDAD FLEX";
        adviceColor = "#8957e5"; 
    }
    else if (majorTrend !== "NEUTRAL" && Math.abs(power) > 5) {
        advice = `📈 FUERZA ${majorTrend}: USAR TREND`;
        adviceColor = "#4a90e2";
    }
    else if (noise < 15 && sequence.length > 5) {
        advice = "💎 FLUJO PERFECTO: ALTA PRECISIÓN";
        adviceColor = "var(--up-neon)";
        perfectFlow = true;
    }

    if(statusMsg) {
        statusMsg.innerText = advice;
        statusMsg.style.color = adviceColor;
    }

    // 2. Inyectar Tendencia Mayor en el status
    if (typeof trendFilterMode !== 'undefined' && trendFilterMode && majorTrend && majorTrend !== "NEUTRAL" && statusMsg) {
        const trendIcon = majorTrend === "BULLISH" ? "↗️" : "↘️";
        const trendColor = majorTrend === "BULLISH" ? "var(--up-neon)" : "var(--down-neon)";
        statusMsg.innerHTML = `<span style="color:${trendColor}">${trendIcon} ${majorTrend}</span> | ${advice}`;
    }

    // 3. Reporte de IA Neural (Footer info)
    const totalOps = tradeHistory.length; // Definido fuera para usarlo en el bloqueo del botón

    if (iaLogic && iaStake) {
        const probPct = Math.round(lastNeuralPrediction * 100);

        if (totalOps < 10) {
            iaLogic.innerHTML = `<span style="color:var(--text-dim)">IA APRENDIENDO... (${10 - totalOps} ops restantes)</span>`;
            iaStake.innerText = "ESPERANDO ENTRENAMIENTO";
        } else {
            let colorIA = "#8957e5"; 
            if (probPct > 80) colorIA = "var(--up-neon)";
            if (probPct < 20) colorIA = "var(--down-neon)";

            iaLogic.innerHTML = `NEURAL: <span style="color:${colorIA}">${probPct}% CONFIANZA</span>`;
            iaStake.innerText = (probPct > 75 || probPct < 25) ? "SUGERENCIA: STAKE ALTO" : "SUGERENCIA: ESPERAR";
        }
    }

    // --- BLOQUE DE SEGURIDAD: CONTROL DEL BOTÓN AUTÓNOMO ---
    const autoBtn = document.getElementById('autoPilotBtn');
    if (autoBtn) {
        if (totalOps < 10) {
            autoBtn.disabled = true;
            autoBtn.style.opacity = "0.5";
            autoBtn.style.cursor = "not-allowed";
            autoBtn.innerText = `AUTÓNOMO BLOQUEADO (${10 - totalOps})`;
        } else {
            autoBtn.disabled = false;
            autoBtn.style.opacity = "1";
            autoBtn.style.cursor = "pointer";
            // Solo actualiza el texto si el modo no está activo para no interrumpir visualmente
            if (typeof autoPilotMode !== 'undefined' && !autoPilotMode) {
                autoBtn.innerText = "MODO AUTÓNOMO (READY)";
            }
        }
    }

    // 4. Efectos Visuales de Feedback en el Terminal
    if (term && recent && recent.length > 0) {
        const lastVal = recent[recent.length-1]?.val;
        term.classList.remove('high-noise-heart-red', 'high-noise-heart-green');
        if (noise > 30) {
            term.classList.add(lastVal === 'A' ? 'high-noise-heart-green' : 'high-noise-heart-red');
        }
    }
}

/**
 * Resetea los textos de la UI
 */
function resetUI(total) {
    const statusMsg = document.getElementById('op-status');
    if(statusMsg) {
        statusMsg.innerText = total ? "SISTEMA STANDBY" : "ESPERANDO SEÑAL";
    }

    // Forzar el estado "apagado" de los botones de feedback
    const winBtn = document.getElementById('winBtn');
    const lossBtn = document.getElementById('lossBtn');
    
    if (winBtn && lossBtn) {
        // Quitamos la clase de brillo
        winBtn.classList.remove('active');
        lossBtn.classList.remove('active');
        
        // Aplicamos opacidad baja y gris para que se vea claramente que están inactivos
        winBtn.style.opacity = "0.3";
        winBtn.style.filter = "grayscale(1)";
        lossBtn.style.opacity = "0.3";
        lossBtn.style.filter = "grayscale(1)";
        
        // Deshabilitamos el click para evitar registros dobles
        winBtn.disabled = true;
        lossBtn.disabled = true;
    }

    const timerText = document.getElementById('timer-text');
    if(timerText) timerText.innerText = "00";
}

