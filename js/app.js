/**
 * SustainTrack - Main Router & UI Glue Controller
 * Manages tab rendering, application events, AI chat messaging, and recommendations updates.
 */

const RECOMMENDATIONS_DB = [
    {
        id: 'rec-led',
        category: 'electricity',
        title: 'Upgrade to LED lighting',
        desc: 'Swap 5 of your most frequently used traditional incandescent bulbs for energy-efficient LEDs.',
        difficulty: 'Easy',
        co2Saved: 150, // kg CO2 / year
        moneySaved: 28,  // $ / year
        icon: '💡'
    },
    {
        id: 'rec-shower',
        category: 'water',
        title: 'Shave 3 min off shower',
        desc: 'Keep showers to under 5 minutes. Use a visual timer or playing a short song to guide you.',
        difficulty: 'Easy',
        co2Saved: 220,
        moneySaved: 35,
        icon: '⏱️'
    },
    {
        id: 'rec-compost',
        category: 'waste',
        title: 'Start food scrap composting',
        desc: 'Separate vegetable skins, coffee grounds, and food leftovers from normal garbage into a backyard/municipal compost.',
        difficulty: 'Medium',
        co2Saved: 290,
        moneySaved: 12,
        icon: '🍂'
    },
    {
        id: 'rec-commute',
        category: 'transport',
        title: 'Cycle or public transit 2x/wk',
        desc: 'Leave the car in the garage two days a week and commute via bicycle or bus/subway.',
        difficulty: 'Medium',
        co2Saved: 480,
        moneySaved: 150,
        icon: '🚌'
    },
    {
        id: 'rec-vampire',
        category: 'electricity',
        title: 'Banish vampire energy',
        desc: 'Plug TV, video game consoles, and chargers into a smart power strip that turns off completely when not in use.',
        difficulty: 'Easy',
        co2Saved: 95,
        moneySaved: 18,
        icon: '🔌'
    },
    {
        id: 'rec-solar',
        category: 'electricity',
        title: 'Install solar panel array',
        desc: 'Install standard 5kW rooftop solar panels. (Long-term financial investment with high carbon payoff).',
        difficulty: 'Hard',
        co2Saved: 2400,
        moneySaved: 650,
        icon: '☀️'
    }
];

class AppController {
    constructor() {
        this.currentTab = 'dashboard'; // dashboard, tracker, recommendations, simulator, ai-chat
    }

