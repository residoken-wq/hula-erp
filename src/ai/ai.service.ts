import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProductsService } from '../products/products.service';
import { FinanceService } from '../finance/finance.service';
import { SalesService } from '../sales/sales.service';
import { CustomersService } from '../customers/customers.service';
// import { GenerativeModel } from '@google/generative-ai'; // Removed to avoid dependency issues

@Injectable()
export class AiService {
    // private model: GenerativeModel;

    constructor(
        private configService: ConfigService,
        private productsService: ProductsService,
        private financeService: FinanceService,
        private salesService: SalesService,
        private customersService: CustomersService,
        // @Inject('GEMINI_MODEL') private geminiModel: GenerativeModel
    ) {
        // this.model = this.geminiModel;
    }

    private selectedModel: string | null = null;

    // Conversation history: Map<userId, messages[]>
    private conversationHistory: Map<string, Array<{ role: string; content: string }>> = new Map();
    private readonly MAX_HISTORY = 10; // Keep last 10 messages

    private getConversationHistory(userId: string): Array<{ role: string; content: string }> {
        if (!this.conversationHistory.has(userId)) {
            this.conversationHistory.set(userId, []);
        }
        return this.conversationHistory.get(userId);
    }

    private addToHistory(userId: string, role: string, content: string) {
        const history = this.getConversationHistory(userId);
        history.push({ role, content });

        // Keep only last MAX_HISTORY messages
        if (history.length > this.MAX_HISTORY) {
            history.shift();
        }
    }

    private clearHistory(userId: string) {
        this.conversationHistory.delete(userId);
    }

    private formatNumber(num: number): string {
        return num.toLocaleString('vi-VN');
    }

    private formatMoney(amount: number): string {
        return amount.toLocaleString('vi-VN');
    }

    private async getBestModel(apiKey: string): Promise<string> {
        if (this.selectedModel) return this.selectedModel;

        try {
            const listUrl = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
            const response = await fetch(listUrl);
            const data = await response.json();

            if (!data.models) {
                console.error('DEBUG AI: Failed to list models', data);
                return 'gemini-1.5-flash';
            }

            const models = data.models.filter((m: any) =>
                m.supportedGenerationMethods?.includes('generateContent')
            );

            console.log('DEBUG AI: Available models:', models.map((m: any) => m.name));

            const preferred = models.find((m: any) => m.name.includes('flash')) || models[0];

            if (preferred) {
                console.log('DEBUG AI: Auto-selected model:', preferred.name);
                this.selectedModel = preferred.name;
                return this.selectedModel;
            }
        } catch (e) {
            console.error('DEBUG AI: Error listing models:', e);
        }

        return 'gemini-1.5-flash';
    }

    private async callGemini(prompt: string): Promise<string> {
        let apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) throw new Error("GEMINI_API_KEY not set");
        apiKey = apiKey.trim();

        const modelName = await this.getBestModel(apiKey);
        const url = `https://generativelanguage.googleapis.com/v1/${modelName}:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{ parts: [{ text: prompt }] }]
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.text();
                if (response.status === 404) {
                    this.selectedModel = null;
                }
                throw new Error(`Gemini API Error (${modelName}): ${response.status} - ${err}`);
            }

            const data = await response.json();
            // Parse prediction
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        } catch (error) {
            console.error("Gemini Fetch Error:", error);
            throw error;
        }
    }

    // --- TOOLS DEFINITION ---
    // In a real production app, these schemas would be passed to the LLM.
    // Since Gemini Function Calling API setup can be verbose, we will use a "ReAct" style or simplified JSON mode first.
    // UPDATED STRATEGY: We will just prompt the LLM to output a JSON Action.

    async chat(body: any) {
        const { message, userId = 'default' } = body; // Default userId if not provided

        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        console.log('DEBUG AI: Checking Key...');
        console.log('DEBUG AI: Key from ConfigService:', apiKey ? 'FOUND (Length: ' + apiKey.length + ')' : 'MISSING');
        console.log('DEBUG AI: Process.env.GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'FOUND' : 'MISSING');

        if (!apiKey) {
            return { text: "AI Service is not configured (Missing GEMINI_API_KEY)." };
        }

        // SYSTEM PROMPT with enhanced context
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // Get conversation history
        const history = this.getConversationHistory(userId);
        const historyContext = history.length > 0
            ? `\n\nCONVERSATION HISTORY:\n${history.map(h => `${h.role}: ${h.content}`).join('\n')}\n`
            : '';

        const prompt = `
            You are HulaBot, an intelligent assistant for the Hula ERP system in Vietnam.
            Current date: ${now.toISOString().split('T')[0]} (Month: ${currentMonth}, Year: ${currentYear})
            
