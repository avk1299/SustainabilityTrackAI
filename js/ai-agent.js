/**
 * SustainTrack - AI Sustainability Agent (Sustaina)
 * Handles semantic responses, data scanning, and custom recommendations in chatbot interface.
 */

const AI_KNOWLEDGE_BASE = {
    water: {
        tips: [
            "**Shorten showers:** Reducing your shower by 2 minutes saves up to 40 liters of water.",
            "**Brushing faucet:** Turning off the tap while brushing saves 10–15 liters per minute.",
            "**Full loads only:** Wait until your dishwasher/washing machine is full before running it.",
            "**Fix leaks:** A dripping tap wastes 5,000+ liters of water a year — fix it this weekend!",
            "**Low-flow aerators:** Installing low-flow faucet aerators reduces water use by up to 30%.",
            "**Cold water washing:** Washing clothes on cold saves about 90% of the energy used per load."
        ],
        keywords: ['water', 'shower', 'wash', 'leak', 'toilet', 'bath', 'hose', 'drink', 'hydro']
    },
    electricity: {
        tips: [
            "**Switch to LEDs:** LED bulbs consume 75–80% less energy than incandescents and last 25× longer.",
            "**Unplug vampires:** Standby power from TVs and chargers can account for 10% of your electricity bill.",
            "**Thermostat rule:** Every 1°F adjustment saves 3–5% on HVAC costs. Set it to 78°F in summer.",
            "**Cold water wash:** 90% of a washing machine's energy goes to heating water. Wash cold!",
            "**Air dry:** Ditching the dryer saves ~150 kg CO₂ and $80 a year.",
            "**Smart power strips:** Automatically cut phantom load from entertainment centres and office gear."
        ],
        keywords: ['electric', 'power', 'bulb', 'led', 'energy', 'heater', 'ac', 'cooling', 'fridge', 'appliance', 'watt', 'kwh', 'bill']
    },
    waste: {
        tips: [
            "**Compost organic scraps:** Kitchen waste in landfills creates methane — composting reduces it to zero.",
            "**Avoid single-use plastics:** Bring a canvas tote and reusable water bottle everywhere.",
            "**Meal planning:** 30% of all food bought is thrown away. Plan meals weekly to cut waste.",
            "**Buy in bulk:** Packaging accounts for 15% of your waste bill. Choose concentrated formats.",
            "**Donate & repurpose:** Before throwing clothing or electronics away, check local charities.",
            "**Repair culture:** Fixing electronics and clothing extends product life and keeps them out of landfill."
        ],
        keywords: ['waste', 'garbage', 'plastic', 'recycle', 'compost', 'food waste', 'trash', 'paper', 'packaging', 'bin', 'landfill']
    },
    transport: {
        tips: [
            "**Active transit:** Cycling or walking has a 0 kg CO₂ footprint and saves $1,500/yr in fuel.",
            "**Carpooling:** Sharing a ride with one coworker immediately halves your daily emissions.",
            "**Public transport:** Trains and buses emit 80% less CO₂ per mile than single-occupant cars.",
            "**Tire pressure:** Properly inflated tires can improve fuel efficiency by up to 3%.",
            "**Smooth driving:** Gentle acceleration and early braking improve fuel mileage by up to 33%.",
            "**Trip bundling:** Combining multiple errands into one trip cuts cold-start emissions significantly."
        ],
        keywords: ['drive', 'car', 'fuel', 'gas', 'transit', 'bus', 'train', 'cycle', 'bike', 'commute', 'flight', 'travel', 'vehicle', 'mile', 'transport', 'carpool']
    },
    diet: {
        tips: [
            "**One plant-based meal/day:** Replacing one meat meal with a plant-based alternative saves ~200 kg CO₂/year.",
            "**Reduce beef intake:** Beef generates 10× more emissions than chicken and 50× more than legumes.",
            "**Local & seasonal produce:** Buying local cuts food transport emissions by up to 50%.",
            "**Reduce food waste:** 8% of global greenhouse gas emissions come from wasted food.",
            "**Legume power:** Swapping to beans and lentils twice a week saves ~100 kg CO₂ per person annually.",
            "**Frozen vegetables:** Frozen veg can have a lower carbon footprint than flown-in fresh produce."
        ],
        keywords: ['food', 'diet', 'meat', 'vegetarian', 'vegan', 'plant', 'eat', 'meal', 'beef', 'chicken', 'fish', 'grocery', 'produce']
    },
    general: {
        tips: [
            "**Adopt a green routine:** Small daily habits accumulate into massive annual reductions.",
            "**Check the Simulator:** Use the What-If Simulator tab to model how lifestyle changes save money.",
            "**Track consistently:** Users who log habits daily improve their Eco Score by 15+ points on average.",
            "**Share it:** Encouraging one friend to go sustainable doubles your real-world impact."
        ]
    }
};

