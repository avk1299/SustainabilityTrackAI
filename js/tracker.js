/**
 * SustainTrack - Habit Tracker Form Controller
 * Manages tab switching within the tracking view, dynamic logging inputs, and feedback updates.
 */

class TrackerController {
    constructor() {
        this.selectedCategory = 'electricity'; // default
    }

    init() {
        this.setupFormTabs();
        this.setupFormSubmit();
        this.renderCategoryInputs();
        this.updateImpactPreview();
    }

    setupFormTabs() {
        const tabs = document.querySelectorAll('.tracker-form-tabs .btn-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.selectedCategory = tab.dataset.category;
                this.renderCategoryInputs();
                this.updateImpactPreview();
            });
        });
    }

    renderCategoryInputs() {
        const inputArea = document.getElementById('tracker-dynamic-inputs');
        if (!inputArea) return;

        let html = '';

        if (this.selectedCategory === 'electricity') {
            html = `
                <div class="form-group">
                    <label for="elec-amount">Electricity Used (kWh)</label>
                    <input type="number" id="elec-amount" value="12" min="0.1" step="0.1" class="form-input">
                    <p class="input-hint">Tip: A typical home uses 10-20 kWh per day. LED bulbs run on ~0.01 kWh/hour.</p>
                </div>
                <div class="form-group">
                    <label for="elec-desc">Description (Optional)</label>
                    <input type="text" id="elec-desc" placeholder="e.g., Daily power usage, Ran AC for 2 hours" class="form-input">
                </div>
            `;
        } else if (this.selectedCategory === 'water') {
            html = `
                <div class="form-group">
                    <label for="water-type-select">Log Type</label>
                    <select id="water-type-select" class="form-input">
                        <option value="liters">Exact Volume (Liters)</option>
                        <option value="shower">Shower Duration (Minutes)</option>
                    </select>
                </div>
                <div class="form-group" id="water-val-container">
                    <label id="water-val-label" for="water-amount">Water Volume (Liters)</label>
                    <input type="number" id="water-amount" value="150" min="1" class="form-input">
                    <p class="input-hint" id="water-hint">Average direct usage is 150 liters/day per person.</p>
                </div>
                <div class="form-group">
                    <label for="water-desc">Description (Optional)</label>
                    <input type="text" id="water-desc" placeholder="e.g., Full dishwasher run, Short shower logged" class="form-input">
                </div>
            `;
        } else if (this.selectedCategory === 'waste') {
            html = `
                <div class="form-group">
                    <label for="waste-amount">Waste Quantity (kg)</label>
                    <input type="number" id="waste-amount" value="1.2" min="0.1" step="0.1" class="form-input">
                    <p class="input-hint">Average citizen generates 1.5 kg of garbage daily.</p>
                </div>
                <div class="form-group">
                    <label for="waste-recycling">Recycling Action</label>
                    <select id="waste-recycling" class="form-input">
                        <option value="none">Landfill Waste (No recycling)</option>
                        <option value="compost">Composted Organics</option>
                        <option value="recycled">Recycled Metal/Plastics/Paper</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="waste-desc">Description (Optional)</label>
                    <input type="text" id="waste-desc" placeholder="e.g., Composted vegetable scraps" class="form-input">
                </div>
            `;
        } else if (this.selectedCategory === 'transport') {
            html = `
                <div class="form-group">
                    <label for="trans-mode">Transportation Mode</label>
                    <select id="trans-mode" class="form-input">
                        <option value="gas">Gasoline Passenger Car</option>
                        <option value="electric">Electric Vehicle (EV)</option>
                        <option value="transit">Public Transit (Bus/Train)</option>
                        <option value="active">Active Transit (Walking/Cycling)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="trans-distance">Commuting Distance (Miles)</label>
                    <input type="number" id="trans-distance" value="15" min="0.1" step="0.5" class="form-input">
                </div>
                <div class="form-group">
                    <label for="trans-desc">Description (Optional)</label>
                    <input type="text" id="trans-desc" placeholder="e.g., Daily commute to office" class="form-input">
                </div>
            `;
        }

        inputArea.innerHTML = html;

        // Add dynamically updated preview listeners
        const inputs = inputArea.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.updateImpactPreview());
        });

        // Special dynamic logic for water select
        const waterSelect = document.getElementById('water-type-select');
        if (waterSelect) {
            waterSelect.addEventListener('change', (e) => {
                const label = document.getElementById('water-val-label');
                const valInput = document.getElementById('water-amount');
                const hint = document.getElementById('water-hint');
                
                if (e.target.value === 'shower') {
                    label.textContent = "Shower Duration (Minutes)";
                    valInput.value = "10";
                    hint.textContent = "A standard shower consumes roughly 12 liters of water per minute.";
                } else {
                    label.textContent = "Water Volume (Liters)";
                    valInput.value = "150";
                    hint.textContent = "Average direct usage is 150 liters/day per person.";
                }
                this.updateImpactPreview();
            });
        }
    }

    calculateCurrentInputValues() {
        const cat = this.selectedCategory;
        let amount = 0;
        let type = null;
        let desc = '';

        if (cat === 'electricity') {
            const amtInput = document.getElementById('elec-amount');
            const descInput = document.getElementById('elec-desc');
            amount = amtInput ? parseFloat(amtInput.value) || 0 : 0;
            desc = descInput ? descInput.value.trim() : '';
        } else if (cat === 'water') {
            const typeSelect = document.getElementById('water-type-select');
            const amtInput = document.getElementById('water-amount');
            const descInput = document.getElementById('water-desc');
            
            const rawVal = amtInput ? parseFloat(amtInput.value) || 0 : 0;
            if (typeSelect && typeSelect.value === 'shower') {
                amount = rawVal * 12; // 12 liters per minute
                desc = descInput ? descInput.value.trim() : '';
                if (!desc) desc = `Logged a ${rawVal}-min shower`;
            } else {
                amount = rawVal;
                desc = descInput ? descInput.value.trim() : '';
            }
        } else if (cat === 'waste') {
            const amtInput = document.getElementById('waste-amount');
            const recSelect = document.getElementById('waste-recycling');
            const descInput = document.getElementById('waste-desc');
            
            const rawAmt = amtInput ? parseFloat(amtInput.value) || 0 : 0;
            const recType = recSelect ? recSelect.value : 'none';
            desc = descInput ? descInput.value.trim() : '';
            
            // Adjust calculation based on recycling type
            // Composted waste doesn't generate landfill methane, and recycling recovers materials
            amount = rawAmt;
            if (recType === 'compost') {
                type = 'compost';
                if (!desc) desc = `Composted ${rawAmt} kg of waste`;
            } else if (recType === 'recycled') {
                type = 'recycled';
                if (!desc) desc = `Recycled ${rawAmt} kg of materials`;
            } else {
                type = 'none';
            }
        } else if (cat === 'transport') {
            const modeSelect = document.getElementById('trans-mode');
            const distInput = document.getElementById('trans-distance');
            const descInput = document.getElementById('trans-desc');
            
            amount = distInput ? parseFloat(distInput.value) || 0 : 0;
            type = modeSelect ? modeSelect.value : 'gas';
            desc = descInput ? descInput.value.trim() : '';
            
            if (!desc) {
                const modeLabel = modeSelect ? modeSelect.options[modeSelect.selectedIndex].text : 'car';
                desc = `${amount} miles travel via ${modeLabel}`;
            }
        }

        return { amount, type, desc };
    }

    updateImpactPreview() {
        const previewCO2 = document.getElementById('preview-impact-co2');
        const previewCost = document.getElementById('preview-impact-cost');
        if (!previewCO2 || !previewCost) return;

        const { amount, type, desc } = this.calculateCurrentInputValues();
        let cat = this.selectedCategory;
        
        let calculatedAmt = amount;
        let calcCat = cat;
        
        // Custom scale for waste reduction
        if (cat === 'waste') {
            // If composted or recycled, we calculate how much carbon is *saved* vs landfill
            if (type === 'compost') {
                calculatedAmt = amount * 0.1; // only 10% carbon footprint compared to landfill
            } else if (type === 'recycled') {
                calculatedAmt = amount * 0.3; // 30% footprint compared to raw landfill
            }
        }

        const co2 = window.dataStore.calculateCarbon(calcCat, calculatedAmt, type);
        const cost = window.dataStore.calculateCost(calcCat, calculatedAmt, type);

        previewCO2.textContent = co2.toFixed(1) + " kg CO₂";
        previewCost.textContent = "$" + cost.toFixed(2);
    }

    setupFormSubmit() {
        const form = document.getElementById('habit-log-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const { amount, type, desc } = this.calculateCurrentInputValues();
            if (amount <= 0) {
                alert("Please enter a valid positive quantity.");
                return;
            }

            // Create log entry
            const record = {
                category: this.selectedCategory,
                amount: amount,
                type: type,
                description: desc,
                date: document.getElementById('log-date-picker').value || new Date().toISOString().split('T')[0]
            };

            const savedRecord = window.dataStore.addHabit(record);
            
            // Show toast feedback
            const carbonImpact = window.dataStore.calculateCarbon(savedRecord.category, savedRecord.amount, savedRecord.type).toFixed(1);
            const costImpact = window.dataStore.calculateCost(savedRecord.category, savedRecord.amount, savedRecord.type).toFixed(2);
            
            this.showToast(`Logged successfully! Impact: +${carbonImpact} kg CO₂ | Cost: $${costImpact}`);
            
            // Reset input values
            this.renderCategoryInputs();
            this.updateImpactPreview();

            // Trigger application-wide refresh
            if (window.appController) window.appController.onDataChanged();
        });
    }

    showToast(message) {
        let toast = document.getElementById('tracker-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'tracker-toast';
            toast.className = 'toast-alert';
            document.body.appendChild(toast);
        }
        
        toast.textContent = message;
        toast.classList.add('visible');
        
        setTimeout(() => {
            toast.classList.remove('visible');
        }, 3500);
    }
}

window.trackerController = new TrackerController();
