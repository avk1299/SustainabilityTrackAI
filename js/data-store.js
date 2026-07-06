/**
 * SustainTrack - Data Store & Calculations
 * Manages the state, LocalStorage persistence, default seed data, and sustainability calculation models.
 */

const CARBON_FACTORS = {
    electricity: 0.38,   // kg CO2 per kWh
    water: 0.00029,      // kg CO2 per Liter
    waste: 2.40,         // kg CO2 per kg (average municipal waste to landfill)
    transport: {
        gas: 0.41,       // kg CO2 per mile (gasoline car)
        electric: 0.12,  // kg CO2 per mile (EV, grid charging)
        transit: 0.09,   // kg CO2 per mile (bus/train average)
        active: 0.00     // walking/biking
    }
};

const UNIT_COSTS = {
    electricity: 0.16,   // $ per kWh
    water: 0.003,        // $ per Liter ($3 per cubic meter)
    waste: 0.08,         // $ per kg (disposal & landfill tax equivalent)
    transport: {
        gas: 0.18,       // $ per mile (fuel, maintenance)
        electric: 0.05,  // $ per mile (charging cost)
        transit: 0.12,   // $ per mile average fare
        active: 0.00     // free
    }
};

const DAILY_TARGETS = {
    electricity: 10,     // 10 kWh/day target (typical green household target)
    water: 150,          // 150 Liters/day target
    waste: 1.0,          // 1.0 kg/day target
    carbon: 8.0          // 8.0 kg CO2/day total target
};

// Initial state skeleton
const DEFAULT_STATE = {
    profile: {
        name: "Eco Explorer",
        sustainabilityGoal: "reduce-carbon", // reduce-carbon, save-money, zero-waste
        householdSize: 2,
    },
    habits: [],
    chatHistory: [
        {
            sender: "agent",
            text: "Hello! I am Sustaina, your AI Sustainability Agent. I will continuously monitor your habits, calculate your carbon footprint and financial savings, and give you custom tips. I see you just logged in. Ask me anything or start logging your daily resource usage!",
            timestamp: new Date().toISOString(),
            suggestions: ["How can I save water?", "Ways to reduce electric bill", "Show my weekly footprint summary"]
        }
    ],
    completedRecommendations: []
};

// Seed data helper to populate the last 7 days of logs if empty
function generateSeedData() {
    const seed = [];
    const now = new Date();
    
    // Create logs for the past 7 days
    for (let i = 7; i >= 1; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        // Slightly random, realistic fluctuations
        const rand = (min, max) => Math.random() * (max - min) + min;
        
        // Electricity log
        seed.push({
            id: `seed-elec-${i}`,
            date: dateString,
            category: 'electricity',
            amount: Math.round(rand(8, 15) * 10) / 10, // 8 to 15 kWh
            description: "Household daily power consumption"
        });
        
        // Water log
        seed.push({
            id: `seed-water-${i}`,
            date: dateString,
            category: 'water',
            amount: Math.round(rand(120, 220)), // 120 to 220 Liters
            description: "Showering, cleaning, and cooking water usage"
        });
        
        // Waste log
        seed.push({
            id: `seed-waste-${i}`,
            date: dateString,
            category: 'waste',
            amount: Math.round(rand(0.6, 1.8) * 10) / 10, // 0.6 to 1.8 kg
            description: "Kitchen and paper waste generated"
        });
        
        // Transport log (mix of commuting)
        let miles = Math.round(rand(10, 30));
        let mode = Math.random() > 0.3 ? 'gas' : 'transit';
        if (i === 2 || i === 3) mode = 'active'; // Walked or cycled on weekends
        
        seed.push({
            id: `seed-trans-${i}`,
            date: dateString,
            category: 'transport',
            amount: miles,
            type: mode,
            description: mode === 'active' ? "Cycled to the local park" : `${miles} miles commuter travel (${mode})`
        });
    }
    
    return seed;
}

