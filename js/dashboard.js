/**
 * SustainTrack - Dashboard Controller
 * Calculates score metrics, displays achievements, and dynamically renders gorgeous SVG charts.
 */

class DashboardController {
    constructor() {
        this.activeCategory = 'carbon'; // carbon, electricity, water, waste
    }

    init() {
        this.renderAll();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Toggle filters on dashboard chart
        const filters = document.querySelectorAll('.dash-chart-filter .btn');
        filters.forEach(btn => {
            btn.addEventListener('click', () => {
                filters.forEach(f => f.classList.remove('active'));
                btn.classList.add('active');
                this.activeCategory = btn.dataset.category;
                this.renderWeeklyChart();
            });
        });
    }

    renderAll() {
        this.renderStats();
        this.renderRings();
        this.renderWeeklyChart();
        this.renderBadges();
        this.renderRecentLogs();
    }

    /* =====================================================
       STATS / ECO SCORE
    ===================================================== */
    renderStats() {
        const nowStr    = new Date().toISOString().split('T')[0];
        const today     = window.dataStore.getTotalsForDate(nowStr);
        const weeklyAvg = window.dataStore.getWeeklyAverages();
        const targets   = DAILY_TARGETS;

        // --- Sustainability Score (0–100) ---
        const elecDev  = Math.max(0, (weeklyAvg.electricity - targets.electricity) / targets.electricity);
        const waterDev = Math.max(0, (weeklyAvg.water       - targets.water)       / targets.water);
        const wasteDev = Math.max(0, (weeklyAvg.waste       - targets.waste)       / targets.waste);
        const carbonDev= Math.max(0, (weeklyAvg.carbon      - targets.carbon)      / targets.carbon);

        let score = 100;
        score -= Math.min(25, elecDev  * 25);
        score -= Math.min(25, waterDev * 25);
        score -= Math.min(25, wasteDev * 25);
        score -= Math.min(25, carbonDev* 25);
        score = Math.max(10, Math.round(score));
        this.sustainabilityScore = score;

        // --- Score Ring ---
        const scoreEl = document.getElementById('sustainability-score');
        if (scoreEl) scoreEl.textContent = score;

        const scoreRing = document.getElementById('score-ring-circle');
        if (scoreRing) {
            const circum = 2 * Math.PI * 54; // r=54
            scoreRing.style.strokeDasharray  = `${circum} ${circum}`;
            scoreRing.style.strokeDashoffset = circum - (score / 100) * circum;

            // Dynamic ring color
            if (score > 80) scoreRing.style.stroke = 'var(--emerald)';
            else if (score > 55) scoreRing.style.stroke = 'var(--cyan)';
            else if (score > 35) scoreRing.style.stroke = 'var(--yellow)';
            else scoreRing.style.stroke = 'var(--orange)';
        }

        // --- Status label ---
        let statusMsg   = 'Eco Novice';
        let statusColor = 'var(--orange)';
        if (score > 85)      { statusMsg = 'Eco Champion';       statusColor = 'var(--emerald)'; }
        else if (score > 65) { statusMsg = 'Sustainable Citizen'; statusColor = 'var(--cyan)'; }
        else if (score > 45) { statusMsg = 'Green Learner';       statusColor = 'var(--yellow)'; }

        const statusEl = document.getElementById('sustainability-status');
        if (statusEl) { statusEl.textContent = statusMsg; statusEl.style.color = statusColor; }

        // --- Metric Cards ---
        document.getElementById('dash-carbon-today').textContent  = today.carbon.toFixed(1)          + ' kg';
        document.getElementById('dash-carbon-weekly').textContent = weeklyAvg.carbon.toFixed(1)       + ' kg/day';

        document.getElementById('dash-cost-today').textContent    = '$' + today.cost.toFixed(2);
        document.getElementById('dash-cost-weekly').textContent   = '$' + (weeklyAvg.cost * 7).toFixed(2) + '/wk';

        document.getElementById('dash-water-today').textContent   = Math.round(today.water)           + ' L';
        document.getElementById('dash-water-weekly').textContent  = Math.round(weeklyAvg.water)        + ' L/day';

        document.getElementById('dash-elec-today').textContent    = today.electricity.toFixed(1)       + ' kWh';
        document.getElementById('dash-elec-weekly').textContent   = weeklyAvg.electricity.toFixed(1)   + ' kWh/day';
    }

