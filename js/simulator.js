/**
 * SustainTrack - Scenario / What-If Simulator Controller
 * Simulates lifestyle changes using mathematical approximations and outputs financial/ecological benefits.
 */

class SimulatorController {
    init() {
        this.setupSliders();
        this.runSimulation();
    }

    setupSliders() {
        const controls = document.querySelectorAll(
            '.simulator-control input[type="range"], .simulator-control select'
        );
        controls.forEach(ctrl => {
            ctrl.addEventListener('input', () => {
                this.updateLabel(ctrl);
                this.runSimulation();
            });
            // Initialise labels on load
            this.updateLabel(ctrl);
        });
    }

    updateLabel(ctrl) {
        const valueId = `${ctrl.id}-val`;
        const valLabel = document.getElementById(valueId);
        if (!valLabel) return;

        if (ctrl.tagName === 'SELECT') {
            // Map select value to a human-readable label
            const selectedOpt = ctrl.options[ctrl.selectedIndex];
            valLabel.textContent = selectedOpt ? selectedOpt.text.split(' (')[0] : ctrl.value;
        } else {
            // Range slider — append unit
            let unit = '';
            if (ctrl.id === 'sim-shower')  unit = ' min';
            if (ctrl.id === 'sim-lights')  unit = '% LED';
            if (ctrl.id === 'sim-travel')  unit = ' mi/day';
            if (ctrl.id === 'sim-meat')    unit = ' meals/wk';
            valLabel.textContent = ctrl.value + unit;
        }
    }

    runSimulation() {
        // Read current control values
        const heatingType   = document.getElementById('sim-heating').value;       // gas, electric, heatpump
        const showerMinutes = parseFloat(document.getElementById('sim-shower').value) || 0;
        const ledPercent    = parseFloat(document.getElementById('sim-lights').value) || 0;
        const travelMiles   = parseFloat(document.getElementById('sim-travel').value) || 0;
        const travelMode    = document.getElementById('sim-travel-mode').value;    // gas, EV, public, active
        const meatMeals     = parseFloat(document.getElementById('sim-meat').value) || 0;

        // ------------------------------------------------------------------
        // BASELINE ASSUMPTIONS (Annual, typical US household, before changes)
        //   Heating:  Gas furnace   → 2,500 kg CO2,  $900/yr
        //   Shower:   10 min/day    → 43,800 L/yr   → ~14 kg CO2, $131/yr
        //   Lighting: 100% incan.   → 800 kWh/yr    → 304 kg CO2, $128/yr
        //   Travel:   20 mi/day gas → 7,300 mi/yr   → 2,993 kg CO2, $1,314/yr
        //   Diet:     14 meat meals → 1,820 kg CO2/yr, $5,824/yr
        // ------------------------------------------------------------------

        // 1. HEATING (Annual)
        let heatCO2 = 2500, heatCost = 900;
        if (heatingType === 'electric') { heatCO2 = 1800; heatCost = 1100; }
        if (heatingType === 'heatpump') { heatCO2 = 600;  heatCost = 450;  }

        // 2. SHOWER (Annual)
        //    12 L/min × 365 days
        const annualShowerL    = showerMinutes * 12 * 365;
        const showerHeatKWh    = annualShowerL * 0.035;   // 0.035 kWh to heat 1 L
        const showerCO2        = (annualShowerL * 0.00029) + (showerHeatKWh * 0.38);
        const showerCost       = (annualShowerL * 0.003)  + (showerHeatKWh * 0.16);

        // 3. LIGHTING (Annual)
        //    800 kWh baseline. LED saves up to 80%.
        const lightKWh         = 800 * (1 - (ledPercent / 100) * 0.8);
        const lightingCO2      = lightKWh * 0.38;
        const lightingCost     = lightKWh * 0.16;

        // 4. TRANSPORT (Annual)
        const annualMiles      = travelMiles * 365;
        const transCO2Factor   = { gas: 0.41, EV: 0.12, public: 0.09, active: 0.00 }[travelMode] ?? 0.41;
        const transCostFactor  = { gas: 0.18, EV: 0.05, public: 0.12, active: 0.00 }[travelMode] ?? 0.18;
        const transCO2         = annualMiles * transCO2Factor;
        const transCost        = annualMiles * transCostFactor;

        // 5. DIET (Annual)
        //    Total meals/yr at baseline = 52 × 14. User sets meat meals/wk.
        const totalMealsYr     = 52 * 14;
        const meatMealsYr      = meatMeals * 52;
        const vegMealsYr       = Math.max(0, totalMealsYr - meatMealsYr);
        const dietCO2          = (meatMealsYr * 2.5) + (vegMealsYr * 0.5);
        const dietCost         = (meatMealsYr * 8.0) + (vegMealsYr * 4.5);

        // ------------------------------------------------------------------
        // TOTALS & SAVINGS
        // ------------------------------------------------------------------
        const baselineCO2  = 2500 + 440  + 304  + 2993 + 1820;  // ≈ 8,057 kg
        const baselineCost = 900  + 200  + 128  + 1314 + 5824;  // ≈ $8,366

        const simCO2  = heatCO2  + showerCO2  + lightingCO2  + transCO2  + dietCO2;
        const simCost = heatCost + showerCost + lightingCost + transCost + dietCost;

        const co2Saved  = Math.max(0, baselineCO2  - simCO2);
        const costSaved = Math.max(0, baselineCost - simCost);

        // Trees planted analogy (1 mature pine ≈ 22 kg CO2/yr)
        const trees = Math.round(co2Saved / 22);

        // Monthly savings for bonus display
        const monthlyCost = costSaved / 12;

        // ------------------------------------------------------------------
        // UPDATE DOM
        // ------------------------------------------------------------------
        this._setText('sim-co2-saved',    Math.round(co2Saved).toLocaleString()  + ' kg');
        this._setText('sim-cost-saved',   '$' + Math.round(costSaved).toLocaleString());
        this._setText('sim-trees-planted', trees.toLocaleString());
        this._setText('sim-monthly-cost', '$' + Math.round(monthlyCost).toLocaleString() + '/mo');

        // Progress bars
        this._setBar('sim-carbon-progress-bar', co2Saved,  baselineCO2);
        this._setBar('sim-cost-progress-bar',   costSaved, baselineCost);

        // Breakdown tooltip data (optional enrichment)
        this._updateBreakdown({ heatCO2, showerCO2, lightingCO2, transCO2, dietCO2 }, simCO2);
    }

    _setText(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    _setBar(id, value, max) {
        const el = document.getElementById(id);
        if (el) el.style.width = `${Math.min(100, Math.round((value / max) * 100))}%`;
    }

    _updateBreakdown(parts, total) {
        const bd = document.getElementById('sim-breakdown-list');
        if (!bd) return;

        const labels = {
            heatCO2:     '🔥 Heating',
            showerCO2:   '🚿 Showers',
            lightingCO2: '💡 Lighting',
            transCO2:    '🚗 Transport',
            dietCO2:     '🥩 Diet'
        };

        bd.innerHTML = Object.entries(parts).map(([key, val]) => {
            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
            return `
                <li class="sim-bd-item">
                    <span class="sim-bd-label">${labels[key]}</span>
                    <div class="sim-bd-bar-bg">
                        <div class="sim-bd-bar-fill" style="width:${pct}%"></div>
                    </div>
                    <span class="sim-bd-val">${Math.round(val).toLocaleString()} kg</span>
                </li>`;
        }).join('');
    }
}

window.simulatorController = new SimulatorController();
