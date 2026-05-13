import { GoogleGenAI } from "@google/genai";

let genAIInstance: any = null;

function getAI() {
  if (!genAIInstance) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing.");
      throw new Error("GEMINI_API_KEY is missing. Please set it in your environment variables.");
    }
    genAIInstance = new GoogleGenAI({ apiKey });
  }
  return genAIInstance;
}

export const geminiService = {
  async predictDemand(inventoryData: any) {
    const ai = getAI();
    const prompt = `
      As an AI Inventory Specialist for a mobile store godown, analyze the following inventory data and predict future demand.
      Identify:
      1. Products likely to run out in the next 14 days.
      2. Dead stock (low movement).
      3. Reorder suggestions.
      
      Data: ${JSON.stringify(inventoryData)}
      
      Return a JSON response with the following structure:
      {
        "predictions": [{ "productName": string, "predictedDemand": string, "confidence": number }],
        "lowStockAlerts": [{ "productName": string, "daysRemaining": number }],
        "reorderSuggestions": [{ "productName": string, "suggestedQuantity": number }]
      }
    `;

    try {
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      
      return result.text ? JSON.parse(result.text) : null;
    } catch (error) {
      console.error("AI Prediction Error:", error);
      return null;
    }
  },

  async getChatResponse(message: string, context: any) {
    const ai = getAI();
    
    try {
      // For chat, we use the chats interface if available, but the skill shows generateContent is also fine.
      // However, the skill explicitly shows ai.chats.create
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `You are the Smart Godown Assistant. You help users manage their mobile store inventory. 
            You have access to the current godown state: ${JSON.stringify(context)}.
            Be concise, professional, and data-driven.`
        }
      });

      const result = await chat.sendMessage({ message });
      return result.text;
    } catch (error) {
      console.error("AI Chat Error:", error);
      return "I'm having trouble connecting to my brain right now. Please try again.";
    }
  },

  async scanInvoice(imageFile: File) {
    const ai = getAI();
    
    // Function to convert file to generative part
    async function fileToGenerativePart(file: File) {
      return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            inlineData: {
              data: (reader.result as string).split(',')[1],
              mimeType: file.type
            },
          });
        };
        reader.readAsDataURL(file);
      });
    }

    const prompt = `Extract inventory items from this invoice. 
    Return as JSON: { "items": [{ "name": string, "brand": string, "quantity": number, "price": number, "sku": string }] }`;
    
    try {
      const imagePart = await fileToGenerativePart(imageFile);
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [{ text: prompt }, imagePart] },
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = result.text;
      if (!text) return null;
      
      // Clean up markdown code blocks if present
      const cleaned = text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("OCR Error:", error);
      return null;
    }
  }
};
