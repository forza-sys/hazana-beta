/**
 * HAZANA AI Assistant Logic
 * Injects the AI interface and handles mock conversation
 */
class HazanaAI {
    constructor() {
        this.isOpen = false;
        this.init();
    }

    init() {
        this.injectHTML();
        this.addEventListeners();
        this.addWelcomeMessage();
    }

    injectHTML() {
        const aiContainer = document.createElement('div');
        aiContainer.id = 'hazana-ai-container';
        aiContainer.innerHTML = `
            <button class="ai-floating-btn" id="ai-toggle-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: white;">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                    <path d="M5 3v4M19 17v4M3 5h4M17 19h4"/>
                </svg>
            </button>
            <div class="ai-chat-window" id="ai-chat-window">
                <div class="ai-chat-header">
                    <div class="ai-chat-header-info">
                        <div class="ai-avatar" style="background: #fbbf24; color: #78350f;">N</div>
                        <div>
                            <div style="font-weight: 600; font-size: 0.95rem;">NUJUM</div>
                            <div style="font-size: 0.7rem; opacity: 0.8;">Navigasi & Prediksi Data</div>
                        </div>
                    </div>
                    <button id="ai-close-btn" style="background:none; border:none; color:white; cursor:pointer;"><i class="fas fa-times"></i></button>
                </div>
                <div class="ai-chat-body" id="ai-chat-body">
                    <!-- Messages will appear here -->
                </div>
                <div class="ai-chat-footer">
                    <input type="text" class="ai-input" id="ai-chat-input" placeholder="Tanya sesuatu ke NUJUM...">
                    <button class="ai-send-btn" id="ai-send-btn">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(aiContainer);
    }

    addEventListeners() {
        const toggleBtn = document.getElementById('ai-toggle-btn');
        const closeBtn = document.getElementById('ai-close-btn');
        const chatWindow = document.getElementById('ai-chat-window');
        const sendBtn = document.getElementById('ai-send-btn');
        const input = document.getElementById('ai-chat-input');

        toggleBtn.addEventListener('click', () => this.toggleChat());
        closeBtn.addEventListener('click', () => this.toggleChat());

        sendBtn.addEventListener('click', () => this.handleSendMessage());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSendMessage();
        });
    }

    toggleChat() {
        const chatWindow = document.getElementById('ai-chat-window');
        this.isOpen = !this.isOpen;
        chatWindow.style.display = this.isOpen ? 'flex' : 'none';
        if (this.isOpen) document.getElementById('ai-chat-input').focus();
    }

    getOrgName() {
        if (typeof HazanaAuth !== 'undefined') {
            const user = HazanaAuth.getCurrentUser();
            if (user && user.org) return user.org;
        }
        return 'HAZANA';
    }

    addWelcomeMessage() {
        const orgName = this.getOrgName();
        const welcome = `Salam, Kakak! Saya NUJUM. Layaknya bintang yang menuntun arah di tengah samudra, saya hadir untuk membantu Kakak menavigasi data lembaga dan memprediksi langkah strategis ${orgName} ke depan. Apa yang ingin kita analisis hari ini?`;
        this.appendMessage('ai', welcome);
    }

    // Update this with your actual API Key from Google AI Studio
    getApiKey() {
        return "MASUKKAN_API_KEY_BARU_DISINI"; 
    }

    async handleSendMessage() {
        const input = document.getElementById('ai-chat-input');
        const message = input.value.trim();
        const apiKey = this.getApiKey();

        if (!message) return;
        
        if (apiKey === "MASUKKAN_API_KEY_BARU_DISINI" || !apiKey) {
             this.appendMessage('ai', 'Maaf Kakak, sistem AI sedang offline. Minta tolong tim IT untuk memperbarui **Gemini API Key** di dalam sistem ya!');
             input.value = '';
             return;
        }

        this.appendMessage('user', message);
        input.value = '';

        this.showTyping(true);
        const orgName = this.getOrgName();

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Kamu adalah NUJUM, asisten AI pintar untuk platform HAZANA (Harmoni Zakat Nasional). 
                            HAZANA adalah platform dashboard untuk Organisasi Pengelola Zakat (OPZ) anggota Forum Zakat.
                            Tugasmu adalah membantu Amil Zakat dalam menganalisis data, memberikan saran strategis, dan menjawab pertanyaan seputar operasional lembaga ${orgName}.
                            Gaya bicaramu: Sopan, profesional, membantu, namun tetap akrab dengan memanggil user 'Kakak' atau 'Kak'.
                            Gunakan metafora bintang atau navigasi sesekali untuk memperkuat identitas namamu.
                            
                            Pertanyaan User: ${message}`
                        }]
                    }]
                })
            });

            const data = await response.json();
            this.showTyping(false);

            if (!response.ok) {
                console.error("Gemini API Error Detail:", data);
                const errorMsg = data.error ? data.error.message : "Gangguan koneksi API";
                throw new Error(errorMsg);
            }

            if (data.candidates && data.candidates[0].content.parts[0].text) {
                const aiResponse = data.candidates[0].content.parts[0].text;
                this.appendMessage('ai', aiResponse);
            } else {
                throw new Error("Gagal mendapatkan jawaban dari Gemini.");
            }
        } catch (err) {
            console.error("Full Gemini Error:", err);
            this.showTyping(false);
            this.appendMessage('ai', `Maaf Kakak, sepertinya ada gangguan di 'cakrawala' data saya. Eror: ${err.message}. Coba lagi sebentar ya!`);
        }
    }

    appendMessage(sender, text) {
        const body = document.getElementById('ai-chat-body');
        const msgDiv = document.createElement('div');
        msgDiv.className = `msg msg-${sender}`;
        
        // Handle markdown-like formatting from AI (simple replacement)
        if (sender === 'ai') {
            text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            text = text.replace(/\n/g, '<br>');
        }
        
        msgDiv.innerHTML = text;
        body.appendChild(msgDiv);
        body.scrollTop = body.scrollHeight;
    }

    showTyping(show) {
        const body = document.getElementById('ai-chat-body');
        if (show) {
            const typingDiv = document.createElement('div');
            typingDiv.id = 'ai-typing';
            typingDiv.className = 'typing';
            typingDiv.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> NUJUM sedang memetakan data...';
            body.appendChild(typingDiv);
        } else {
            const typingDiv = document.getElementById('ai-typing');
            if (typingDiv) typingDiv.remove();
        }
        body.scrollTop = body.scrollHeight;
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    window.hazanaAI = new HazanaAI();
});