            Your job is to help the user manage Inventory, Finance, and Sales.
            You MUST respond in Vietnamese when the user speaks Vietnamese.
            ${historyContext}
            CRITICAL RULES:
            1. When user asks about "tháng [số]" (month X) without year, assume they mean the CURRENT YEAR (${currentYear})
            2. When user asks "tháng này" (this month), use month ${currentMonth} and year ${currentYear}
            3. When user asks "tháng trước" (last month), calculate the previous month correctly
            4. Output ONLY a valid JSON object, NO markdown code blocks, NO text before or after
            5. Use conversation history to understand context when the user asks follow-up questions
            
            AVAILABLE TOOLS:
            1. CHECK_STOCK: Search for products and check their stock.
               Output: { "tool": "CHECK_STOCK", "query": "product name or sku" }
               Example: User says "kho còn iphone không?" → { "tool": "CHECK_STOCK", "query": "iphone" }
            
            2. CHECK_FINANCE: Get financial report for a specific period.
               Output: { "tool": "CHECK_FINANCE", "month": number, "year": number }
               
               CRITICAL: Detect if user wants YEARLY or MONTHLY report:
               - If user says "năm", "cả năm", "toàn năm", "thống kê năm" → set month = 0
               - If user says "tháng [số]" or specific month → set month = 1-12
               
               Yearly examples (month = 0):
               - "thống kê doanh thu năm 2025" → { "tool": "CHECK_FINANCE", "month": 0, "year": 2025 }
               - "doanh thu cả năm 2024" → { "tool": "CHECK_FINANCE", "month": 0, "year": 2024 }
               - "báo cáo tài chính năm 2025" → { "tool": "CHECK_FINANCE", "month": 0, "year": 2025 }
               
               Monthly examples (month = 1-12):
               - "doanh thu tháng 12" → { "tool": "CHECK_FINANCE", "month": 12, "year": ${currentYear} }
               - "doanh thu tháng này" → { "tool": "CHECK_FINANCE", "month": ${currentMonth}, "year": ${currentYear} }
               - "báo cáo tài chính tháng 3/2024" → { "tool": "CHECK_FINANCE", "month": 3, "year": 2024 }

            3. CREATE_LEAD: Create a new CRM lead.
               Output: { "tool": "CREATE_LEAD", "name": "customer name", "phone": "phone number" }
               Example: "khách tên Tùng sdt 0909123456" → { "tool": "CREATE_LEAD", "name": "Tùng", "phone": "0909123456" }

            4. CHECK_ORDER: Search for sales orders.
               Output: { "tool": "CHECK_ORDER", "query": "customer name or order code" }
               Example: "tìm đơn của khách Tùng" → { "tool": "CHECK_ORDER", "query": "Tùng" }

            5. GET_PRODUCT_INFO: Get detailed product information.
               Output: { "tool": "GET_PRODUCT_INFO", "sku": "product sku" }
               Example: "thông tin sản phẩm PRD-001" → { "tool": "GET_PRODUCT_INFO", "sku": "PRD-001" }

