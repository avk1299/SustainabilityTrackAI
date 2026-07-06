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
        const sliders = document.querySelectorAll('.simulator-control input[type="range"], .simulator-control select');
        sliders.forEach(slider => {
            slider.addEventListener('input', () => {
                this.updateLabel(slider);
                this.runSimulation();
            });
            // Update labels on load
            this.updateLabel(slider);
        });
    }

    updateLabel(slider) {
        const valueId = `${slider.id}-val`;
        const valLabel = document.getElementById(valueId);
        if (!valLabel) return;
        
        let unit = '';
        if (slider.id === 'sim-shower') unit = ' min';
        else if (slider.id === 'sim-lights') unit = '% LED';
        else if (slider.id === 'sim-travel') unit = ' mi/day';
        else if (slider.id === 'sim-meat') unit = ' meals/wk';
        
        valLabel.textContent = slider.value + unit;
    }

    runSimulation() {
        // Current slider settings
        const heatingType = document.getElementById('sim-heating').value; // gas, electric, heatpump
        const showerMinutes = parseFloat(document.getElementById('sim-shower').value) || 0;
        const ledPercent = parseFloat(document.getElementById('sim-lights').value) || 0;
        const travelMiles = parseFloat(document.getElementById('sim-travel').value) || 0;
        const travelMode = document.getElementById('sim-travel-mode').value; // gas, EV, public
        const meatMeals = parseFloat(document.getElementById('sim-meat').value) || 0;

        // Baseline (Typical average user before improvements)
        // Baseline assumptions (Annual):
        // Heating: Gas furnace (baseline: 2,500 kg CO2, cost $900)
        // Shower: 10 mins daily (baseline: 3,650 mins/yr => 43,800L => 12.7 kg CO2, cost $130)
        // Lights: 100% Incandescent (baseline: 800 kWh/yr => 304 kg CO2, cost $128)
        // Travel: 20 miles daily in gas car (baseline: 7,300 miles/yr => 2,993 kg CO2, cost $1,314)
        // Diet: Meat daily (baseline: 14 meals/wk meat => 1,500 kg CO2/yr, cost $1,800)

        // 1. Heating calculations (Annual)
        let heatCO2 = 2500;
        let heatCost = 900;
        if (heatingType === 'electric') {
            heatCO2 = 1800;
            heatCost = 1100;
        } else if (heatingType === 'heatpump') {
            heatCO2 = 600;
            heatCost = 450;
        }

        // 2. Shower calculations (Annual)
        // 12 liters per minute. 365 days. 
        const annualWaterLiters = showerMinutes * 12 * 365;
        // Water heating energy is about 0.035 kWh per liter
        const waterHeatingKWh = annualWaterLiters * 0.035;
        const showerCO2 = (annualWaterLiters * 0.00029) + (waterHeatingKWh * 0.38);
        const showerCost = (annualWaterLiters * 0.003) + (waterHeatingKWh * 0.16);

        // 3. Lighting calculations (Annual)
        // 800 kWh baseline. LED uses 80% less.
        const lightingKWh = 800 * (1 - (ledPercent / 100) * 0.8);
        const lightingCO2 = lightingKWh * 0.38;
        const lightingCost = lightingKWh * 0.16;

        // 4. Commute travel (Annual)
        // baseline: 20 miles/day gas car.
        // User sets daily distance and mode
        const annualMiles = travelMiles * 365;
        let transCO2Factor = 0.41; // gas
        let transCostFactor = 0.18; // gas
        if (travelMode === 'EV') {
            transCO2Factor = 0.12;
            transCostFactor = 0.05;
        } else if (travelMode === 'public') {
            transCO2Factor = 0.09;
            transCostFactor = 0.12;
        } else if (travelMode === 'active') {
            transCO2Factor = 0.00;
            transCostFactor = 0.00;
        }
        const transCO2 = annualMiles * transCO2Factor;
        const transCost = annualMiles * transCostFactor;

        // 5. Diet calculations (Annual)
        // Baseline is 14 meals/wk containing meat. 1 meal meat = ~2.5 kg CO2. Plant meal = ~0.5 kg CO2.
        // Meat meal costs $8, Plant meal costs $4.50.
        const totalMealsYr = 52 * 14;
        const meatMealsYr = meatMeals * 52;
        const vegMealsYr = Math.max(0, totalMealsYr - meatMealsYr);
        
        const dietCO2 = (meatMealsYr * 2.5) + (vegMealsYr * 0.5);
        const dietCost = (meatMealsYr * 8.0) + (vegMealsYr * 4.5);

        // --- Totals Comparison ---
        const baselineTotalCO2 = 2500 + 440 + 304 + 2993 + 1820; // 8057 kg
        const baselineTotalCost = 900 + 200 + 128 + 1314 + 1820; // $4362

        const simulatedTotalCO2 = heatCO2 + showerCO2 + lightingCO2 + transCO2 + dietCO2;
        const simulatedTotalCost = heatCost + showerCost + lightingCost + transCost + dietCost;

        const co2Saved = Math.max(0, baselineTotalCO2 - simulatedTotalCO2);
        const costSaved = Math.max(0, baselineTotalCost - simulatedTotalCost);

        // Equivalent trees planted (1 tree absorbs roughly 22kg CO2/year)
        const treesEquivalent = Math.round(co2Saved / 22);

        // Update DOM
        document.getElementById('sim-co2-saved').textContent = Math.round(co2Saved).toLocaleString() + " kg";
        document.getElementById('sim-cost-saved').textContent = "$" + Math.round(costSaved).toLocaleString();
        document.getElementById('sim-trees-planted').textContent = treesEquivalent;

        // Interactive visual meters
        const carbonBar = document.getElementById('sim-carbon-progress-bar');
        const costBar = document.getElementById('sim-cost-progress-bar');
        
        if (carbonBar) {
            const pct = Math.min(100, Math.round((co2Saved / baselineTotalCO2) * 100));
            carbonBar.style.width = `${pct}%`;
        }
        if (costBar) {
            const pct = Math.min(100, Math.round((costSaved / baselineTotalCost) * 100));
            costBar.style.width = `${pct}%`;
        }
    }
}

window.simulatorController = new SimulatorController();
