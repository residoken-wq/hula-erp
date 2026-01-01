import { Injectable, Inject } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { FinanceService } from '../finance/finance.service';
import { SalesService } from '../sales/sales.service';
import { CustomersService } from '../customers/customers.service';
import { GenerativeModel } from '@google/generative-ai';

@Injectable()
export class AiService {
    private model: GenerativeModel;

    constructor(
        private productsService: ProductsService,
        private financeService: FinanceService,
        private salesService: SalesService,
        private customersService: CustomersService,
        @Inject('GEMINI_MODEL') private geminiModel: GenerativeModel
    ) {
        this.model = this.geminiModel;
    }

    // --- TOOLS DEFINITION ---
    // In a real production app, these schemas would be passed to the LLM.
    // Since Gemini Function Calling API setup can be verbose, we will use a "ReAct" style or simplified JSON mode first.
    // UPDATED STRATEGY: We will just prompt the LLM to output a JSON Action.

    async chat(body: any) {
        const { message } = body;

        if (!this.model) {
            return { text: "AI Service is not configured (Missing API Key)." };
        }

        // SYSTEM PROMPT
        const prompt = `
            You are HulaBot, an intelligent assistant for the Hula ERP system.
            Your job is to help the user manage Inventory, Finance, and Sales.
            
            You have access to the following TOOLS. If the user asks for something, output a JSON object describing the tool to call.
            Do NOT output markdown code blocks. Just the raw JSON string.

            TOOLS:
            1. CHECK_STOCK: Search for products and check their stock.
               JSON: { "tool": "CHECK_STOCK", "query": "product name or sku" }
            
            2. CHECK_FINANCE: Get financial report for a specific period.
               JSON: { "tool": "CHECK_FINANCE", "month": number, "year": number }
               (Default to current month/year if not specified)

            3. CREATE_LEAD: Create a new CRM lead.
               JSON: { "tool": "CREATE_LEAD", "name": "customer name", "phone": "phone number" }

            4. UNKNOWN: If you cannot help.
               JSON: { "tool": "UNKNOWN", "reply": "Courtesy message" }

            USER MESSAGE: "${message}"
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = result.response;
            const textHTML = response.text();

            // Clean markdown if present
            const cleanJson = textHTML.replace(/```json/g, '').replace(/```/g, '').trim();

            let action;
            try {
                action = JSON.parse(cleanJson);
            } catch (e) {
                // If LLM replies with text, return it
                return { text: textHTML };
            }

            // EXECUTE TOOL
            if (action.tool === 'CHECK_STOCK') {
                const products = await this.productsService.searchProducts(action.query);
                if (products.length === 0) return { text: `Không tìm thấy sản phẩm nào khớp với "${action.query}".` };

                const details = products.map(p => `- ${p.name} (${p.sku}): Còn ${p.quantity_in_stock} ${p.unit || 'cái'}`).join('\n');
                return { text: `Kết quả tìm kiếm cho "${action.query}":\n${details}` };
            }

            if (action.tool === 'CHECK_FINANCE') {
                const m = action.month || new Date().getMonth() + 1;
                const y = action.year || new Date().getFullYear();
                const dateStr = `${y}-${String(m).padStart(2, '0')}`;

                const report = await this.financeService.getFinancialReport(dateStr);
                return {
                    text: `Báo cáo tháng ${m}/${y}:\n- Doanh thu: ${report.summary.income.toLocaleString()} đ\n- Lợi nhuận: ${report.summary.profit.toLocaleString()} đ`
                };
            }

            if (action.tool === 'CREATE_LEAD') {
                const code = `LEAD-${Date.now().toString().slice(-6)}`;
                await this.customersService.create({
                    code,
                    name: action.name,
                    phone: action.phone,
                    type: 'LEAD',
                    lead_status: 'NEW'
                });
                return { text: `Đã tạo Lead mới: ${action.name} (SĐT: ${action.phone}).` };
            }

            return { text: action.reply || "Tôi không hiểu yêu cầu này." };

        } catch (error) {
            console.error(error);
            return { text: "Lỗi xử lý AI: " + error.message };
        }
    }

    async suggestPrice(dto: any) {
        // ... (Keep existing logic)
        const { cost_price, competitor_price, strategy, market_volume } = dto;
        const cost = Number(cost_price) || 0;
        const comp = Number(competitor_price) || 0;

        let suggested = cost * 1.3; // Default 30% margin
        let min_price = cost * 1.1; // Min margin 10%
        let explanation = "";

        if (comp > 0) {
            if (strategy === 'AGGRESSIVE') {
                // Thấp hơn đối thủ 5%
                suggested = comp * 0.95;
                explanation = "Chiến lược Cạnh Tranh: Đặt giá thấp hơn đối thủ 5% để chiếm thị phần.";
                if (suggested < min_price) {
                    suggested = min_price;
                    explanation += " Tuy nhiên, đã điều chỉnh về mức hòa vốn tối thiểu.";
                }
            } else if (strategy === 'PROFIT') {
                // Cao hơn đối thủ 10% nếu brand tốt, hoặc Cost + 50%
                suggested = Math.max(cost * 1.5, comp * 1.1);
                explanation = "Chiến lược Lợi Nhuận: Tập trung vào biên lợi nhuận cao (50%) hoặc định vị cao cấp hơn đối thủ.";
            } else {
                // BALANCED: Trung bình
                const target = Math.min(comp, cost * 1.4);
                suggested = target;
                explanation = "Chiến lược Cân Bằng: Giữ mức giá cạnh tranh nhưng vẫn đảm bảo biên lợi nhuận an toàn (40%).";
            }
        } else {
            // Không có giá đối thủ
            if (strategy === 'AGGRESSIVE') {
                suggested = cost * 1.2;
                explanation = "Biên lợi nhuận mỏng (20%) để thâm nhập thị trường.";
            } else if (strategy === 'PROFIT') {
                suggested = cost * 1.6;
                explanation = "Biên lợi nhuận dày (60%) tối đa hóa dòng tiền.";
            } else {
                suggested = cost * 1.35;
                explanation = "Mức giá tiêu chuẩn (Mark-up 35%).";
            }
        }

        // Logic volume
        if (market_volume === 'HIGH') {
            suggested *= 0.95; // Giảm thêm 5% nếu volume lớn
            explanation += " (Đã giảm 5% do volume thị trường lớn)";
        }

        // Rounding to 1000
        suggested = Math.ceil(suggested / 1000) * 1000;
        min_price = Math.ceil(min_price / 1000) * 1000;

        // Generate tiered pricing
        return {
            price_100: suggested,
            price_50: Math.ceil((suggested * 1.05) / 1000) * 1000,
            price_30: Math.ceil((suggested * 1.10) / 1000) * 1000,
            min_price: min_price,
            explanation: explanation
        };
    }
}
