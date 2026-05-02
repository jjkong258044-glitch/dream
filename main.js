/**
 * Squid Game for Elementary Students
 * Core Game Logic
 */

const game = {
    state: {
        scoreA: 0,
        scoreB: 0,
        currentTeam: null,
        currentRound: 0,
        isGameOver: false,
        r1_progress: 0,
        r1_isLooking: false
    },

    init() {
        console.log("Game Initialized");
        this.updateUI();
    },

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(screenId);
        if (target) {
            target.classList.add('active');
        }
    },

    selectTeam(team) {
        this.state.currentTeam = team;
        this.state.r1_progress = 0;
        document.getElementById('r1-progress').style.width = '0%';
        this.showScreen('screen-round1');
        this.startRound1();
    },

    updateUI() {
        document.getElementById('score-a').textContent = this.state.scoreA;
        document.getElementById('score-b').textContent = this.state.scoreB;
    },

    // Round 1 Logic
    startRound1() {
        this.state.currentRound = 1;
        this.dollLoop();
    },

    dollLoop() {
        if (this.state.currentRound !== 1) return;

        const statusEl = document.getElementById('doll-status');
        this.state.r1_isLooking = false;
        statusEl.textContent = "🙈"; 
        statusEl.classList.remove('shake');

        // TTS: "무궁화 꽃이 피었습니다"
        const msg = new SpeechSynthesisUtterance("무궁화 꽃이 피었습니다");
        msg.lang = 'ko-KR';
        msg.rate = 0.8 + Math.random() * 0.8; // 가변 속도

        msg.onend = () => {
            if (this.state.currentRound !== 1) return;
            this.state.r1_isLooking = true;
            statusEl.textContent = "👀"; 
            statusEl.classList.add('shake');

            // 술래가 뒤돌아보는 시간 (1.5초 ~ 3초)
            setTimeout(() => {
                if (this.state.currentRound !== 1) return;
                this.dollLoop();
            }, 1500 + Math.random() * 1500);
        };

        window.speechSynthesis.speak(msg);
    },

    r1_run() {
        if (this.state.r1_isLooking) {
            window.speechSynthesis.cancel();
            this.gameOver("움직임이 감지되었습니다! 탈락!");
            return;
        }

        this.state.r1_progress += 4;
        if (this.state.r1_progress >= 100) {
            this.state.r1_progress = 100;
            window.speechSynthesis.cancel();
            this.startRound2();
        }
        document.getElementById('r1-progress').style.width = this.state.r1_progress + '%';
    },

    // Round 2: 달고나 떼기
    startRound2() {
        this.state.currentRound = 2;
        this.showScreen('screen-round2');
        
        this.r2_timer = 40;
        this.r2_canvas = document.getElementById('dalgona-canvas');
        this.r2_ctx = this.r2_canvas.getContext('2d');
        this.r2_isDrawing = false;
        this.r2_points = [];
        this.r2_checkpoints = [];
        this.r2_passedCheckpoints = 0;

        this.r2_initCanvas();
        this.r2_startTimer();
    },

    r2_initCanvas() {
        const shapes = ['circle', 'triangle', 'square', 'heart'];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        
        this.r2_ctx.clearRect(0, 0, 400, 400);
        this.r2_ctx.setLineDash([10, 5]);
        this.r2_ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
        this.r2_ctx.lineWidth = 15;
        this.r2_ctx.lineJoin = "round";
        this.r2_ctx.lineCap = "round";

        const path = new Path2D();
        this.r2_checkpoints = [];

        if (shape === 'circle') {
            path.arc(200, 200, 120, 0, Math.PI * 2);
            for(let i=0; i<8; i++) {
                const angle = (i/8) * Math.PI * 2;
                this.r2_checkpoints.push({x: 200 + Math.cos(angle)*120, y: 200 + Math.sin(angle)*120});
            }
        } else if (shape === 'triangle') {
            path.moveTo(200, 80); path.lineTo(320, 300); path.lineTo(80, 300); path.closePath();
            this.r2_checkpoints = [{x:200,y:80}, {x:260,y:190}, {x:320,y:300}, {x:200,y:300}, {x:80,y:300}, {x:140,y:190}];
        } else if (shape === 'square') {
            path.rect(100, 100, 200, 200);
            this.r2_checkpoints = [{x:100,y:100}, {x:300,y:100}, {x:300,y:300}, {x:100,y:300}, {x:200,y:100}, {x:300,y:200}, {x:200,y:300}, {x:100,y:200}];
        } else if (shape === 'heart') {
            path.moveTo(200, 130);
            path.bezierCurveTo(200, 110, 150, 110, 150, 150);
            path.bezierCurveTo(150, 210, 200, 250, 200, 300);
            path.bezierCurveTo(200, 250, 250, 210, 250, 150);
            path.bezierCurveTo(250, 110, 200, 110, 200, 130);
            this.r2_checkpoints = [{x:200,y:130}, {x:150,y:150}, {x:175,y:230}, {x:200,y:300}, {x:225,y:230}, {x:250,y:150}];
        }

        this.r2_shapePath = path;
        this.r2_ctx.stroke(path);

        // Event listeners
        const startDraw = (e) => {
            this.r2_isDrawing = true;
            this.r2_draw(e);
        };
        const endDraw = () => {
            this.r2_isDrawing = false;
            this.r2_ctx.beginPath();
        };

        this.r2_canvas.onmousedown = startDraw;
        this.r2_canvas.ontouchstart = startDraw;
        window.onmouseup = endDraw;
        window.ontouchend = endDraw;
        this.r2_canvas.onmousemove = (e) => this.r2_draw(e);
        this.r2_canvas.ontouchmove = (e) => {
            e.preventDefault();
            this.r2_draw(e.touches[0]);
        };
    },

    r2_draw(e) {
        if (!this.r2_isDrawing) return;

        const rect = this.r2_canvas.getBoundingClientRect();
        const x = (e.clientX || e.pageX) - rect.left;
        const y = (e.clientY || e.pageY) - rect.top;

        // 충돌 감지: 점선 밖으로 나가면 탈락
        this.r2_ctx.lineWidth = 25; // 감지 범위
        if (!this.r2_ctx.isPointInStroke(this.r2_shapePath, x, y)) {
            this.gameOver("달고나가 부서졌습니다! 탈락!");
            this.r2_isDrawing = false;
            return;
        }

        this.r2_ctx.lineWidth = 5;
        this.r2_ctx.setLineDash([]);
        this.r2_ctx.strokeStyle = "red";
        this.r2_ctx.lineTo(x, y);
        this.r2_ctx.stroke();
        this.r2_ctx.beginPath();
        this.r2_ctx.moveTo(x, y);

        // 체크포인트 확인
        this.r2_checkpoints.forEach((cp, index) => {
            if (!cp.passed && Math.hypot(cp.x - x, cp.y - y) < 20) {
                cp.passed = true;
                this.r2_passedCheckpoints++;
            }
        });

        if (this.r2_passedCheckpoints >= this.r2_checkpoints.length) {
            setTimeout(() => this.startRound3(), 500);
        }
    },

    r2_startTimer() {
        const timerEl = document.getElementById('round2-timer');
        this.r2_interval = setInterval(() => {
            if (this.state.currentRound !== 2) {
                clearInterval(this.r2_interval);
                return;
            }
            this.r2_timer--;
            timerEl.textContent = this.r2_timer;
            if (this.r2_timer <= 0) {
                this.gameOver("시간 초과! 탈락!");
                clearInterval(this.r2_interval);
            }
        }, 1000);
    },

    startRound3() {
        clearInterval(this.r2_interval);
        this.state.currentRound = 3;
        this.showScreen('screen-round3');
    },

    selectRope(num) {
        const isSafe = Math.random() > 0.25;
        if (isSafe) {
            this.win();
        } else {
            this.gameOver("썩은 줄을 선택했습니다! 탈락!");
        }
    },

    win() {
        if (this.state.currentTeam === 'A') this.state.scoreA++;
        else if (this.state.currentTeam === 'B') this.state.scoreB++;
        
        this.updateUI();
        document.getElementById('result-title').textContent = "생존!";
        document.getElementById('result-title').style.color = "var(--green)";
        document.getElementById('result-msg').textContent = "축하합니다! 팀 점수가 1점 올랐습니다.";
        this.showScreen('screen-result');
        this.state.currentRound = 0;
    },

    gameOver(msg) {
        document.getElementById('result-title').textContent = "탈락";
        document.getElementById('result-title').style.color = "var(--pink)";
        document.getElementById('result-msg').textContent = msg;
        this.showScreen('screen-result');
        this.state.currentRound = 0;
    }
};

window.onload = () => game.init();
