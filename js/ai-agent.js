/**
 * SustainTrack - AI Sustainability Agent (Sustaina)
 * Handles semantic responses, data scanning, and custom recommendations in chatbot interface.
 */

const AI_KNOWLEDGE_BASE = {
    water: {
        tips: [
            "**Shorten showers:** Reducing your shower by 2 minutes saves up to 40 liters of water.",
            "**Brushing faucet:** Turning off the tap while brushing saves 10-15 liters per minute.",
            "**Full loads only:** Wait until your dishwasher/washing machine is full before running them.",
            "**Check leaks:** A dripping tap can waste 5,000+ liters of water a year.",
            "**Aerators:** Installing low-flow faucet aerators reduces water usage by 30%."
        ],
        keywords: ['water', 'shower', 'wash', 'leak', 'toilet', 'bath', 'hose', 'drink']
    },
    electricity: {
        tips: [
            "**Switch to LEDs:** LED bulbs consume 75-80% less energy than incandescents and last 25x longer.",
            "**Unplug vampires:** Standby energy from electronics (TVs, chargers) accounts for 10% of electric bills.",
            "**Thermostat rule:** Keep it at 78°F (25°C) in summer and 68°F (20°C) in winter. Every degree saves 3-5% on HVAC bills.",
            "**Cold water wash:** 90% of a washing machine's energy goes to heating water. Wash on cold!",
            "**Air dry:** Ditching the dryer for a clothesline saves about 150 kg of CO2 and $80 a year."
        ],
        keywords: ['electric', 'power', 'bulb', 'led', 'energy', 'heater', 'ac', 'cooling', 'fridge', 'appliances']
    },
    waste: {
        tips: [
            "**Compost organic scraps:** Kitchen waste in landfills creates methane. Composting reduces it to zero carbon impact.",
            "**Avoid single-use plastics:** Bring a canvas tote bag and reusable water bottle.",
            "**Meal planning:** 30% of all food bought is thrown away. Plan meals to avoid food spoilage.",
            "**Buy in bulk:** Packaging counts for 15% of your waste bill. Buy larger, concentrated products.",
            "**Donate & repurpose:** Before throwing away clothing or electronics, check if a local charity accepts them."
        ],
        keywords: ['waste', 'garbage', 'plastic', 'recycle', 'compost', 'food waste', 'trash', 'paper']
    },
    transport: {
        tips: [
            "**Active transit:** Commuting by bike or foot has a 0kg CO2 footprint and saves $1,500/year in vehicle upkeep.",
            "**Carpooling:** Sharing rides divides your commuting emissions by the number of passengers.",
            "**Public transport:** Trains and buses emit 80% less CO2 per mile compared to single-occupant gasoline cars.",
            "**Tire pressure:** Keep tires inflated. Under-inflated tires waste fuel and increase emissions by 3%.",
            "**Smooth driving:** Rapid acceleration and heavy braking lower fuel mileage by up to 33%."
        ],
        keywords: ['drive', 'car', 'fuel', 'gas', 'transit', 'bus', 'train', 'cycle', 'bike', 'commute', 'flight', 'travel']
    },
    general: {
        tips: [
            "**Adopt a green routine:** Small daily improvements (like turning off standby power) accumulate huge annual impacts.",
            "**Check the Simulator:** Click the 'What-If Simulator' tab to see how changes in your diet and lifestyle save money.",
            "**Eat plant-forward:** Eating one plant-based meal a day saves about 200 kg of CO2 per year."
        ]
    }
};

class AIAgent {
    constructor() {
        this.isTyping = false;
    }