class DataStore {
    constructor() {
        this.state = DEFAULT_STATE;
        this.loadFromStorage();
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('sustaintrack_state');
            if (saved) {
                this.state = JSON.parse(saved);
                // Ensure chat history exists
                if (!this.state.chatHistory || this.state.chatHistory.length === 0) {
                    this.state.chatHistory = DEFAULT_STATE.chatHistory;
                }
            } else {
                // Initialize with seed data
                this.state.habits = generateSeedData();
                this.saveToStorage();
            }
        } catch (e) {
            console.error("Failed to load state from localStorage:", e);
            this.state.habits = generateSeedData();
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem('sustaintrack_state', JSON.stringify(this.state));
        } catch (e) {
            console.error("Failed to save state to localStorage:", e);
        }
    }

    getHabits() {
        return this.state.habits;
    }

    getChatHistory() {
        return this.state.chatHistory;
    }

    getProfile() {
        return this.state.profile;
    }

    updateProfile(updates) {
        this.state.profile = { ...this.state.profile, ...updates };
        this.saveToStorage();
    }

    addHabit(entry) {
        const newEntry = {
            id: 'habit-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            date: entry.date || new Date().toISOString().split('T')[0],
            category: entry.category,
            amount: Number(entry.amount),
            type: entry.type || null, // for transport
            description: entry.description || ''
        };
        
        this.state.habits.push(newEntry);
        this.saveToStorage();
        return newEntry;
    }

    deleteHabit(id) {
        this.state.habits = this.state.habits.filter(h => h.id !== id);
        this.saveToStorage();
    }

    addChatMessage(sender, text, suggestions = null) {
        const msg = {
            sender,
            text,
            timestamp: new Date().toISOString(),
            suggestions
        };
        this.state.chatHistory.push(msg);
        // Cap chat history to last 50 messages
        if (this.state.chatHistory.length > 50) {
            this.state.chatHistory.shift();
        }
        this.saveToStorage();
        return msg;
    }

    clearChatHistory() {
        this.state.chatHistory = [DEFAULT_STATE.chatHistory[0]];
        this.saveToStorage();
    }

    completeRecommendation(recId) {
        if (!this.state.completedRecommendations.includes(recId)) {
            this.state.completedRecommendations.push(recId);
            this.saveToStorage();
            return true;
        }
        return false;
    }

    getCompletedRecommendations() {
        return this.state.completedRecommendations || [];
    }

    // Mathematical calculators
    calculateCarbon(category, amount, type = null) {
        if (category === 'transport') {
            const factor = CARBON_FACTORS.transport[type] || CARBON_FACTORS.transport.gas;
            return amount * factor;
        }
        const factor = CARBON_FACTORS[category] || 0;
        return amount * factor;
    }

    calculateCost(category, amount, type = null) {
        if (category === 'transport') {
            const cost = UNIT_COSTS.transport[type] || UNIT_COSTS.transport.gas;
            return amount * cost;
        }
        const cost = UNIT_COSTS[category] || 0;
        return amount * cost;
    }

    // Get aggregated stats for dashboard
    getTotalsForDate(dateStr) {
        const dayLogs = this.state.habits.filter(h => h.date === dateStr);
        
        let electricity = 0;
        let water = 0;
        let waste = 0;
        let carbon = 0;
        let cost = 0;
        
        dayLogs.forEach(h => {
            const cab = this.calculateCarbon(h.category, h.amount, h.type);
            const cst = this.calculateCost(h.category, h.amount, h.type);
            carbon += cab;
            cost += cst;
            
            if (h.category === 'electricity') electricity += h.amount;
            else if (h.category === 'water') water += h.amount;
            else if (h.category === 'waste') waste += h.amount;
        });
        
        return { electricity, water, waste, carbon, cost };
    }

    getWeeklyAverages() {
        const last7Days = [];
        const now = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            last7Days.push(d.toISOString().split('T')[0]);
        }
        
        let totals = { electricity: 0, water: 0, waste: 0, carbon: 0, cost: 0 };
        let activeDays = 0;
        
        last7Days.forEach(date => {
            const dayStats = this.getTotalsForDate(date);
            totals.electricity += dayStats.electricity;
            totals.water += dayStats.water;
            totals.waste += dayStats.waste;
            totals.carbon += dayStats.carbon;
            totals.cost += dayStats.cost;
        });
        
        return {
            electricity: totals.electricity / 7,
            water: totals.water / 7,
            waste: totals.waste / 7,
            carbon: totals.carbon / 7,
            cost: totals.cost / 7
        };
    }
}

// Export for other scripts
window.dataStore = new DataStore();
