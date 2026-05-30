export const Gamification = {
    state: {
        points: 0,
        level: 1,
        currentStreak: 0,
        highestStreak: 0,
        lastActiveDate: null,
        badges: []
    },

    levels: [
        { level: 1, name: "Talib", minPoints: 0 },
        { level: 2, name: "Mujahid", minPoints: 100 },
        { level: 3, name: "Mumin", minPoints: 300 },
        { level: 4, name: "Muhsin", minPoints: 600 },
        { level: 5, name: "Siddiq", minPoints: 1000 },
        { level: 6, name: "Wali", minPoints: 1500 },
        { level: 7, name: "Mahdi", minPoints: 2500 }
    ],

    init() {
        this.loadState();
        this.checkStreak();
        this.renderUI();
        
        // Listen to points events
        window.addEventListener('barakah:addPoints', (e) => {
            this.addPoints(e.detail.amount, e.detail.reason, e.detail.eventObj);
        });
    },

    loadState() {
        const saved = localStorage.getItem('barakah_user_stats');
        if (saved) {
            try {
                this.state = { ...this.state, ...JSON.parse(saved) };
            } catch (e) {
                console.error("Error parsing user_stats", e);
            }
        }
    },

    saveState() {
        localStorage.setItem('barakah_user_stats', JSON.stringify(this.state));
        if (window.DbSync) {
            window.DbSync.syncToCloud('user_stats', this.state);
        }
        this.renderUI();
    },

    checkStreak() {
        const today = new Date().toISOString().split('T')[0];
        if (!this.state.lastActiveDate) {
            this.state.lastActiveDate = today;
            this.state.currentStreak = 1;
        } else if (this.state.lastActiveDate !== today) {
            const lastDate = new Date(this.state.lastActiveDate);
            const currentDate = new Date(today);
            const diffTime = Math.abs(currentDate - lastDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            if (diffDays === 1) {
                this.state.currentStreak += 1;
                if (this.state.currentStreak > this.state.highestStreak) {
                    this.state.highestStreak = this.state.currentStreak;
                }
            } else if (diffDays > 1) {
                this.state.currentStreak = 1; // reset streak
            }
            this.state.lastActiveDate = today;
        }
        this.saveState();
    },

    addPoints(amount, reason, eventObj) {
        this.state.points += amount;
        
        // Show floating animation if event obj is passed (like mouse event or bounding client rect)
        if (eventObj) {
            this.showFloatingAnimation(amount, eventObj);
        }

        this.checkLevelUp();
        this.saveState();
    },

    checkLevelUp() {
        let newLevel = 1;
        for (let i = this.levels.length - 1; i >= 0; i--) {
            if (this.state.points >= this.levels[i].minPoints) {
                newLevel = this.levels[i].level;
                break;
            }
        }

        if (newLevel > this.state.level) {
            this.state.level = newLevel;
            this.showLevelUpNotification();
        }
    },

    getCurrentLevelInfo() {
        const current = this.levels.find(l => l.level === this.state.level) || this.levels[0];
        const next = this.levels.find(l => l.level === this.state.level + 1);
        
        return {
            current,
            next,
            progressPercent: next ? Math.min(100, Math.max(0, ((this.state.points - current.minPoints) / (next.minPoints - current.minPoints)) * 100)) : 100
        };
    },

    renderUI() {
        const levelInfo = this.getCurrentLevelInfo();
        const progressEl = document.getElementById('barakah-progress-bar');
        const levelNameEl = document.getElementById('barakah-level-name');
        const pointsEl = document.getElementById('barakah-points');
        const streakEl = document.getElementById('barakah-streak');

        if (progressEl) progressEl.style.width = `${levelInfo.progressPercent}%`;
        if (levelNameEl) levelNameEl.textContent = levelInfo.current.name;
        if (pointsEl) pointsEl.textContent = this.state.points;
        if (streakEl) streakEl.textContent = `🔥 ${this.state.currentStreak}`;
    },

    showFloatingAnimation(amount, eventObj) {
        const x = eventObj.clientX || eventObj.x || window.innerWidth / 2;
        const y = eventObj.clientY || eventObj.y || window.innerHeight / 2;

        const floatEl = document.createElement('div');
        floatEl.className = 'fixed text-emerald-500 font-bold pointer-events-none z-50 text-xl animate-float-up shadow-glow';
        floatEl.textContent = `+${amount} 🏆`;
        floatEl.style.left = `${x}px`;
        floatEl.style.top = `${y}px`;

        document.body.appendChild(floatEl);

        setTimeout(() => {
            floatEl.remove();
        }, 1500);
    },

    showLevelUpNotification() {
        const levelInfo = this.getCurrentLevelInfo();
        // Fallback to simple alert if custom modal is not present
        const customAlert = document.getElementById('gamification-modal');
        if (customAlert) {
            document.getElementById('gamification-modal-title').textContent = "МашаАллах! Level Up!";
            document.getElementById('gamification-modal-desc').textContent = `Вы достигли уровня ${levelInfo.current.name}!`;
            customAlert.showModal();
        } else {
            console.log(`Level Up! You are now ${levelInfo.current.name}`);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Gamification.init();
});
