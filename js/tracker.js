/**
 * SustainTrack - Habit Tracker Controller
 * Handles logging habits, switching category tabs, rendering dynamic input fields,
 * computing live preview of carbon/monetary impacts, and displaying the full log history.
 */

class TrackerController {
    constructor() {
        this.activeCategory = 'electricity'; // electricity, water, waste, transport
        this.logFilter = 'all'; // all, electricity, water, waste, transport
    }

    init() {
        this.setupCategoryTabs();
        this.renderFormFields();
        this.setupFormSubmit();
        this.renderTrackerLogs();
    }

    /* =====================================================
       CATEGORY TABS
    ===================================================== */
    setupCategoryTabs() {
        const tabs = document.querySelectorAll('#view-tracker .btn-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                this.activeCategory = tab.dataset.category;
                this.renderFormFields();
            });
        });
    }

    /* =====================================================
       DYNAMIC FORM FIELDS
    ===================================================== */
    renderFormFields() {
        const container = document.getElementById('tracker-dynamic-inputs');
        if (!container) return;

        let fieldsHTML = '';

        if (this.activeCategory === 'electricity') {
            fieldsHTML = `
                <div class="form-group">
                    <label for="input-amount">Electricity Consumed (kWh)</label>
                    <input type="number" id="input-amount" class="form-input" min="0" step="0.1"
                        placeholder="e.g. 10.5" required>
                    <span class="input-hint">🎯 Green home daily target: 10 kWh/day</span>
                </div>
                <div class="form-group">
                    <label for="input-desc">Description (optional)</label>
                    <input type="text" id="input-desc" class="form-input"
                        placeholder="e.g. Daily household electricity"
                        value="Household daily power consumption">
                </div>
            `;
        } else if (this.activeCategory === 'water') {
            fieldsHTML = `
                <div class="form-group">
                    <label for="input-amount">Water Volume (Liters)</label>
                    <input type="number" id="input-amount" class="form-input" min="0" step="1"
                        placeholder="e.g. 150" required>
                    <span class="input-hint">🎯 Daily target: 150 L/day</span>
                </div>
                <div class="form-group">
                    <label for="input-desc">Description (optional)</label>
                    <input type="text" id="input-desc" class="form-input"
                        placeholder="e.g. Shower + cooking"
                        value="Showering, cleaning, and cooking water usage">
                </div>
            `;
        } else if (this.activeCategory === 'waste') {
            fieldsHTML = `
                <div class="form-group">
                    <label for="input-amount">Waste Produced (kg)</label>
                    <input type="number" id="input-amount" class="form-input" min="0" step="0.1"
                        placeholder="e.g. 1.2" required>
                    <span class="input-hint">🎯 Daily target: 1.0 kg/day</span>
                </div>
                <div class="form-group">
                    <label for="input-desc">Description (optional)</label>
                    <input type="text" id="input-desc" class="form-input"
                        placeholder="e.g. Kitchen and paper waste"
                        value="Kitchen and paper waste generated">
                </div>
            `;
        } else if (this.activeCategory === 'transport') {
            fieldsHTML = `
                <div class="form-group">
                    <label for="input-amount">Commute Distance (Miles)</label>
                    <input type="number" id="input-amount" class="form-input" min="0" step="0.5"
                        placeholder="e.g. 15.0" required>
                </div>
                <div class="form-group">
                    <label for="input-type">Commuting Vehicle Mode</label>
                    <select id="input-type" class="form-input">
                        <option value="gas">🚗 Gasoline Passenger Car</option>
                        <option value="electric">⚡ Electric Car (EV)</option>
                        <option value="transit">🚌 Public Bus / Subway</option>
                        <option value="active">🚲 Active Walk / Cycling</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="input-desc">Description (optional)</label>
                    <input type="text" id="input-desc" class="form-input"
                        placeholder="e.g. Commute to office"
                        value="Daily commuter travel">
                </div>
            `;
        }

        container.innerHTML = fieldsHTML;

        // Wire up live preview on every change
        container.querySelectorAll('input, select').forEach(el => {
            el.addEventListener('input', () => this.updateImpactPreview());
        });

        // Initialise preview values
        this.updateImpactPreview();
    }

    /* =====================================================
       LIVE IMPACT PREVIEW
    ===================================================== */
    updateImpactPreview() {
        const amountEl = document.getElementById('input-amount');
        const amount = amountEl ? (parseFloat(amountEl.value) || 0) : 0;

        let type = null;
        if (this.activeCategory === 'transport') {
            const typeEl = document.getElementById('input-type');
            type = typeEl ? typeEl.value : 'gas';
        }

        const co2  = window.dataStore.calculateCarbon(this.activeCategory, amount, type);
        const cost = window.dataStore.calculateCost(this.activeCategory, amount, type);

        const co2El  = document.getElementById('preview-impact-co2');
        const costEl = document.getElementById('preview-impact-cost');
        if (co2El)  co2El.textContent  = `${co2.toFixed(2)} kg CO₂`;
        if (costEl) costEl.textContent = `$${cost.toFixed(2)}`;
    }

    /* =====================================================
       FORM SUBMISSION
    ===================================================== */
    setupFormSubmit() {
        const form = document.getElementById('habit-log-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const datePicker = document.getElementById('log-date-picker');
            const date = datePicker ? datePicker.value : new Date().toISOString().split('T')[0];

            const amountEl = document.getElementById('input-amount');
            const amount   = amountEl ? (parseFloat(amountEl.value) || 0) : 0;

            if (amount <= 0) {
                this.showToast('Please enter a valid amount greater than 0.', 'warning');
                return;
            }

            const descEl = document.getElementById('input-desc');
            let description = descEl ? descEl.value.trim() : '';

            let type = null;
            if (this.activeCategory === 'transport') {
                const typeEl = document.getElementById('input-type');
                type = typeEl ? typeEl.value : 'gas';
                const modeLabels = { gas: 'Gas car', electric: 'EV', transit: 'Transit', active: 'Active' };
                if (!description) description = `${amount} miles commuter travel (${modeLabels[type] || type})`;
            }

            if (!description) {
                description = this.activeCategory.charAt(0).toUpperCase() + this.activeCategory.slice(1);
            }

            // Persist to data store
            window.dataStore.addHabit({
                date,
                category: this.activeCategory,
                amount,
                type,
                description
            });

            // Feedback
            const catLabel = this.activeCategory.charAt(0).toUpperCase() + this.activeCategory.slice(1);
            this.showToast(`✅ ${catLabel} habit logged successfully!`);

            // Reset the amount field, keep the date
            if (amountEl) amountEl.value = '';
            this.updateImpactPreview();

            // Refresh log list within tracker view
            this.renderTrackerLogs();

            // Notify app controller so dashboard updates
            if (window.appController) window.appController.onDataChanged();
        });
    }

    /* =====================================================
       TRACKER LOG HISTORY LIST
    ===================================================== */
    renderTrackerLogs() {
        // Inject list container into tracker view if it doesn't exist yet
        this._ensureLogSection();

        const filterBar = document.getElementById('tracker-log-filter-bar');
        const listEl    = document.getElementById('tracker-log-list');
        if (!listEl) return;

        // Get all habits, sorted newest first
        let habits = [...window.dataStore.getHabits()].sort((a, b) => {
            if (a.date !== b.date) return b.date.localeCompare(a.date);
            return b.id.localeCompare(a.id);
        });

        // Apply category filter
        if (this.logFilter !== 'all') {
            habits = habits.filter(h => h.category === this.logFilter);
        }

        if (habits.length === 0) {
            listEl.innerHTML = `
                <li class="empty-log-state">
                    No habit logs found${this.logFilter !== 'all' ? ' for this category' : ''}.<br>
                    Use the form above to add your first entry!
                </li>`;
            return;
        }

        const catIcon  = c => ({ electricity: '⚡', water: '💧', waste: '🗑️', transport: '🚗' }[c] || '📋');
        const catColor = c => ({ electricity: 'var(--yellow)', water: 'var(--cyan)', waste: 'var(--orange)', transport: 'var(--emerald)' }[c] || '#fff');
        const unitOf   = c => ({ electricity: 'kWh', water: 'L', waste: 'kg', transport: 'mi' }[c] || '');

        listEl.innerHTML = habits.map(log => {
            const co2  = window.dataStore.calculateCarbon(log.category, log.amount, log.type).toFixed(2);
            const cost = window.dataStore.calculateCost(log.category, log.amount, log.type).toFixed(2);
            return `
                <li class="log-item tracker-log-item">
                    <span class="log-cat-icon"
                          style="background: rgba(255,255,255,0.04); border: 1px solid ${catColor(log.category)}">
                        ${catIcon(log.category)}
                    </span>
                    <div class="log-details">
                        <span class="log-desc">${log.description || log.category}</span>
                        <span class="log-date">${log.date} &bull; ${log.amount} ${unitOf(log.category)}</span>
                    </div>
                    <div class="tracker-log-meta">
                        <span class="tl-co2">${co2} kg CO₂</span>
                        <span class="tl-cost">$${cost}</span>
                    </div>
                    <button class="delete-log-btn" data-id="${log.id}" title="Delete entry">&times;</button>
                </li>`;
        }).join('');

        // Wire delete buttons
        listEl.querySelectorAll('.delete-log-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                window.dataStore.deleteHabit(btn.dataset.id);
                this.renderTrackerLogs();
                if (window.appController) window.appController.onDataChanged();
                this.showToast('Log entry removed.');
            });
        });
    }

    _ensureLogSection() {
        if (document.getElementById('tracker-log-section')) return;

        const trackerView = document.getElementById('view-tracker');
        if (!trackerView) return;

        const section = document.createElement('div');
        section.id = 'tracker-log-section';
        section.className = 'tracker-log-section';
        section.innerHTML = `
            <div class="tracker-log-header">
                <h3>All Habit Logs</h3>
                <div class="tracker-log-filter-group" id="tracker-log-filter-bar">
                    <button class="btn-log-filter active" data-filter="all">All</button>
                    <button class="btn-log-filter" data-filter="electricity">⚡ Electricity</button>
                    <button class="btn-log-filter" data-filter="water">💧 Water</button>
                    <button class="btn-log-filter" data-filter="waste">🗑️ Waste</button>
                    <button class="btn-log-filter" data-filter="transport">🚗 Transport</button>
                </div>
                <button class="btn btn-outline btn-export-csv" id="export-csv-btn" title="Export to CSV">
                    ⬇ Export CSV
                </button>
            </div>
            <ul class="logs-list-element" id="tracker-log-list"></ul>
        `;
        trackerView.appendChild(section);

        // Wire filter buttons
        section.querySelectorAll('.btn-log-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                section.querySelectorAll('.btn-log-filter').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.logFilter = btn.dataset.filter;
                this.renderTrackerLogs();
            });
        });

        // Wire CSV export
        const exportBtn = document.getElementById('export-csv-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportCSV());
        }
    }

    /* =====================================================
       CSV EXPORT
    ===================================================== */
    exportCSV() {
        const habits = [...window.dataStore.getHabits()].sort((a, b) =>
            b.date.localeCompare(a.date)
        );

        if (habits.length === 0) {
            this.showToast('No data to export yet.', 'warning');
            return;
        }

        const header = ['Date', 'Category', 'Amount', 'Unit', 'Type', 'Description', 'CO2_kg', 'Cost_USD'];
        const unitOf = c => ({ electricity: 'kWh', water: 'L', waste: 'kg', transport: 'mi' }[c] || '');

        const rows = habits.map(h => {
            const co2  = window.dataStore.calculateCarbon(h.category, h.amount, h.type).toFixed(4);
            const cost = window.dataStore.calculateCost(h.category, h.amount, h.type).toFixed(4);
            const esc  = v => `"${String(v).replace(/"/g, '""')}"`;
            return [
                esc(h.date), esc(h.category), h.amount, unitOf(h.category),
                esc(h.type || ''), esc(h.description || ''), co2, cost
            ].join(',');
        });

        const csv     = [header.join(','), ...rows].join('\n');
        const blob    = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url     = URL.createObjectURL(blob);
        const link    = document.createElement('a');
        link.href     = url;
        link.download = `sustaintrack_habits_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.showToast('✅ Habit data exported to CSV!');
    }

    /* =====================================================
       TOAST NOTIFICATION
    ===================================================== */
    showToast(message, type = 'success') {
        const oldToast = document.getElementById('tracker-toast');
        if (oldToast) oldToast.remove();

        const toast = document.createElement('div');
        toast.id        = 'tracker-toast';
        toast.className = 'toast-alert';
        if (type === 'warning') toast.classList.add('toast-warning');
        toast.textContent = message;
        document.body.appendChild(toast);

        // Force reflow to trigger transition
        void toast.offsetHeight;
        toast.classList.add('visible');

        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 350);
        }, 3000);
    }
}

window.trackerController = new TrackerController();