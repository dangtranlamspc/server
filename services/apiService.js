const { GoogleGenerativeAI } = require("@google/generative-ai");

class AIService {
    constructor() {
        this.provider = process.env.AI_PROVIDER || 'openai';

        if (this.provider === 'openai') {
            this.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY
            });
        } else if (this.provider === 'claude') {
            this.anthropic = new Anthropic({
                apiKey: process.env.ANTHROPIC_API_KEY,
            });
        } else if (this.provider === 'gemini') {
            this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        }
    }

    async getResponse(message, conversationHistory = []) {
        switch (this.provider) {
            case 'gemini':
                return await this.getGeminiResponse(message, conversationHistory);
        }
    }

    async getGeminiResponse(message, conversationHistory) {
        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            const history = conversationHistory.map(msg => ({
                role: msg.isUser ? "user" : "model",
                parts: [{ text: msg.text }]
            }));

            const chat = model.startChat({
                history: history,
                generationConfig: {
                    maxOutputTokens: 500,
                    temperature: 0.7,
                },
            });

            const result = await chat.sendMessage(message);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Gemini API Error:', error);
            throw new Error('Failed to get Gemini response');
        }
    }
}

module.exports = new AIService();