    /* =====================================================
       RESOURCE EFFICIENCY RINGS
    ===================================================== */
    renderRings() {
        const weekly  = window.dataStore.getWeeklyAverages();
        const targets = DAILY_TARGETS;

        const setRing = (circleId, textId, value, target) => {
            const circle = document.getElementById(circleId);
            const text   = document.getElementById(textId);
            if (!circle || !text) return;

            const pct    = Math.min(100, Math.round((value / target) * 100));
            const circum = 2 * Math.PI * 36; // r=36
            circle.style.strokeDasharray  = `${circum} ${circum}`;
            circle.style.strokeDashoffset = circum - (pct / 100) * circum;

            if (value > target * 1.2) circle.style.stroke = 'var(--orange)';
            else if (value <= target) circle.style.stroke = 'var(--emerald)';
            else                      circle.style.stroke = 'var(--yellow)';

            text.textContent = `${pct}%`;
        };

        setRing('ring-elec-circle',  'ring-elec-text',  weekly.electricity, targets.electricity);
        setRing('ring-water-circle', 'ring-water-text', weekly.water,       targets.water);
        setRing('ring-waste-circle', 'ring-waste-text', weekly.waste,       targets.waste);
    }

    /* =====================================================
       WEEKLY SVG CHART
    ===================================================== */
    renderWeeklyChart() {
        const container = document.getElementById('dashboard-chart-container');
        if (!container) return;

        const now    = new Date();
        const days   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dates  = [];
        const labels = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            dates.push(d.toISOString().split('T')[0]);
            labels.push(days[d.getDay()]);
        }

        const cat = this.activeCategory;
        const dataset = dates.map(date => {
            const t = window.dataStore.getTotalsForDate(date);
            return cat === 'electricity' ? t.electricity
                :  cat === 'water'       ? t.water
                :  cat === 'waste'       ? t.waste
                :  t.carbon;
        });

        const colorMap = {
            electricity: 'var(--yellow)',
            water:       'var(--cyan)',
            waste:       'var(--orange)',
            carbon:      'var(--emerald)'
        };
        const color  = colorMap[cat] || 'var(--emerald)';
        const maxVal = Math.max(...dataset, 1);

        const height     = 180;
        const width      = container.clientWidth || 500;
        const pad        = 36;
        const gH         = height - pad * 2;
        const gW         = width  - pad * 2;
        const colWidth   = gW / dataset.length;

        let svg = `<svg viewBox="0 0 ${width} ${height}" class="custom-chart-svg" style="width:100%;height:${height}px;">`;

        // Grid lines + Y-axis labels
        for (let i = 0; i <= 4; i++) {
            const y        = pad + (gH / 4) * i;
            const labelVal = (maxVal - (maxVal / 4) * i).toFixed(1);
            svg += `
                <line x1="${pad}" y1="${y}" x2="${width - pad}" y2="${y}"
                      stroke="rgba(255,255,255,0.05)" stroke-dasharray="4"/>
                <text x="${pad - 6}" y="${y + 4}" fill="rgba(255,255,255,0.35)"
                      font-size="9" text-anchor="end">${labelVal}</text>`;
        }

        // Compute data points
        const points = dataset.map((val, i) => {
            const x = pad + i * colWidth + colWidth / 2;
            const y = pad + gH - (val / maxVal) * gH;
            return { x, y, val };
        });

        // Filled area
        const areaPoints = [
            `${points[0].x},${pad + gH}`,
            ...points.map(p => `${p.x},${p.y}`),
            `${points[points.length - 1].x},${pad + gH}`
        ].join(' ');

        const gradId = `cg_${cat}`;
        svg += `
            <defs>
                <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stop-color="${color}" stop-opacity="0.35"/>
                    <stop offset="100%" stop-color="${color}" stop-opacity="0.02"/>
                </linearGradient>
            </defs>
            <polygon points="${areaPoints}" fill="url(#${gradId})"/>
            <polyline points="${points.map(p => `${p.x},${p.y}`).join(' ')}"
                      fill="none" stroke="${color}" stroke-width="2.5"
                      stroke-linecap="round" stroke-linejoin="round"/>`;

