/**
 * SustainTrack - Dashboard Controller
 * Calculates score metrics, displays achievements, and dynamically renders gorgeous SVG charts.
 */

class DashboardController {
    constructor() {
        this.activeCategory = 'all'; // all, electricity, water, waste, transport
    }

    init() {
        this.renderAll();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Toggle filters on dashboard charts
        const filters = document.querySelectorAll('.dash-chart-filter btn');
        filters.forEach(btn => {
            btn.addEventListener('click', (e) => {
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

    renderStats() {
        const nowStr = new Date().toISOString().split('T')[0];
        const today = window.dataStore.getTotalsForDate(nowStr);
        const weeklyAvg = window.dataStore.getWeeklyAverages();
        
        // Sustainability Score (0-100)
        // Calculated based on deviation from daily targets
        let score = 100;
        const targets = DAILY_TARGETS;
        
        const elecDev = Math.max(0, (weeklyAvg.electricity - targets.electricity) / targets.electricity);
        const waterDev = Math.max(0, (weeklyAvg.water - targets.water) / targets.water);
        const wasteDev = Math.max(0, (weeklyAvg.waste - targets.waste) / targets.waste);
        const carbonDev = Math.max(0, (weeklyAvg.carbon - targets.carbon) / targets.carbon);
        
        // Deduct points for exceeding targets (max 25 pts deduction per category)
        score -= Math.min(25, elecDev * 25);
        score -= Math.min(25, waterDev * 25);
        score -= Math.min(25, wasteDev * 25);
        score -= Math.min(25, carbonDev * 25);
        
        score = Math.max(10, Math.round(score));
        
        // Update DOM elements
        const scoreEl = document.getElementById('sustainability-score');
        if (scoreEl) scoreEl.textContent = score;
        
        const scoreRing = document.getElementById('score-ring-circle');
        if (scoreRing) {
            // Circumference of r=54 circle is ~339.29
            const circum = 2 * Math.PI * 54;
            const offset = circum - (score / 100) * circum;
            scoreRing.style.strokeDasharray = `${circum} ${circum}`;
            scoreRing.style.strokeDashoffset = offset;
        }

        // Setup Score Status Message
        let statusMsg = "Eco Novice";
        let statusColor = "var(--yellow)";
        if (score > 85) {
            statusMsg = "Eco Champion";
            statusColor = "var(--emerald)";
        } else if (score > 60) {
            statusMsg = "Sustainable Citizen";
            statusColor = "var(--cyan)";
        }
        
        const statusEl = document.getElementById('sustainability-status');
        if (statusEl) {
            statusEl.textContent = statusMsg;
            statusEl.style.color = statusColor;
        }

        // Textual metrics
        document.getElementById('dash-carbon-today').textContent = today.carbon.toFixed(1) + " kg";
        document.getElementById('dash-carbon-weekly').textContent = weeklyAvg.carbon.toFixed(1) + " kg/day";
        
        document.getElementById('dash-cost-today').textContent = "$" + today.cost.toFixed(2);
        document.getElementById('dash-cost-weekly').textContent = "$" + (weeklyAvg.cost * 7).toFixed(2) + "/wk";
        
        document.getElementById('dash-water-today').textContent = Math.round(today.water) + " L";
        document.getElementById('dash-water-weekly').textContent = Math.round(weeklyAvg.water) + " L/day";
        
        document.getElementById('dash-elec-today').textContent = today.electricity.toFixed(1) + " kWh";
        document.getElementById('dash-elec-weekly').textContent = weeklyAvg.electricity.toFixed(1) + " kWh/day";
    }

    renderRings() {
        const weeklyAvg = window.dataStore.getWeeklyAverages();
        const targets = DAILY_TARGETS;
        
        const updateRing = (circleId, textId, value, target, unit) => {
            const circle = document.getElementById(circleId);
            const text = document.getElementById(textId);
            if (!circle || !text) return;
            
            const percentage = Math.min(100, Math.round((value / target) * 100));
            // Circumference of r=36 circle is ~226.19
            const circum = 2 * Math.PI * 36;
            const offset = circum - (percentage / 100) * circum;
            
            circle.style.strokeDasharray = `${circum} ${circum}`;
            circle.style.strokeDashoffset = offset;
            
            // Adjust coloring based on threshold
            if (value > target * 1.2) {
                circle.style.stroke = "var(--orange)";
            } else if (value <= target) {
                circle.style.stroke = "var(--emerald)";
            } else {
                circle.style.stroke = "var(--yellow)";
            }
            
            text.textContent = `${percentage}%`;
        };

        updateRing('ring-elec-circle', 'ring-elec-text', weeklyAvg.electricity, targets.electricity, 'kWh');
        updateRing('ring-water-circle', 'ring-water-text', weeklyAvg.water, targets.water, 'L');
        updateRing('ring-waste-circle', 'ring-waste-text', weeklyAvg.waste, targets.waste, 'kg');
    }

    renderWeeklyChart() {
        const container = document.getElementById('dashboard-chart-container');
        if (!container) return;

        // Fetch last 7 days keys
        const dates = [];
        const labels = [];
        const now = new Date();
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            dates.push(d.toISOString().split('T')[0]);
            labels.push(days[d.getDay()]);
        }

        // Accumulate data based on selected category
        const cat = this.activeCategory;
        const dataset = dates.map(date => {
            const totals = window.dataStore.getTotalsForDate(date);
            if (cat === 'electricity') return totals.electricity;
            if (cat === 'water') return totals.water;
            if (cat === 'waste') return totals.waste;
            if (cat === 'carbon') return totals.carbon;
            return totals.carbon; // default to carbon
        });

        const maxVal = Math.max(...dataset, 5); // avoid divide by zero
        const height = 180;
        const width = container.clientWidth || 500;
        const padding = 30;
        const graphHeight = height - padding * 2;
        const graphWidth = width - padding * 2;
        const colWidth = graphWidth / dataset.length;

        // Color mapping
        let color = "var(--accent)";
        if (cat === 'electricity') color = "var(--yellow)";
        if (cat === 'water') color = "var(--cyan)";
        if (cat === 'waste') color = "var(--orange)";
        if (cat === 'carbon') color = "var(--emerald)";

        // Build SVG HTML
        let svg = `<svg viewBox="0 0 ${width} ${height}" class="custom-chart-svg" style="width: 100%; height: ${height}px;">`;
        
        // Grid lines
        for (let i = 0; i <= 3; i++) {
            const y = padding + (graphHeight / 3) * i;
            const labelVal = (maxVal - (maxVal / 3) * i).toFixed(1);
            svg += `
                <line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="rgba(255,255,255,0.05)" stroke-dasharray="4" />
                <text x="${padding - 5}" y="${y + 4}" fill="rgba(255,255,255,0.4)" font-size="10" text-anchor="end">${labelVal}</text>
            `;
        }

        // Draw line chart path
        let points = [];
        dataset.forEach((val, idx) => {
            const x = padding + (idx * colWidth) + colWidth / 2;
            const y = padding + graphHeight - (val / maxVal) * graphHeight;
            points.push(`${x},${y}`);
        });

        // Background area gradient path
        const areaPoints = [
            `${padding + colWidth / 2},${padding + graphHeight}`,
            ...points,
            `${padding + (dataset.length - 1) * colWidth + colWidth / 2},${padding + graphHeight}`
        ].join(' ');

        svg += `
            <defs>
                <linearGradient id="chart-grad-${cat}" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="${color}" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="${color}" stop-opacity="0.0"/>
                </linearGradient>
            </defs>
            <polygon points="${areaPoints}" fill="url(#chart-grad-${cat})" />
            <polyline points="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        `;

        // Draw points and labels
        dataset.forEach((val, idx) => {
            const x = padding + (idx * colWidth) + colWidth / 2;
            const y = padding + graphHeight - (val / maxVal) * graphHeight;
            
            // Interactive circle dots
            svg += `
                <circle cx="${x}" cy="${y}" r="4.5" fill="var(--bg-light)" stroke="${color}" stroke-width="2.5" class="chart-dot" />
                <text x="${x}" y="${y - 10}" fill="rgba(255,255,255,0.85)" font-size="9.5" text-anchor="middle" font-weight="600">${val.toFixed(1)}</text>
                <text x="${x}" y="${height - 10}" fill="rgba(255,255,255,0.5)" font-size="11" text-anchor="middle">${labels[idx]}</text>
            `;
        });

        svg += `</svg>`;
        container.innerHTML = svg;
    }

    renderBadges() {
        const badgeGrid = document.getElementById('dashboard-badges-grid');
        if (!badgeGrid) return;
        
        const habits = window.dataStore.getHabits();
        const completedRecs = window.dataStore.getCompletedRecommendations();
        
        // Calculate streaks & parameters
        const uniqueDates = [...new Set(habits.map(h => h.date))].sort();
        let currentStreak = 0;
        const todayStr = new Date().toISOString().split('T')[0];
        
        // Quick streak estimation
        let activeCheck = new Date();
        for (let i = 0; i < 30; i++) {
            const dateStr = activeCheck.toISOString().split('T')[0];
            if (uniqueDates.includes(dateStr)) {
                currentStreak++;
                activeCheck.setDate(activeCheck.getDate() - 1);
            } else {
                break;
            }
        }

        const badges = [
            {
                id: 'starter',
                title: 'Eco Beginner',
                desc: 'Logged your first sustainability habit.',
                icon: '🌱',
                earned: habits.length > 0
            },
            {
                id: 'streak-3',
                title: 'Clean Route',
                desc: 'Logged habits for 3 consecutive days.',
                icon: '🔥',
                earned: currentStreak >= 3
            },
            {
                id: 'saver',
                title: 'Water Warden',
                desc: 'Completed a water-saving recommendation.',
                icon: '💧',
                earned: completedRecs.some(r => r.includes('water') || r.includes('shower'))
            },
            {
                id: 'optimizer',
                title: 'Carbon Cutter',
                desc: 'Achieve total emissions below 8.0 kg in a day.',
                icon: '⚡',
                earned: habits.length > 0 && habits.some(h => {
                    const totals = window.dataStore.getTotalsForDate(h.date);
                    return totals.carbon > 0 && totals.carbon <= DAILY_TARGETS.carbon;
                })
            }
        ];

        badgeGrid.innerHTML = badges.map(badge => `
            <div class="badge-card ${badge.earned ? 'unlocked' : 'locked'}">
                <div class="badge-icon">${badge.icon}</div>
                <div class="badge-info">
                    <h4>${badge.title}</h4>
                    <p>${badge.desc}</p>
                    <span class="badge-status">${badge.earned ? 'Unlocked' : 'Locked'}</span>
                </div>
            </div>
        `).join('');
    }

    renderRecentLogs() {
        const list = document.getElementById('recent-logs-list');
        if (!list) return;
        
        // Get last 4 logs, sorted by date & ID desc
        const sortedLogs = [...window.dataStore.getHabits()].sort((a, b) => {
            if (a.date !== b.date) return b.date.localeCompare(a.date);
            return b.id.localeCompare(a.id);
        }).slice(0, 4);

        if (sortedLogs.length === 0) {
            list.innerHTML = `<li class="empty-log-state">No habit logs found. Switch to the "Track Habits" tab to add some!</li>`;
            return;
        }

        const getCategoryIcon = (cat) => {
            if (cat === 'electricity') return '⚡';
            if (cat === 'water') return '💧';
            if (cat === 'waste') return '🗑️';
            return '🚗';
        };

        const getCategoryColor = (cat) => {
            if (cat === 'electricity') return 'var(--yellow)';
            if (cat === 'water') return 'var(--cyan)';
            if (cat === 'waste') return 'var(--orange)';
            return 'var(--emerald)';
        };

        list.innerHTML = sortedLogs.map(log => {
            const carbonSaved = window.dataStore.calculateCarbon(log.category, log.amount, log.type).toFixed(1);
            return `
                <li class="log-item">
                    <span class="log-cat-icon" style="background: rgba(255,255,255,0.04); border: 1px solid ${getCategoryColor(log.category)}">${getCategoryIcon(log.category)}</span>
                    <div class="log-details">
                        <span class="log-desc">${log.description || (log.category.charAt(0).toUpperCase() + log.category.slice(1))}</span>
                        <span class="log-date">${log.date} &bull; ${log.amount} ${log.category === 'electricity' ? 'kWh' : log.category === 'water' ? 'L' : log.category === 'waste' ? 'kg' : 'mi'}</span>
                    </div>
                    <div class="log-impact positive">
                        <span>+${carbonSaved} kg CO₂</span>
                    </div>
                    <button class="delete-log-btn" data-id="${log.id}" title="Remove entry">&times;</button>
                </li>
            `;
        }).join('');

        // Wire delete buttons
        list.querySelectorAll('.delete-log-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.dataset.id;
                window.dataStore.deleteHabit(id);
                this.renderAll();
                // trigger global updates
                if (window.appController) window.appController.onDataChanged();
            });
        });
    }
}

window.dashboardController = new DashboardController();