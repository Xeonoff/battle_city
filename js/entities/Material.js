import { TILE_SIZE } from '../config/constants.js';


export class Material {
    constructor(x, y, type) {
        this.x = x + Math.random() * (TILE_SIZE - 16);
        this.y = y + Math.random() * (TILE_SIZE - 16);
        this.width = 20;
        this.height = 20;
        this.type = type;
        this.isActive = true;
        this.spawnTime = Date.now();
        this.lifetime = 30000;

        this.debris = this._generateDebris();
        this.rotation = Math.random() * Math.PI * 2;
        this.wobbleOffset = Math.random() * Math.PI * 2;
        this.pulseOffset = Math.random() * Math.PI * 2;
    }

    _generateDebris() {
        const count = 3 + Math.floor(Math.random() * 3);
        const pieces = [];
        for (let i = 0; i < count; i++) {
            const vertices = 3 + Math.floor(Math.random() * 3);
            const points = [];
            const centerX = (Math.random() - 0.5) * 10;
            const centerY = (Math.random() - 0.5) * 10;
            const radius = 3.5 + Math.random() * 4;

            for (let v = 0; v < vertices; v++) {
                const angle = (v / vertices) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
                const r = radius * (0.6 + Math.random() * 0.5);
                points.push({
                    x: centerX + Math.cos(angle) * r,
                    y: centerY + Math.sin(angle) * r
                });
            }

            pieces.push({
                points,
                shade: 0.8 + Math.random() * 0.25
            });
        }
        return pieces;
    }

    update(state) {
        if (Date.now() - this.spawnTime > this.lifetime) {
            this.isActive = false;
            return;
        }

        if (state.player && state.player.isActive) {
            const pr = {
                x: state.player.x, y: state.player.y,
                width: state.player.width, height: state.player.height
            };
            const mr = this.getRect();
            if (this._checkCollision(pr, mr)) {
                state.inventory.addMaterial(this.type);
                this.isActive = false;
            }
        }
    }

    getRect() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }

    _checkCollision(r1, r2) {
        return r1.x < r2.x + r2.width && r1.x + r1.width > r2.x &&
               r1.y < r2.y + r2.height && r1.y + r1.height > r2.y;
    }

    draw(ctx) {
        if (!this.isActive) return;

        const remaining = this.lifetime - (Date.now() - this.spawnTime);
        if (remaining < 3000 && Math.floor(Date.now() / 200) % 2 === 0) return;

        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;

        const pulse = Math.sin(Date.now() / 300 + this.pulseOffset) * 0.3 + 0.7;
        const glowColors = {
            brick: { r: 220, g: 120, b: 60 },
            fortified: { r: 180, g: 180, b: 200 },
            steel: { r: 200, g: 210, b: 230 }
        };
        const glow = glowColors[this.type];
        const gradient = ctx.createRadialGradient(cx, cy, 2, cx, cy, 16);
        gradient.addColorStop(0, `rgba(${glow.r}, ${glow.g}, ${glow.b}, ${0.5 * pulse})`);
        gradient.addColorStop(0.5, `rgba(${glow.r}, ${glow.g}, ${glow.b}, ${0.2 * pulse})`);
        gradient.addColorStop(1, `rgba(${glow.r}, ${glow.g}, ${glow.b}, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, 16, 0, Math.PI * 2);
        ctx.fill();

        const wobble = Math.sin(Date.now() / 400 + this.wobbleOffset) * 0.08;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.rotation + wobble);

        const baseColors = {
            brick: {
                main: [205, 110, 50],
                dark: [140, 70, 30],
                light: [235, 150, 90],
                accent: [255, 180, 120]
            },
            fortified: {
                main: [165, 165, 175],
                dark: [105, 105, 115],
                light: [210, 210, 220],
                accent: [235, 235, 245]
            },
            steel: {
                main: [145, 150, 165],
                dark: [80, 85, 95],
                light: [215, 220, 235],
                accent: [240, 245, 255]
            }
        };

        const colors = baseColors[this.type];

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(1.5, 3, 9, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        this.debris.forEach((piece, i) => {
            const colorKeys = ['main', 'dark', 'light', 'accent'];
            const colorKey = colorKeys[i % colorKeys.length];
            const base = colors[colorKey];
            const shade = piece.shade;
            const r = Math.min(255, Math.floor(base[0] * shade));
            const g = Math.min(255, Math.floor(base[1] * shade));
            const b = Math.min(255, Math.floor(base[2] * shade));

            ctx.strokeStyle = `rgba(0, 0, 0, 0.5)`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            piece.points.forEach((p, idx) => {
                if (idx === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            ctx.closePath();
            ctx.stroke();

            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fill();

            ctx.strokeStyle = `rgba(255, 255, 255, 0.3)`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(piece.points[0].x, piece.points[0].y);
            if (piece.points.length > 1) {
                ctx.lineTo(piece.points[1].x, piece.points[1].y);
            }
            ctx.stroke();
        });

        if (this.type === 'brick') {
            ctx.strokeStyle = `rgba(${colors.dark[0]}, ${colors.dark[1]}, ${colors.dark[2]}, 0.9)`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(-4, -1);
            ctx.lineTo(3, 0);
            ctx.stroke();
        } else if (this.type === 'fortified') {
            ctx.strokeStyle = '#2a2a2a';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-5, 2);
            ctx.lineTo(5, 2);
            ctx.stroke();
            ctx.strokeStyle = '#505050';
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(-5, 1.5);
            ctx.lineTo(5, 1.5);
            ctx.stroke();
        } else if (this.type === 'steel') {
            ctx.fillStyle = `rgba(${colors.accent[0]}, ${colors.accent[1]}, ${colors.accent[2]}, 0.9)`;
            ctx.beginPath();
            ctx.arc(-2, -2, 1.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#404050';
            ctx.beginPath();
            ctx.arc(3, 3, 0.9, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}