    /**
     * Scans the user data and provides a customized alert/warning if carbon/usage exceeds targets.
     */
    analyzeHabits(dataStore) {
        const weekly = dataStore.getWeeklyAverages();
        const targets = DAILY_TARGETS;
        const alerts = [];

        if (weekly.water > targets.water) {
            alerts.push({
                category: 'water',
                severity: 'warning',
                text: `Water consumption is averaging **${Math.round(weekly.water)} L/day** (target is ${targets.water} L). Try taking shorter showers.`
            });
        }
        if (weekly.electricity > targets.electricity) {
            alerts.push({
                category: 'electricity',
                severity: 'warning',
                text: `Electricity usage averages **${weekly.electricity.toFixed(1)} kWh/day** (target is ${targets.electricity} kWh). Turn off standby power to reduce baseline loads.`
            });
        }
        if (weekly.waste > targets.waste) {
            alerts.push({
                category: 'waste',
                severity: 'warning',
                text: `Waste production averages **${weekly.waste.toFixed(2)} kg/day** (target is ${targets.waste} kg). Consider starting a kitchen compost.`
            });
        }
        if (weekly.carbon > targets.carbon) {
            alerts.push({
                category: 'carbon',
                severity: 'info',
                text: `Total daily footprint averages **${weekly.carbon.toFixed(1)} kg CO2**, exceeding your eco-target of ${targets.carbon} kg.`
            });
        }

        return alerts;
    }

