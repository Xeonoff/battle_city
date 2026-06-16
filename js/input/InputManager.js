import { DIRECTIONS } from '../config/constants.js';

export class InputManager {
    constructor(state) {
        this.state = state;
        this.keys = {};
        this._bindKeyboard();
        this._bindMobile();
    }

    _bindKeyboard() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ' && this.state.player?.isActive) {
                this.state.player.shoot(this.state);
            }
            if (['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
                e.preventDefault();
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            if (['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
                if (this.state.player) this.state.player.isMoving = false;
            }
        });
    }

    poll() {
        const p = this.state.player;
        if (!p || !p.isActive) return;

        if (this.keys['ArrowUp'] || this.keys['w']) {
            p.direction = DIRECTIONS.UP; p.isMoving = true;
        } else if (this.keys['ArrowRight'] || this.keys['d']) {
            p.direction = DIRECTIONS.RIGHT; p.isMoving = true;
        } else if (this.keys['ArrowDown'] || this.keys['s']) {
            p.direction = DIRECTIONS.DOWN; p.isMoving = true;
        } else if (this.keys['ArrowLeft'] || this.keys['a']) {
            p.direction = DIRECTIONS.LEFT; p.isMoving = true;
        }
    }

    _bindMobile() {
        const joystick = document.querySelector('.joystick');
        const stick = document.querySelector('.joystick-stick');
        const fire = document.querySelector('.fire-button');
        if (!joystick) return;

        let active = false, startX = 0, startY = 0;

        joystick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            active = true;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        joystick.addEventListener('touchmove', (e) => {
            if (!active) return;
            e.preventDefault();
            const t = e.touches[0];
            const dx = t.clientX - startX, dy = t.clientY - startY;
            const d = Math.min(Math.sqrt(dx * dx + dy * dy), 30);
            const a = Math.atan2(dy, dx);
            stick.style.transform =
                `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)`;

            const p = this.state.player;
            if (!p || !p.isActive) return;
            const dz = 10;
            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > dz) { p.direction = DIRECTIONS.RIGHT; p.isMoving = true; }
                else if (dx < -dz) { p.direction = DIRECTIONS.LEFT; p.isMoving = true; }
            } else {
                if (dy > dz) { p.direction = DIRECTIONS.DOWN; p.isMoving = true; }
                else if (dy < -dz) { p.direction = DIRECTIONS.UP; p.isMoving = true; }
            }
        });
        const end = (e) => {
            e.preventDefault();
            active = false;
            stick.style.transform = 'translate(-50%, -50%)';
            if (this.state.player) this.state.player.isMoving = false;
        };
        joystick.addEventListener('touchend', end);
        joystick.addEventListener('touchcancel', end);
        fire.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.state.player?.isActive) this.state.player.shoot(this.state);
        });
    }
}