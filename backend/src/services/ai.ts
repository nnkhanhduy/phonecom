import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../db.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function getChatResponse(userMessage: string, history: { role: string, parts: { text: string }[] }[]) {
    try {
        // Fetch products for context
        const products = await prisma.product.findMany({
            include: {
                variants: true
            }
        });

        // Format product context
        const productContext = products.map(p => {
            const variantInfo = p.variants.map(v => `${v.name} (${v.capacity}, ${v.color}): ${v.price} $, Tồn kho: ${v.stockQuantity}`).join('\n- ');
            return `Sản phẩm: ${p.name}\nThương hiệu: ${p.brand}\nMô tả: ${p.description}\nBiến thể:\n- ${variantInfo}`;
        }).join('\n\n');

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: `Bạn là trợ lý ảo mua sắm thông minh của PhoneCom - cửa hàng điện thoại uy tín.
            Nhiệm vụ của bạn là hỗ trợ khách hàng tìm kiếm sản phẩm, tư vấn chọn mua, SO SÁNH các sản phẩm và giải đáp thắc mắc về cửa hàng.
            
            Dưới đây là danh sách sản phẩm hiện có trong cửa hàng:
            ${productContext}
            
            Hãy trả lời khách hàng một cách thân thiện, chuyên nghiệp bằng tiếng Việt. 
            Nếu khách hỏi về sản phẩm không có trong danh sách, hãy khéo léo giới thiệu các sản phẩm tương tự mà PhoneCom đang kinh doanh.`,
        });

        const chat = model.startChat({
            history: history,
        });

        const result = await chat.sendMessage(userMessage);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error in AI service:', error);
        throw new Error('Không thể kết nối với AI Assistant.');
    }
}