    init() {
        this.setupNavigation();
        this.setupChatUI();
        this.setupProfileUI();
        this.renderRecommendations();
        
        // Initialize child controllers
        if (window.dashboardController) window.dashboardController.init();
        if (window.trackerController) window.trackerController.init();
        if (window.simulatorController) window.simulatorController.init();
        
        // Set initial view state
        this.switchTab(this.currentTab);
        
        // Initial chat render
        this.renderChatHistory();
        
        // Initial profile display updates
        this.updateProfileDisplay();
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-menu-list li');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                const tab = link.dataset.tab;
                if (tab) {
                    navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                    this.switchTab(tab);
                }
            });
        });

        // Set default date picker value to today
        const picker = document.getElementById('log-date-picker');
        if (picker) {
            picker.value = new Date().toISOString().split('T')[0];
        }
    }

    setupProfileUI() {
        const profileCard = document.getElementById('sidebar-profile-card');
        const modal = document.getElementById('profile-modal');
        const closeBtn = document.getElementById('close-profile-modal');
        const form = document.getElementById('profile-settings-form');
        
        if (profileCard && modal) {
            profileCard.addEventListener('click', () => {
                const profile = window.dataStore.getProfile();
                document.getElementById('profile-input-name').value = profile.name || '';
                document.getElementById('profile-input-goal').value = profile.sustainabilityGoal || 'reduce-carbon';
                document.getElementById('profile-input-household').value = profile.householdSize || 1;
                modal.classList.add('active');
            });
        }
        
        if (modal && closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        }
        
        if (form && modal) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('profile-input-name').value.trim();
                const goal = document.getElementById('profile-input-goal').value;
                const householdSize = parseInt(document.getElementById('profile-input-household').value) || 1;
                
                window.dataStore.updateProfile({
                    name: name,
                    sustainabilityGoal: goal,
                    householdSize: householdSize
                });
                
                this.updateProfileDisplay();
                modal.classList.remove('active');
                
                // Show toast or trigger refresh
                if (window.trackerController) {
                    window.trackerController.showToast('Profile updated successfully!');
                }
                
                // Refresh dashboard to apply changes
                if (window.dashboardController) {
                    window.dashboardController.renderAll();
                }
            });
        }
    }

    updateProfileDisplay() {
        const profile = window.dataStore.getProfile();
        const sidebarName = document.getElementById('sidebar-profile-name');
        const welcomeName = document.getElementById('dashboard-welcome-name');
        
        if (sidebarName) {
            sidebarName.textContent = profile.name || 'Eco Explorer';
        }
        if (welcomeName) {
            welcomeName.textContent = profile.name || 'Explorer';
        }
    }

    switchTab(tabId) {
        this.currentTab = tabId;
        
        // Hide all views
        const views = document.querySelectorAll('.app-view-panel');
        views.forEach(v => v.classList.remove('active'));
        
        // Show selected view
        const targetView = document.getElementById(`view-${tabId}`);
        if (targetView) {
            targetView.classList.add('active');
        }

        // Re-trigger layout calculations if switching to dashboard
        if (tabId === 'dashboard' && window.dashboardController) {
            window.dashboardController.renderAll();
        }
        
        // Scroll chats to bottom if switching to chatbot
        if (tabId === 'ai-chat') {
            this.scrollChatToBottom();
        }
    }

    onDataChanged() {
        // Redraw active tab
        if (this.currentTab === 'dashboard' && window.dashboardController) {
            window.dashboardController.renderAll();
        } else if (this.currentTab === 'tracker' && window.trackerController) {
            window.trackerController.updateImpactPreview();
        }
    }

    /* --- Chat Agent Interface --- */
    setupChatUI() {
        const sendBtn = document.getElementById('chat-send-btn');
        const input = document.getElementById('chat-input-box');
        
        if (sendBtn && input) {
            const handleSend = async () => {
                const text = input.value.trim();
                if (!text) return;
                
                input.value = '';
                await this.sendMessage(text);
            };

            sendBtn.addEventListener('click', handleSend);
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleSend();
                }
            });
        }

        // Clear history button
        const clearBtn = document.getElementById('clear-chat-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm("Reset conversation history?")) {
                    window.dataStore.clearChatHistory();
                    this.renderChatHistory();
                }
            });
        }
    }

    async sendMessage(text) {
        // Append User Message
        window.dataStore.addChatMessage('user', text);
        this.renderChatHistory();
        this.scrollChatToBottom();

        // Render AI Typing state
        this.showTypingState(true);
        this.scrollChatToBottom();

        // Get AI response
        const { reply, suggestions } = await window.aiAgent.getResponse(text, window.dataStore);
        
        // Remove typing, Append AI Message
        this.showTypingState(false);
        window.dataStore.addChatMessage('agent', reply, suggestions);
        
        this.renderChatHistory();
        this.scrollChatToBottom();
    }

    renderChatHistory() {
        const container = document.getElementById('chat-messages-container');
        if (!container) return;

        const history = window.dataStore.getChatHistory();
        
        let html = history.map(msg => {
            const isUser = msg.sender === 'user';
            
            // Format Markdown bolding and carriage returns inside AI text
            let textFormatted = msg.text;
            if (!isUser) {
                textFormatted = textFormatted
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/### (.*?)\n/g, '<h4>$1</h4>')
                    .replace(/- (.*?)\n/g, '<li>$1</li>')
                    .replace(/\n\n/g, '<br/><br/>')
                    .replace(/\n/g, '<br/>');
                
                // Wrap bullet elements if any exist
                if (textFormatted.includes('<li>')) {
                    // Quick crude patch to wrap consecutive list tags (sufficient for simulated chat md)
                    textFormatted = textFormatted.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>').replace(/<\/ul><br\/><ul>/g, '').replace(/<\/ul><ul>/g, '');
                }
            } else {
                // Escape simple HTML inside user query
                textFormatted = textFormatted.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            }

            let chipHtml = '';
            if (msg.suggestions && msg.suggestions.length > 0) {
                chipHtml = `
                    <div class="chat-suggestion-chips">
                        ${msg.suggestions.map(s => `<button class="suggestion-chip">${s}</button>`).join('')}
                    </div>
                `;
            }

            return `
                <div class="message-bubble-wrapper ${isUser ? 'user-wrapper' : 'agent-wrapper'}">
                    <div class="message-avatar">${isUser ? '👤' : '✨'}</div>
                    <div class="message-bubble">
                        <div class="message-text">${textFormatted}</div>
                        ${chipHtml}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;

        // Add event listeners to suggestion chips
        const chips = container.querySelectorAll('.suggestion-chip');
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                this.sendMessage(chip.textContent);
            });
        });
    }

    showTypingState(show) {
        const container = document.getElementById('chat-messages-container');
        if (!container) return;

        const typingBubble = document.getElementById('chat-typing-bubble');
        if (show) {
            if (!typingBubble) {
                const bubble = document.createElement('div');
                bubble.id = 'chat-typing-bubble';
                bubble.className = 'message-bubble-wrapper agent-wrapper';
                bubble.innerHTML = `
                    <div class="message-avatar">✨</div>
                    <div class="message-bubble typing-state">
                        <span class="dot"></span>
                        <span class="dot"></span>
                        <span class="dot"></span>
                    </div>
                `;
                container.appendChild(bubble);
            }
        } else {
            if (typingBubble) {
                typingBubble.remove();
            }
        }
    }

    scrollChatToBottom() {
        const container = document.getElementById('chat-messages-container');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    /* --- Recommendations Page --- */
    renderRecommendations() {
        const container = document.getElementById('recommendations-grid');
        if (!container) return;

        const completed = window.dataStore.getCompletedRecommendations();

        container.innerHTML = RECOMMENDATIONS_DB.map(rec => {
            const isDone = completed.includes(rec.id);
            const badgeClass = rec.difficulty.toLowerCase();
            
            return `
                <div class="rec-card ${isDone ? 'completed' : ''}" id="card-${rec.id}">
                    <div class="rec-hdr">
                        <span class="rec-icon">${rec.icon}</span>
                        <span class="difficulty-badge ${badgeClass}">${rec.difficulty}</span>
                    </div>
                    <h3>${rec.title}</h3>
                    <p>${rec.desc}</p>
                    <div class="rec-impacts">
                        <span class="rec-impact co2">🌿 -${rec.co2Saved} kg CO₂/yr</span>
                        <span class="rec-impact cash">💰 +$${rec.moneySaved}/yr</span>
                    </div>
                    <div class="rec-footer">
                        ${isDone ? 
                            `<span class="completed-tag">🎉 Done (+5 Score)</span>` : 
                            `<button class="commit-btn" data-id="${rec.id}">Accept Action</button>`
                        }
                    </div>
                </div>
            `;
        }).join('');

        // Wire accept/complete buttons
        container.querySelectorAll('.commit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.dataset.id;
                const rec = RECOMMENDATIONS_DB.find(r => r.id === id);
                if (rec && window.dataStore.completeRecommendation(id)) {
                    // Show animation / reload
                    this.renderRecommendations();
                    if (window.dashboardController) window.dashboardController.renderAll();
                    
                    // Alert success
                    let toast = document.getElementById('tracker-toast');
                    if (toast && window.trackerController) {
                        window.trackerController.showToast(`Action Committed! +5 Sustainability Score points.`);
                    } else {
                        alert(`Action Committed! You earned +5 points.`);
                    }
                }
            });
        });
    }
}

// Global hookup
document.addEventListener('DOMContentLoaded', () => {
    window.appController = new AppController();
    window.appController.init();
});