class AIAgent {
    constructor() {
        this.isTyping = false;
    }

    /**
     * Analyses weekly data and returns any alerts/warnings.
     */
    analyzeHabits(dataStore) {
        const weekly  = dataStore.getWeeklyAverages();
        const targets = DAILY_TARGETS;
        const alerts  = [];

        if (weekly.water > targets.water) {
            alerts.push({
                category: 'water',
                severity: 'warning',
                text: `Water consumption averages **${Math.round(weekly.water)} L/day** (target: ${targets.water} L). Try shorter showers.`
            });
        }
        if (weekly.electricity > targets.electricity) {
            alerts.push({
                category: 'electricity',
                severity: 'warning',
                text: `Electricity usage averages **${weekly.electricity.toFixed(1)} kWh/day** (target: ${targets.electricity} kWh). Try unplugging standby devices.`
            });
        }
        if (weekly.waste > targets.waste) {
            alerts.push({
                category: 'waste',
                severity: 'warning',
                text: `Waste production averages **${weekly.waste.toFixed(2)} kg/day** (target: ${targets.waste} kg). Consider starting a kitchen compost.`
            });
        }
        if (weekly.carbon > targets.carbon) {
            alerts.push({
                category: 'carbon',
                severity: 'info',
                text: `Total carbon footprint averages **${weekly.carbon.toFixed(1)} kg CO₂/day**, exceeding your target of ${targets.carbon} kg.`
            });
        }

        return alerts;
    }

