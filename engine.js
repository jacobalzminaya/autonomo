// engine.js - Quantum Alpha PRO v22 | Ultimate Edition

const AudioEngine = {
    ctx: null,
    init() { 
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); 
    },
    async play(type) {
        this.init();
        if (this.ctx.state === 'suspended') await this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain); 
        gain.connect(this.ctx.destination);

        if(type === "CLICK") {
            osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
            osc.start(); 
            osc.stop(this.ctx.currentTime + 0.03);
        } else {
            // Audio para Señales de COMPRA o VENTA
            osc.frequency.setValueAtTime(type === "COMPRA" ? 880 : 330, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6);
            osc.start(); 
            osc.stop(this.ctx.currentTime + 0.6);
        }
        if(navigator.vibrate) navigator.vibrate(type === "COMPRA" ? [30, 10, 30] : [70]);
    }
};

function drawChart() {
    const canvas = document.getElementById('flow-chart');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // Limpieza de frame respetando el DPR
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    
    // Si el sensor está apagado y no hay datos, no dibujar nada
    if (!mouseEnabled && sequence.length === 0) return;

    // --- CUADRÍCULA DE FONDO ---
    ctx.strokeStyle = 'rgba(74, 144, 226, 0.05)';
    ctx.lineWidth = 1;
    for(let i=0; i < canvas.width/dpr; i += 25) {
        ctx.beginPath(); 
        ctx.moveTo(i, 0); 
        ctx.lineTo(i, canvas.height/dpr); 
        ctx.stroke();
    }

    // --- CONFIGURACIÓN DE LÍNEA DINÁMICA ---
    ctx.beginPath();
    const lastVal = sequence[sequence.length-1]?.val;
    
    if (perfectFlow) {
        ctx.lineWidth = 5;
        ctx.shadowBlur = 15; // EFECTO GLOW ACTIVADO
        ctx.strokeStyle = lastVal === 'A' ? '#00ff88' : '#ff2e63';
        ctx.shadowColor = lastVal === 'A' ? '#00ff88' : '#ff2e63';
    } else {
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#4a90e2'; // Color azul neutro cuando no hay señal activa
    }
    
    // --- DIBUJO DEL TRAZO (Adaptado a la escala del State) ---
    const step = (canvas.width / dpr) / (chartData.length - 1);
    
    chartData.forEach((val, i) => {
        const x = i * step;
        
        /**
         * AJUSTE DE ALTURA:
         * En state.js el gráfico base es 40. 
         * Aquí centramos el valor 40 en la mitad del canvas (height / 2)
         * y multiplicamos la diferencia por 2 para que el movimiento sea visible.
         */
        const centerY = (canvas.height / dpr) / 2;
        const y = centerY - (val - 40) * 3; 
        
        if(i === 0) ctx.moveTo(x, y); 
        else ctx.lineTo(x, y);
    });
    
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset para no afectar otros elementos
}

// Inicialización y Resize dinámico
function initCanvas() {
    const canvas = document.getElementById('flow-chart');
    if(canvas) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.getContext('2d').scale(dpr, dpr);
        drawChart();
    }
}

window.addEventListener('resize', initCanvas);
// Llamada inmediata para asegurar que el canvas tenga tamaño al cargar
setTimeout(initCanvas, 100);