            6. SEARCH_CUSTOMER: Find customer contact information.
               Output: { "tool": "SEARCH_CUSTOMER", "query": "customer name or phone" }
               Example: "tìm khách hàng Lan" → { "tool": "SEARCH_CUSTOMER", "query": "Lan" }

            7. UNKNOWN: If you cannot help.
               Output: { "tool": "UNKNOWN", "reply": "Xin lỗi, tôi chưa hiểu yêu cầu này." }

            USER MESSAGE: "${message}"
            
            Remember: Output ONLY the JSON object, nothing else.
        `;

        try {
            // CALL GEMINI via FETCH
            const textHTML = await this.callGemini(prompt);

            // Clean markdown if present
            const cleanJson = textHTML.replace(/```json/g, '').replace(/```/g, '').trim();

            let action;
            try {
                action = JSON.parse(cleanJson);
                console.log('DEBUG AI: Parsed action from LLM:', JSON.stringify(action));
            } catch (e) {
                // If LLM replies with text, return it
                console.log('DEBUG AI: Failed to parse JSON, returning raw text:', textHTML);
                return { text: textHTML };
            }

            // EXECUTE TOOL
            if (action.tool === 'CHECK_STOCK') {
                const products = await this.productsService.searchProducts(action.query);
                if (products.length === 0) {
                    const reply = `Không tìm thấy sản phẩm nào khớp với "${action.query}".`;
                    this.addToHistory(userId, 'user', message);
                    this.addToHistory(userId, 'assistant', reply);
                    return { text: reply };
                }

                const details = products.map(p => `- ${p.name} (${p.sku}): Còn ${this.formatNumber(p.quantity_in_stock)} ${p.unit || 'cái'}`).join('\n');
                const reply = `Kết quả tìm kiếm cho "${action.query}":\n${details}`;
                this.addToHistory(userId, 'user', message);
                this.addToHistory(userId, 'assistant', reply);
                return { text: reply };
            }

            if (action.tool === 'CHECK_FINANCE') {
                // Fix: Check for month 0 (yearly stats) explicitly since 0 is falsy
                const m = (action.month !== undefined && action.month !== null)
                    ? action.month
                    : new Date().getMonth() + 1;
                const y = action.year || new Date().getFullYear();

                // Handle yearly statistics (month = 0)
                if (m === 0) {
                    let totalIncome = 0;
                    let totalExpense = 0;
                    let totalProfit = 0;

                    console.log(`DEBUG AI: Aggregating year ${y} statistics...`);

                    // Aggregate all 12 months
                    for (let month = 1; month <= 12; month++) {
                        const dateStr = `${y}-${String(month).padStart(2, '0')}`;
                        try {
                            const monthReport = await this.financeService.getFinancialReport(dateStr);
                            console.log(`DEBUG AI: Month ${month}/${y} - Income: ${monthReport.summary.income}, Expense: ${monthReport.summary.expense}, Profit: ${monthReport.summary.profit}`);
                            totalIncome += monthReport.summary.income || 0;
                            totalExpense += monthReport.summary.expense || 0;
                            totalProfit += monthReport.summary.profit || 0;
                        } catch (e) {
                            console.log(`DEBUG AI: Month ${month}/${y} - No data or error: ${e.message}`);
                        }
                    }

                    console.log(`DEBUG AI: Year ${y} totals - Income: ${totalIncome}, Expense: ${totalExpense}, Profit: ${totalProfit}`);

                    const reply = `Báo cáo tài chính năm ${y}:\n` +
                        `- Tổng doanh thu: ${this.formatMoney(totalIncome)} đ\n` +
                        `- Tổng chi phí: ${this.formatMoney(totalExpense)} đ\n` +
                        `- Tổng lợi nhuận: ${this.formatMoney(totalProfit)} đ`;
                    this.addToHistory(userId, 'user', message);
                    this.addToHistory(userId, 'assistant', reply);
                    return { text: reply };
                }

                // Handle monthly statistics
                const dateStr = `${y}-${String(m).padStart(2, '0')}`;
                const report = await this.financeService.getFinancialReport(dateStr);
                const reply = `Báo cáo tháng ${m}/${y}:\n- Doanh thu: ${this.formatMoney(report.summary.income)} đ\n- Lợi nhuận: ${this.formatMoney(report.summary.profit)} đ`;
                this.addToHistory(userId, 'user', message);
                this.addToHistory(userId, 'assistant', reply);
                return { text: reply };
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
                const reply = `Đã tạo Lead mới: ${action.name} (SĐT: ${action.phone}).`;
                this.addToHistory(userId, 'user', message);
                this.addToHistory(userId, 'assistant', reply);
                return { text: reply };
            }

            if (action.tool === 'CHECK_ORDER') {
                const allOrders = await this.salesService.findAll();
                const orders = allOrders.filter((o: any) =>
                    o.code?.toLowerCase().includes(action.query.toLowerCase()) ||
                    o.customer?.name?.toLowerCase().includes(action.query.toLowerCase())
                );

                if (!orders || orders.length === 0) {
                    const reply = `Không tìm thấy đơn hàng nào khớp với "${action.query}".`;
                    this.addToHistory(userId, 'user', message);
                    this.addToHistory(userId, 'assistant', reply);
                    return { text: reply };
                }

                const details = orders.slice(0, 5).map((o: any) => {
                    const customerName = o.customer?.name || 'N/A';
                    const total = this.formatMoney(o.total_price || 0);
                    return `- ${o.code}: ${customerName} - ${total} đ (${o.status})`;
                }).join('\n');
                const reply = `Tìm thấy ${orders.length} đơn hàng:\n${details}`;
                this.addToHistory(userId, 'user', message);
                this.addToHistory(userId, 'assistant', reply);
                return { text: reply };
            }

            if (action.tool === 'GET_PRODUCT_INFO') {
                const product = await this.productsService.findOneBySku(action.sku);
                if (!product) {
                    const reply = `Không tìm thấy sản phẩm với SKU "${action.sku}".`;
                    this.addToHistory(userId, 'user', message);
                    this.addToHistory(userId, 'assistant', reply);
                    return { text: reply };
                }

                const reply = `Thông tin sản phẩm ${product.sku}:\n` +
                    `- Tên: ${product.name}\n` +
                    `- Loại: ${product.product_type || 'N/A'}\n` +
                    `- Giá: ${this.formatMoney(product.base_price)} đ\n` +
                    `- Tồn kho: ${this.formatNumber(product.quantity_in_stock)} ${product.unit || 'cái'}`;
                this.addToHistory(userId, 'user', message);
                this.addToHistory(userId, 'assistant', reply);
                return { text: reply };
            }

            if (action.tool === 'SEARCH_CUSTOMER') {
                const allCustomers = await this.customersService.findAll();
                const customers = allCustomers.filter((c: any) =>
                    c.name?.toLowerCase().includes(action.query.toLowerCase()) ||
                    c.code?.toLowerCase().includes(action.query.toLowerCase()) ||
                    c.phone?.toLowerCase().includes(action.query.toLowerCase())
                );

                if (!customers || customers.length === 0) {
                    const reply = `Không tìm thấy khách hàng nào khớp với "${action.query}".`;
                    this.addToHistory(userId, 'user', message);
                    this.addToHistory(userId, 'assistant', reply);
                    return { text: reply };
                }

                const details = customers.slice(0, 5).map((c: any) =>
                    `- ${c.name} (${c.code}): ${c.phone || 'N/A'} - ${c.email || 'N/A'}`
                ).join('\n');
                const reply = `Tìm thấy ${customers.length} khách hàng:\n${details}`;
                this.addToHistory(userId, 'user', message);
                this.addToHistory(userId, 'assistant', reply);
                return { text: reply };
            }

            const reply = action.reply || "Tôi không hiểu yêu cầu này.";
            this.addToHistory(userId, 'user', message);
            this.addToHistory(userId, 'assistant', reply);
            return { text: reply };

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
