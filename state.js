// state.js - Quantum Alpha PRO v22 | Ultimate Edition
let volatilitySpike = false;      // Detecta si el movimiento fue demasiado rápido
let crashRecoveryMode = false;    // Estado de alerta tras una caída brusca
let lastCrashImpact = 0;          // Magnitud de la última caída detectada
// Añadir al inicio de state.js

// Añadir al inicio de state.js
let detailedLogs = JSON.parse(localStorage.getItem('quantum_detailed_logs')) || [];
let hourlyStats = {}; // Guardará éxito por hora

let maxLossLimit = 1; // Puedes cambiarlo a 1 o 2 según prefieras
let consecutiveLosses = 0; 
let lastTrendAtLoss = "NEUTRAL"; // Para detectar cambios bruscos
let mouseEnabled = false;
let flexMode = false;
let neuralMode = true; 
let trendFilterMode = true; // Control del Filtro de Tendencia Mayor
let sequence = [];
let tradeHistory = JSON.parse(localStorage.getItem('tradeHistory')) || [];
let lastClickTime = 0;

// MEJORA: Valores por defecto operativos para evitar el "00" en el timer
let riskLevel = 3;        // Por defecto Nivel 3 (Sniper)
let selectedTime = 30;    // Por defecto 30 Segundos
let isSignalActive = false;
let signalCooldown = false;
let countdownInterval = null;
let perfectFlow = false;
let chartData = Array(40).fill(40);
let lastNeuralPrediction = 0.5; 

// --- NUEVAS VARIABLES DE ESTADO PROFESIONAL ---
let confluenceMode = true;       // Modo de validación múltiple
let adaptiveVolatility = true;   // Ajuste dinámico por desviación estándar
let momentumPressure = 0;        // Presión de compra/venta detectada
let zScorePower = 0;             // Normalización estadística de la fuerza

const config = {
    racha: { 1: 3, 2: 4, 3: 5 },
    ruido: { 1: 65, 2: 55, 3: 45 }
};

// --- CORE IA ORIGINAL (Adaptación 100% Fiel al Código Antiguo) ---
const AICore = {
    patterns: JSON.parse(localStorage.getItem('ia_patterns')) || {},
    weights: { noiseStrictness: 0 },

    getConfidence(dna) {
        if (!this.patterns[dna]) return 0;
        const p = this.patterns[dna];
        return p.total > 0 ? (p.wins / p.total) : 0;
    },

    calibrate(win) {
        this.weights.noiseStrictness = win ? 
            Math.max(-10, this.weights.noiseStrictness - 2) : 
            Math.min(15, this.weights.noiseStrictness + 4);
            
        if(!win && sequence.length >= 4) {
            const dna = sequence.slice(-4).map(s => s.val).join('');
            if(this.patterns[dna]) {
                this.patterns[dna].total += 1; 
                this.save();
            }
        }
    },

    learn() {
        if (sequence.length < 4) return;
        const dna = sequence.slice(-4).map(s => s.val).join('');
        if (!this.patterns[dna]) {
            this.patterns[dna] = { wins: 0, total: 0 };
        }
        this.patterns[dna].wins += 1;
        this.patterns[dna].total += 1;
        this.save();
    },

    save() {
        localStorage.setItem('ia_patterns', JSON.stringify(this.patterns));
    }
};

// --- CORE NEURAL (TensorFlow.js) ---
const NeuralCore = {
    model: null,
    async init() {
        if (this.model) return;
        try {
            this.model = tf.sequential();
            this.model.add(tf.layers.dense({units: 12, inputShape: [4], activation: 'relu'}));
            this.model.add(tf.layers.dense({units: 1, activation: 'sigmoid'}));
            this.model.compile({optimizer: tf.train.adam(0.01), loss: 'binaryCrossentropy'});
            console.log("Neural Core Initialized");
        } catch(e) { console.error("TF Init Error", e); }
    },
    async getPrediction(data) {
        if(!this.model) await this.init();
        try {
            const input = tf.tensor2d([data]);
            const pred = this.model.predict(input);
            const result = (await pred.data())[0];
            lastNeuralPrediction = result; 
            return result;
        } catch(e) { return 0.5; }
    },
    async train(data, win) {
        if(!this.model) await this.init();
        try {
            const input = tf.tensor2d([data]);
            const label = tf.tensor2d([[win ? 1 : 0]]);
            await this.model.fit(input, label, {epochs: 2});
        } catch(e) { console.error("Training Error", e); }
    }
};

// --- PERSISTENCIA DE CONFIGURACIÓN ---
function saveConfig() {
    localStorage.setItem('quantum_config', JSON.stringify({
        time: selectedTime, 
        risk: riskLevel, 
        flex: flexMode,
        neural: neuralMode,
        trend: trendFilterMode,
        confluence: confluenceMode,      
        adaptive: adaptiveVolatility     
    }));
}

function loadConfig() {
    const saved = JSON.parse(localStorage.getItem('quantum_config'));
    
    if(saved) {
        // 1. Carga con Fallbacks robustos (Evita NaN o Null)
        selectedTime = parseInt(saved.time) || 30;
        riskLevel = parseInt(saved.risk) || 3;
        flexMode = !!saved.flex; // Fuerza booleano
        
        // Uso de nullish coalescing o undefined check para booleanos
        neuralMode = saved.neural !== undefined ? saved.neural : true; 
        trendFilterMode = saved.trend !== undefined ? saved.trend : true;
        confluenceMode = saved.confluence !== undefined ? saved.confluence : true;
        adaptiveVolatility = saved.adaptive !== undefined ? saved.adaptive : true;
    } else {
        // 2. Valores por defecto (Estado inicial limpio)
        selectedTime = 30; 
        riskLevel = 3;    
        flexMode = false;
        neuralMode = true;
        trendFilterMode = true;
        confluenceMode = true;
        adaptiveVolatility = true;
    }

    // --- CORRECCIÓN CRÍTICA ---
    // Sincroniza los botones de la pantalla con los datos cargados
    if (typeof refreshVisualButtons === 'function') {
        // Usamos un pequeño delay para asegurar que el DOM esté listo
        setTimeout(refreshVisualButtons, 100);
    }
}


// Función para obtener la hora actual formateada
function getCurrentHour() {
    return new Date().getHours();
}