        // Dots + labels
        points.forEach((p, i) => {
            svg += `
                <circle cx="${p.x}" cy="${p.y}" r="4.5"
                        fill="var(--bg-dark)" stroke="${color}" stroke-width="2.5" class="chart-dot"/>
                <text x="${p.x}" y="${p.y - 10}" fill="rgba(255,255,255,0.8)"
                      font-size="9" text-anchor="middle" font-weight="700">${p.val.toFixed(1)}</text>
                <text x="${p.x}" y="${height - 8}" fill="rgba(255,255,255,0.45)"
                      font-size="11" text-anchor="middle">${labels[i]}</text>`;
        });

        svg += `</svg>`;
        container.innerHTML = svg;
    }

    /* =====================================================
       BADGES / ACHIEVEMENTS
    ===================================================== */
    renderBadges() {
        const badgeGrid = document.getElementById('dashboard-badges-grid');
        if (!badgeGrid) return;

        const habits       = window.dataStore.getHabits();
        const completedRecs= window.dataStore.getCompletedRecommendations();
        const weekly       = window.dataStore.getWeeklyAverages();

        // --- XP / Level ---
        const habitXP  = habits.length * 15;
        const recXP    = completedRecs.length * 50;
        const scoreXP  = (this.sustainabilityScore || 0) > 80 ? 100 : 0;
        const totalXP  = habitXP + recXP + scoreXP;
        const level    = Math.max(1, Math.floor(totalXP / 100));
        const xpToNext = 100 - (totalXP % 100);

        const lvlEl = document.getElementById('sidebar-profile-level');
        if (lvlEl) lvlEl.textContent = `Sustainer Lv. ${level}`;

        // --- Streak calculation ---
        const uniqueDates  = [...new Set(habits.map(h => h.date))].sort();
        let currentStreak  = 0;
        let activeCheck    = new Date();
        for (let i = 0; i < 60; i++) {
            const ds = activeCheck.toISOString().split('T')[0];
            if (uniqueDates.includes(ds)) {
                currentStreak++;
                activeCheck.setDate(activeCheck.getDate() - 1);
            } else { break; }
        }

        // --- Long streak ---
        let maxStreak  = 0;
        let running    = 0;
        for (let i = 0; i < uniqueDates.length; i++) {
            if (i === 0) { running = 1; continue; }
            const prev = new Date(uniqueDates[i - 1]);
            const curr = new Date(uniqueDates[i]);
            const diff = (curr - prev) / (1000 * 60 * 60 * 24);
            running = diff === 1 ? running + 1 : 1;
            maxStreak = Math.max(maxStreak, running);
        }

        // --- Count logs by category ---
        const logsByCategory = {};
        habits.forEach(h => { logsByCategory[h.category] = (logsByCategory[h.category] || 0) + 1; });

        // --- Badge definitions ---
        const badges = [
            {
                id:     'starter',
                title:  'Eco Beginner',
                desc:   'Logged your first sustainability habit.',
                icon:   '🌱',
                color:  'var(--emerald)',
                earned: habits.length > 0
            },
            {
                id:     'streak-3',
                title:  'Clean Route',
                desc:   'Logged habits for 3 consecutive days.',
                icon:   '🔥',
                color:  'var(--orange)',
                earned: currentStreak >= 3
            },
            {
                id:     'streak-7',
                title:  'Weekly Warrior',
                desc:   'Maintained a 7-day logging streak.',
                icon:   '⚡',
                color:  'var(--yellow)',
                earned: currentStreak >= 7
            },
            {
                id:     'water-warden',
                title:  'Water Warden',
                desc:   'Completed a water-saving recommendation.',
                icon:   '💧',
                color:  'var(--cyan)',
                earned: completedRecs.some(r => r.includes('water') || r.includes('shower'))
            },
            {
                id:     'carbon-cutter',
                title:  'Carbon Cutter',
                desc:   'Kept daily emissions below the 8.0 kg target.',
                icon:   '🌿',
                color:  'var(--emerald)',
                earned: habits.length > 0 && habits.some(h => {
                    const t = window.dataStore.getTotalsForDate(h.date);
                    return t.carbon > 0 && t.carbon <= DAILY_TARGETS.carbon;
                })
            },
            {
                id:     'commuter',
                title:  'Green Commuter',
                desc:   'Logged 10+ eco-friendly transport trips.',
                icon:   '🚲',
                color:  'var(--accent)',
                earned: (logsByCategory['transport'] || 0) >= 10
            },
            {
                id:     'action-hero',
                title:  'Action Hero',
                desc:   'Committed to 3 or more Action Hub recommendations.',
                icon:   '🏆',
                color:  'var(--yellow)',
                earned: completedRecs.length >= 3
            },
            {
                id:     'power-saver',
                title:  'Power Saver',
                desc:   'Weekly average electricity below the 10 kWh/day target.',
                icon:   '💡',
                color:  'var(--yellow)',
                earned: habits.length > 0 && weekly.electricity > 0 && weekly.electricity < DAILY_TARGETS.electricity
            }
        ];

        // --- Render badges ---
        badgeGrid.innerHTML = badges.map(badge => `
            <div class="badge-card ${badge.earned ? 'unlocked' : 'locked'}">
                <div class="badge-icon" style="${badge.earned ? `filter:drop-shadow(0 0 6px ${badge.color})` : ''}">${badge.icon}</div>
                <div class="badge-info">
                    <h4>${badge.title}</h4>
                    <p>${badge.desc}</p>
                    <span class="badge-status" style="${badge.earned ? `color:${badge.color}` : ''}">
                        ${badge.earned ? '✓ Unlocked' : 'Locked'}
                    </span>
                </div>
            </div>`).join('');

        // --- XP progress bar (inject if missing) ---
        this._renderXPBar(totalXP, level, xpToNext);
    }

    _renderXPBar(totalXP, level, xpToNext) {
        // Inject XP bar under badges if not present
        let xpBar = document.getElementById('dashboard-xp-bar');
        if (!xpBar) {
            const badgesCard = document.querySelector('.badges-card');
            if (!badgesCard) return;
            xpBar = document.createElement('div');
            xpBar.id = 'dashboard-xp-bar';
            xpBar.className = 'dashboard-xp-bar';
            badgesCard.appendChild(xpBar);
        }
        const xpProgress = totalXP % 100;
        xpBar.innerHTML = `
            <div class="xp-bar-row">
                <span class="xp-label">Level ${level} — ${totalXP} XP total</span>
                <span class="xp-next">${xpToNext} XP to next level</span>
            </div>
            <div class="xp-track">
                <div class="xp-fill" style="width:${xpProgress}%"></div>
            </div>`;
    }

    /* =====================================================
       RECENT LOGS (Dashboard)
    ===================================================== */
    renderRecentLogs() {
        const list = document.getElementById('recent-logs-list');
        if (!list) return;

        const sortedLogs = [...window.dataStore.getHabits()]
            .sort((a, b) => {
                if (a.date !== b.date) return b.date.localeCompare(a.date);
                return b.id.localeCompare(a.id);
            })
            .slice(0, 5);

        if (sortedLogs.length === 0) {
            list.innerHTML = `<li class="empty-log-state">No habit logs yet. Go to "Track Habits" to start logging!</li>`;
            return;
        }

        const catIcon  = c => ({ electricity: '⚡', water: '💧', waste: '🗑️', transport: '🚗' }[c] || '📋');
        const catColor = c => ({ electricity: 'var(--yellow)', water: 'var(--cyan)', waste: 'var(--orange)', transport: 'var(--emerald)' }[c] || '#fff');
        const unitOf   = c => ({ electricity: 'kWh', water: 'L', waste: 'kg', transport: 'mi' }[c] || '');

        list.innerHTML = sortedLogs.map(log => {
            const co2 = window.dataStore.calculateCarbon(log.category, log.amount, log.type).toFixed(2);
            return `
                <li class="log-item">
                    <span class="log-cat-icon"
                          style="background:rgba(255,255,255,0.04);border:1px solid ${catColor(log.category)}">
                        ${catIcon(log.category)}
                    </span>
                    <div class="log-details">
                        <span class="log-desc">${log.description || log.category}</span>
                        <span class="log-date">${log.date} &bull; ${log.amount} ${unitOf(log.category)}</span>
                    </div>
                    <div class="log-impact positive">
                        <span>${co2} kg CO₂</span>
                    </div>
                    <button class="delete-log-btn" data-id="${log.id}" title="Remove entry">&times;</button>
                </li>`;
        }).join('');

        // Wire delete buttons
        list.querySelectorAll('.delete-log-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                window.dataStore.deleteHabit(btn.dataset.id);
                this.renderAll();
                if (window.appController) window.appController.onDataChanged();
            });
        });
    }
}

window.dashboardController = new DashboardController();