    /**
     * Processes user inputs and returns a structured conversational response.
     */
    async getResponse(userInput, dataStore) {
        this.isTyping = true;
        
        // Short artificial delay to simulate "AI thinking" (500ms - 1000ms)
        await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));
        
        this.isTyping = false;
        
        const query = userInput.toLowerCase();
        let reply = "";
        let suggestions = [];
        let categoryMatched = null;

        // Check for specific greetings or introductions
        if (query.match(/\b(hello|hi|hey|greetings|welcome)\b/)) {
            reply = "Hello there! I'm Sustaina, your eco-advisor. How can I help you improve your sustainability footprint today?";
            suggestions = ["How's my footprint looking?", "Water-saving hacks", "Let's run a What-If simulation"];
            return { reply, suggestions };
        }

        // Check for suggestions or next action trigger
        if (query.includes('next') || query.includes('should i do') || query.includes('recommend') || query.includes('suggest') || query.includes('action') || query.includes('hack')) {
            const profile = dataStore.getProfile();
            const goal = profile.sustainabilityGoal || 'reduce-carbon';
            const completedRecs = dataStore.getCompletedRecommendations();
            
            // RECOMMENDATIONS_DB from app.js
            const recsDB = typeof RECOMMENDATIONS_DB !== 'undefined' ? RECOMMENDATIONS_DB : [];
            const uncompleted = recsDB.filter(r => !completedRecs.includes(r.id));
            
            let recommendedAction = null;
            if (uncompleted.length > 0) {
                if (goal === 'reduce-carbon') {
                    uncompleted.sort((a, b) => b.co2Saved - a.co2Saved);
                    recommendedAction = uncompleted[0];
                } else if (goal === 'save-money') {
                    uncompleted.sort((a, b) => b.moneySaved - a.moneySaved);
                    recommendedAction = uncompleted[0];
                } else if (goal === 'zero-waste') {
                    const wasteRecs = uncompleted.filter(r => r.category === 'waste');
                    if (wasteRecs.length > 0) {
                        wasteRecs.sort((a, b) => b.co2Saved - a.co2Saved);
                        recommendedAction = wasteRecs[0];
                    } else {
                        uncompleted.sort((a, b) => b.co2Saved - a.co2Saved);
                        recommendedAction = uncompleted[0];
                    }
                } else {
                    recommendedAction = uncompleted[0];
                }
            }
            
            if (recommendedAction) {
                reply = `Based on your goal to **${goal.replace('-', ' ')}**, here is the best action you can take next:\n\n`;
                reply += `${recommendedAction.icon} **${recommendedAction.title}** (${recommendedAction.difficulty} difficulty)\n`;
                reply += `${recommendedAction.desc}\n\n`;
                reply += `- 🌿 **Expected Carbon Cut:** ${recommendedAction.co2Saved} kg CO₂/yr\n`;
                reply += `- 💰 **Expected Dollars Saved:** $${recommendedAction.moneySaved}/yr\n\n`;
                reply += `You can commit to this in the **Action Hub** tab to earn +5 points!`;
                
                suggestions = ["What should I do next?", "Show my footprint summary", "How to save water"];
                return { reply, suggestions };
            } else {
                reply = `🎉 **Amazing!** You have completed all recommendations in the Action Hub. You are a true Sustainability Champion!`;
                suggestions = ["Show my footprint summary", "Water-saving hacks", "Ways to reduce electric bill"];
                return { reply, suggestions };
            }
        }

        // Check for analytics trigger
        if (query.includes('footprint') || query.includes('how am i') || query.includes('summary') || query.includes('report') || query.includes('status')) {
            const weekly = dataStore.getWeeklyAverages();
            const alerts = this.analyzeHabits(dataStore);
            
            reply = `Here is your current **Weekly Sustainability Summary**:\n\n`;
            reply += `- 🔌 **Electricity:** ${weekly.electricity.toFixed(1)} kWh/day (Cost: $${(weekly.electricity * UNIT_COSTS.electricity).toFixed(2)})\n`;
            reply += `- 💧 **Water:** ${Math.round(weekly.water)} Liters/day (Cost: $${(weekly.water * UNIT_COSTS.water).toFixed(2)})\n`;
            reply += `- 🗑️ **Waste:** ${weekly.waste.toFixed(2)} kg/day\n`;
            reply += `- 🚗 **Carbon Footprint:** ${weekly.carbon.toFixed(1)} kg CO₂/day (Cost: $${weekly.cost.toFixed(2)}/day)\n\n`;
            
            if (alerts.length > 0) {
                reply += `### 💡 High-Priority Advice:\n`;
                alerts.forEach(alert => {
                    reply += `- ${alert.text}\n`;
                });
            } else {
                reply += `🎉 **Amazing job!** You are meeting or exceeding all your sustainability goals. Keep up the clean routine!`;
            }
            
            suggestions = ["Compare electricity tips", "Analyze water usage", "Eco recommendations"];
            return { reply, suggestions };
        }

        // Keywords matching in Knowledge Base
        for (const [cat, kb] of Object.entries(AI_KNOWLEDGE_BASE)) {
            if (kb.keywords && kb.keywords.some(kw => query.includes(kw))) {
                categoryMatched = cat;
                break;
            }
        }

        if (categoryMatched) {
            const kb = AI_KNOWLEDGE_BASE[categoryMatched];
            const randomTip = kb.tips[Math.floor(Math.random() * kb.tips.length)];
            const otherTips = kb.tips.filter(t => t !== randomTip);
            
            reply = `Sure, here are some actionable recommendations for **${categoryMatched.toUpperCase()}** management:\n\n`;
            reply += `⭐ **Top Recommendation:** ${randomTip}\n\n`;
            reply += `### Other tips:\n`;
            otherTips.slice(0, 2).forEach(t => {
                reply += `- ${t}\n`;
            });
            
            // Context aware savings info
            if (categoryMatched === 'water') {
                reply += `\n*Note: Reducing water usage also reduces sewage fees and water heater electricity usage!*`;
                suggestions = ["Tell me about waste recycling", "Show my carbon footprint", "How to save electricity"];
            } else if (categoryMatched === 'electricity') {
                reply += `\n*Did you know? Heating and cooling account for nearly 50% of home electricity use.*`;
                suggestions = ["Water savings", "Tell me about vampire energy", "Explain transport CO2"];
            } else if (categoryMatched === 'waste') {
                reply += `\n*Pro tip: Separating organics from landfill rubbish is the fastest way to drop waste emissions.*`;
                suggestions = ["Composting tips", "Explain plastic codes", "How to save electricity"];
            } else if (categoryMatched === 'transport') {
                reply += `\n*Hint: If you carpool to work with just one coworker, you immediately halve your travel emissions.*`;
                suggestions = ["Calculate car vs bus CO2", "Electric car footprint", "Water savings"];
            }
        } else {
            // General conversation fallback
            reply = "I see! To live more sustainably, focusing on **small, continuous daily habits** is key. Would you like tips on a specific category, or should we run some numbers in the What-If Simulator?\n\n";
            reply += "I can provide advice on: \n";
            reply += "🔌 **Electricity** | 💧 **Water** | 🗑️ **Waste** | 🚗 **Transport**";
            
            suggestions = ["Reduce energy waste", "Reduce water bills", "Tell me about composting", "Show my footprint"];
        }

        return { reply, suggestions };
    }
}

window.aiAgent = new AIAgent();