    /**
     * Main entry point: process user input and return a reply + suggestions.
     */
    async getResponse(userInput, dataStore) {
        this.isTyping = true;
        // Simulate AI thinking delay
        await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
        this.isTyping = false;

        const q = userInput.toLowerCase().trim();
        let reply       = '';
        let suggestions = [];

        // ── Greetings ────────────────────────────────────────────────────────
        if (/\b(hello|hi|hey|greetings|howdy)\b/.test(q)) {
            reply = "Hello! I'm **Sustaina**, your personal Eco AI Companion. I can analyse your footprint, give you custom tips, or help you find the biggest saving opportunity. What would you like to explore?";
            suggestions = ["Show my weekly footprint", "What's my best next action?", "Water-saving tips"];
            return { reply, suggestions };
        }

        // ── Profile / level / score ───────────────────────────────────────────
        if (q.includes('level') || q.includes('score') || q.includes('xp') || q.includes('badge') || q.includes('achievement')) {
            const profile  = dataStore.getProfile();
            const habits   = dataStore.getHabits();
            const recs     = dataStore.getCompletedRecommendations();
            const totalXP  = habits.length * 15 + recs.length * 50;
            const level    = Math.max(1, Math.floor(totalXP / 100));
            reply  = `Your current profile:\n\n`;
            reply += `- 🌿 **Name:** ${profile.name}\n`;
            reply += `- 🎯 **Goal:** ${profile.sustainabilityGoal.replace(/-/g, ' ')}\n`;
            reply += `- 📊 **Eco Score:** Check your Dashboard for the live score\n`;
            reply += `- 🏆 **XP:** ${totalXP} XP → **Level ${level} Sustainer**\n`;
            reply += `- 📋 **Habits logged:** ${habits.length}\n`;
            reply += `- ✅ **Recommendations completed:** ${recs.length}\n`;
            suggestions = ["What's my carbon footprint?", "How to earn more XP?", "Best action to take now"];
            return { reply, suggestions };
        }

        // ── XP / how to earn more ────────────────────────────────────────────
        if (q.includes('earn') || q.includes('how to level') || q.includes('more xp') || q.includes('points')) {
            reply  = `Here's how to earn more XP and level up faster:\n\n`;
            reply += `- 📋 **Log a habit** → +15 XP per entry\n`;
            reply += `- ✅ **Complete a recommendation** in the Action Hub → +50 XP\n`;
            reply += `- 🌿 **Maintain an Eco Score above 80** → +100 XP bonus\n`;
            reply += `- 🔥 **Keep a daily streak going** to unlock streak badges!\n\n`;
            reply += `The fastest path: commit to 3+ Action Hub recommendations and log habits daily.`;
            suggestions = ["Show me the Action Hub", "What's my Eco Score?", "Streak tips"];
            return { reply, suggestions };
        }

        // ── Best next action / recommendations ───────────────────────────────
        if (q.includes('next') || q.includes('recommend') || q.includes('suggest') || q.includes('action') || q.includes('what should i')) {
            const profile     = dataStore.getProfile();
            const goal        = profile.sustainabilityGoal || 'reduce-carbon';
            const completedRecs = dataStore.getCompletedRecommendations();
            const recsDB      = typeof RECOMMENDATIONS_DB !== 'undefined' ? RECOMMENDATIONS_DB : [];
            const uncompleted = recsDB.filter(r => !completedRecs.includes(r.id));

            let best = null;
            if (uncompleted.length > 0) {
                const sorted = [...uncompleted].sort((a, b) => {
                    if (goal === 'save-money')  return b.moneySaved - a.moneySaved;
                    if (goal === 'zero-waste')  return (b.category === 'waste' ? 1 : 0) - (a.category === 'waste' ? 1 : 0) || b.co2Saved - a.co2Saved;
                    return b.co2Saved - a.co2Saved;
                });
                best = sorted[0];
            }

            if (best) {
                reply  = `Based on your goal to **${goal.replace(/-/g, ' ')}**, here's your best next action:\n\n`;
                reply += `${best.icon} **${best.title}** *(${best.difficulty})*\n`;
                reply += `${best.desc}\n\n`;
                reply += `- 🌿 **Carbon savings:** ${best.co2Saved} kg CO₂/yr\n`;
                reply += `- 💰 **Money savings:** $${best.moneySaved}/yr\n\n`;
                reply += `Head to the **Action Hub** tab to commit and earn +50 XP!`;
                suggestions = ["Show another recommendation", "My weekly footprint", "Water-saving tips"];
            } else {
                reply = `🎉 **Incredible!** You've completed all Action Hub recommendations. You are a true Sustainability Champion! Keep logging daily habits to maintain your Eco Score.`;
                suggestions = ["My footprint summary", "Water tips", "Electricity tips"];
            }
            return { reply, suggestions };
        }

        // ── Footprint / summary / status ─────────────────────────────────────
        if (q.includes('footprint') || q.includes('how am i') || q.includes('summary') || q.includes('report') || q.includes('status') || q.includes('this week')) {
            const weekly = dataStore.getWeeklyAverages();
            const alerts = this.analyzeHabits(dataStore);

            reply  = `📊 **Your 7-Day Sustainability Summary:**\n\n`;
            reply += `- 🔌 **Electricity:** ${weekly.electricity.toFixed(1)} kWh/day (cost: $${(weekly.electricity * UNIT_COSTS.electricity).toFixed(2)}/day)\n`;
            reply += `- 💧 **Water:** ${Math.round(weekly.water)} L/day (cost: $${(weekly.water * UNIT_COSTS.water).toFixed(2)}/day)\n`;
            reply += `- 🗑️ **Waste:** ${weekly.waste.toFixed(2)} kg/day\n`;
            reply += `- 🌿 **Carbon:** ${weekly.carbon.toFixed(1)} kg CO₂/day\n`;
            reply += `- 💰 **Weekly cost total:** $${(weekly.cost * 7).toFixed(2)}\n\n`;

            if (alerts.length > 0) {
                reply += `### ⚠️ Areas Needing Attention:\n`;
                alerts.forEach(a => { reply += `- ${a.text}\n`; });
            } else {
                reply += `🎉 **You're hitting all targets!** Keep up the excellent eco-routine.`;
            }

            suggestions = ["Best next action", "Electricity tips", "How to compost"];
            return { reply, suggestions };
        }

        // ── Streak tips ───────────────────────────────────────────────────────
        if (q.includes('streak') || q.includes('daily') || q.includes('consistent') || q.includes('habit')) {
            reply  = `🔥 **Building a logging streak is the fastest way to level up!** Here's how:\n\n`;
            reply += `- **Log at least one category** per day — even if it's just today's electricity.\n`;
            reply += `- Set a daily reminder on your phone at the same time each evening.\n`;
            reply += `- **3-day streak** unlocks the 🔥 Clean Route badge.\n`;
            reply += `- **7-day streak** unlocks the ⚡ Weekly Warrior badge and +100 XP!\n\n`;
            reply += `*Pro tip: Use the Track Habits tab → it takes less than 30 seconds per entry.*`;
            suggestions = ["Track a habit now", "Show my badges", "My footprint summary"];
            return { reply, suggestions };
        }

        // ── Simulator / what-if ───────────────────────────────────────────────
        if (q.includes('simulat') || q.includes('what if') || q.includes('what-if') || q.includes('scenario') || q.includes('model')) {
            reply  = `🎛️ The **What-If Simulator** is one of SustainTrack's most powerful tools!\n\n`;
            reply += `You can adjust sliders for:\n`;
            reply += `- 🔥 Home heating type (gas → heat pump saves **~1,900 kg CO₂/yr**)\n`;
            reply += `- 🚿 Shower duration\n`;
            reply += `- 💡 LED lighting percentage\n`;
            reply += `- 🚗 Daily commute distance & mode\n`;
            reply += `- 🥩 Weekly meat meal count\n\n`;
            reply += `**Click the "What-If Simulator" tab** in the sidebar to try it now!`;
            suggestions = ["Show my footprint", "Commute CO2 facts", "LED bulb savings"];
            return { reply, suggestions };
        }

        // ── Keyword matching in Knowledge Base ───────────────────────────────
        let matchedCat = null;
        for (const [cat, kb] of Object.entries(AI_KNOWLEDGE_BASE)) {
            if (kb.keywords && kb.keywords.some(kw => q.includes(kw))) {
                matchedCat = cat; break;
            }
        }

        if (matchedCat) {
            const kb        = AI_KNOWLEDGE_BASE[matchedCat];
            const tip       = kb.tips[Math.floor(Math.random() * kb.tips.length)];
            const otherTips = kb.tips.filter(t => t !== tip).slice(0, 2);

            reply  = `Here are actionable recommendations for **${matchedCat.toUpperCase()}**:\n\n`;
            reply += `⭐ **Top pick:** ${tip}\n\n`;
            if (otherTips.length > 0) {
                reply += `### More tips:\n`;
                otherTips.forEach(t => { reply += `- ${t}\n`; });
            }

            const contextNotes = {
                water:       `\n*Note: Reducing hot water also cuts your water heater electricity bill!*`,
                electricity: `\n*Heating & cooling account for ~50% of typical home electricity use.*`,
                waste:       `\n*Pro tip: Separating organics from landfill is the fastest way to drop waste emissions.*`,
                transport:   `\n*Hint: Carpooling with just one colleague halves your daily commute emissions.*`,
                diet:        `\n*Swapping one meat meal per day saves about 200 kg CO₂ per year.*`
            };
            if (contextNotes[matchedCat]) reply += contextNotes[matchedCat];

            const followUps = {
                water:       ["Electricity tips", "Show my footprint", "Best next action"],
                electricity: ["Water savings", "Explain vampire energy", "Show my footprint"],
                waste:       ["Composting guide", "Plastic recycling", "Electricity tips"],
                transport:   ["Electric car vs bus CO₂", "Active commute tips", "My footprint"],
                diet:        ["Plant-based meals guide", "Food waste tips", "My footprint"]
            };
            suggestions = followUps[matchedCat] || ["Show my footprint", "Best next action"];
            return { reply, suggestions };
        }

        // ── Fallback ─────────────────────────────────────────────────────────
        reply  = `Great question! To live more sustainably, **small consistent daily habits** create the biggest annual impact.\n\n`;
        reply += `I can help you with:\n`;
        reply += `🔌 **Electricity** | 💧 **Water** | 🗑️ **Waste** | 🚗 **Transport** | 🥩 **Diet**\n\n`;
        reply += `Or ask me to *"Show my footprint"*, *"What should I do next?"*, or *"Explain the simulator"*.`;
        suggestions = ["Show my weekly footprint", "What should I do next?", "Electricity-saving tips", "Water tips"];
        return { reply, suggestions };
    }
}

window.aiAgent = new AIAgent();
