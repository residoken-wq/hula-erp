import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiMessage } from './ai-message.entity';
import { ProductsService } from '../products/products.service';
import { FinanceService } from '../finance/finance.service';
import { SalesService } from '../sales/sales.service';
import { CustomersService } from '../customers/customers.service';
import { InventoryService } from '../inventory/inventory.service';
import { PlanningService } from '../planning/planning.service';
import { TasksService } from '../tasks/tasks.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AiService {
    constructor(
        @InjectRepository(AiMessage) private aiMessageRepo: Repository<AiMessage>,
        private configService: ConfigService,
        private productsService: ProductsService,
        private financeService: FinanceService,
        private salesService: SalesService,
        private customersService: CustomersService,
        private inventoryService: InventoryService,
        private planningService: PlanningService,
        private tasksService: TasksService,
        private usersService: UsersService,
    ) {}

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
                return 'models/gemini-1.5-flash';
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

        return 'models/gemini-1.5-flash';
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

            7. CHECK_MRP: Check production planning suggestions.
               Output: { "tool": "CHECK_MRP" }
               Example: "kiểm tra kế hoạch sản xuất" → { "tool": "CHECK_MRP" }

            8. CREATE_TASK: Create a new task or reminder.
               Output: { "tool": "CREATE_TASK", "title": "task title", "assignee_name": "name of assignee", "due_date": "YYYY-MM-DD HH:mm" }
               Example: "nhắc Tùng gọi khách A vào 14h chiều mai" → { "tool": "CREATE_TASK", "title": "Gọi lại khách A", "assignee_name": "Tùng", "due_date": "2025-10-20 14:00" }
               Note: If no time specified, assume tomorrow 9AM.

            9. CHECK_TASKS: Search for tasks.
               Output: { "tool": "CHECK_TASKS", "query": "keyword" }
               Example: "kiểm tra công việc của Tùng" → { "tool": "CHECK_TASKS", "query": "Tùng" }

            10. UNKNOWN: If you cannot help.
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
                    o.order_code?.toLowerCase().includes(action.query.toLowerCase()) ||
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
                    const total = this.formatMoney(o.total_amount || 0);
                    return `- ${o.order_code}: ${customerName} - ${total} đ (${o.status})`;
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

            if (action.tool === 'CHECK_MRP') {
                try {
                    const suggestions = await this.planningService.getSuggestion();
                    if (suggestions.length === 0) {
                        const reply = "Hiện tại không có đơn hàng nào cần lên kế hoạch sản xuất.";
                        this.addToHistory(userId, 'user', message);
                        this.addToHistory(userId, 'assistant', reply);
                        return { text: reply };
                    }

                    const details = suggestions.slice(0, 5).map(o =>
                        `- Đơn ${o.order_code} (${o.customer?.name}): Giao ${new Date(o.delivery_date).toLocaleDateString('vi-VN')}`
                    ).join('\n');

                    const reply = `Có ${suggestions.length} đơn hàng cần lập kế hoạch sản xuất:\n${details}`;
                    this.addToHistory(userId, 'user', message);
                    this.addToHistory(userId, 'assistant', reply);
                    return { text: reply };
                } catch (e) {
                    return { text: "Lỗi kiểm tra MRP: " + e.message };
                }
            }

            if (action.tool === 'CHECK_TASKS') {
                const allTasks = await this.tasksService.findAll();
                const tasks = allTasks.filter((t: any) =>
                    t.title?.toLowerCase().includes(action.query.toLowerCase()) ||
                    t.assignee?.full_name?.toLowerCase().includes(action.query.toLowerCase())
                );

                if (tasks.length === 0) {
                    const reply = `Không tìm thấy công việc nào liên quan đến "${action.query}".`;
                    this.addToHistory(userId, 'user', message);
                    this.addToHistory(userId, 'assistant', reply);
                    return { text: reply };
                }

                const details = tasks.slice(0, 5).map((t: any) =>
                    `- [${t.status}] ${t.title} (Giao: ${t.assignee?.full_name || 'Chưa gán'}) - Hạn: ${t.due_date ? new Date(t.due_date).toLocaleDateString('vi-VN') : 'N/A'}`
                ).join('\n');

                const reply = `Tìm thấy ${tasks.length} công việc:\n${details}`;
                this.addToHistory(userId, 'user', message);
                this.addToHistory(userId, 'assistant', reply);
                return { text: reply };
            }

            if (action.tool === 'CREATE_TASK') {
                // 1. Find Assignee ID
                let assigneeId = null;
                let assigneeName = 'Bạn';

                if (action.assignee_name) {
                    const allUsers = await this.usersService.getAllUsers();

                    // Simple fuzzy search
                    const user = allUsers.find(u =>
                        u.full_name?.toLowerCase().includes(action.assignee_name.toLowerCase()) ||
                        u.username?.toLowerCase().includes(action.assignee_name.toLowerCase())
                    );

                    if (user) {
                        assigneeId = user.id;
                        assigneeName = user.full_name;
                    } else {
                        // Fallback to current user if exact match not found? Or just leave null?
                        // decided: warn user but create task anyway unassigned or assigned to self?
                        // Better: respond error
                        const reply = `Không tìm thấy nhân viên nào tên "${action.assignee_name}". Vui lòng kiểm tra lại.`;
                        this.addToHistory(userId, 'user', message);
                        this.addToHistory(userId, 'assistant', reply);
                        return { text: reply };
                    }
                } else {
                    // Assign to creator (need to map userId to numeric ID? Assuming userId passed is NOT numeric id)
                    // TODO: Need robust user resolution. For now, try to find by userId if it looks like username
                    const u = await this.usersService.findOneByUsernameForAuth(userId);
                    if (u) assigneeId = u.id;
                }

                await this.tasksService.create({
                    title: action.title,
                    description: `Được tạo bởi HulaBot theo yêu cầu: "${message}"`,
                    status: 'TODO',
                    priority: 'MEDIUM',
                    assignee_id: assigneeId,
                    due_date: action.due_date || new Date(Date.now() + 86400000), // Default +1 day
                    creator_id: assigneeId // Self-created for now if unknown
                });

                const reply = `Đã tạo công việc "${action.title}" cho ${assigneeName}.`;
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

    // --- LEAD CARE: SUGGEST REPLY ---
    async suggestReply(dto: any) {
        const { customerId, chatHistory, customerName, products } = dto;

        // Build context from chat history
        const historyText = chatHistory && chatHistory.length > 0
            ? chatHistory.slice(-10).map((c: any) =>
                `[${c.sender_type}] ${c.sender_name}: ${c.content.replace(/<[^>]+>/g, '')}`
            ).join('\n')
            : 'Chưa có lịch sử chat.';

        // Build product context
        let productContext = 'Không có thông tin sản phẩm.';
        if (products && products.length > 0) {
            productContext = products.slice(0, 5).map((p: any) =>
                `- ${p.name}: ${this.formatMoney(p.price || 0)} (SL tồn: ${p.stock || 'N/A'})`
            ).join('\n');
        }

        const prompt = `Bạn là nhân viên chăm sóc khách hàng chuyên nghiệp của công ty.

THÔNG TIN KHÁCH HÀNG:
- Tên: ${customerName || 'N/A'}

LỊCH SỬ TRAO ĐỔI GẦN ĐÂY:
${historyText}

THÔNG TIN SẢN PHẨM:
${productContext}

HÃY GỢI Ý MỘT CÂU TRẢ LỜI CHO KHÁCH HÀNG:
- Lịch sự, chuyên nghiệp
- Ngắn gọn, đi thẳng vào vấn đề
- Nếu khách hỏi về giá, có thể tham khảo thông tin sản phẩm trên
- Trả lời bằng tiếng Việt

Chỉ trả về nội dung gợi ý, không giải thích thêm.`;

        try {
            const reply = await this.callGemini(prompt);
            return { suggestion: reply.trim() };
        } catch (e) {
            return { suggestion: 'Xin chào! Cảm ơn bạn đã liên hệ. Tôi có thể giúp gì cho bạn?' };
        }
    }

    // --- RECRUITMENT: AI EVALUATION ---
    async evaluateAssessment(prompt: string): Promise<any> {
        try {
            const reply = await this.callGemini(prompt);
            const cleanJson = reply.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanJson);
        } catch (e) {
            console.error('AI Evaluate Error:', e);
            return null;
        }
    }

    // Feature 1: AI Generate 10 STAR Questions
    async generateRecruitmentQuestions(jdText: string, cvText: string): Promise<any> {
        const prompt = `
### ROLE: Chuyên gia Phỏng Vấn Tuyển Dụng cao cấp (Senior Talent Acquisition).
### TASK: Tạo 10 câu hỏi phỏng vấn dựa trên Mô tả công việc (JD) và CV ứng viên.

Job Description: ${jdText}
Candidate CV Summary: ${cvText || 'N/A'}

### YÊU CẦU:
1. Tạo đúng 10 câu hỏi phỏng vấn, áp dụng mô hình S.T.A.R nếu phù hợp.
2. Dựa vào JD để đánh giá Core Skills, Dựa vào CV để đào sâu kinh nghiệm.
3. Câu hỏi phải bằng tiếng Việt, rõ ràng.

### OUTPUT FORMAT:
You MUST return ONLY a valid JSON object in this structure:
{
  "questions": [
    {
       "id": "1",
       "category": "Behavioral",
       "question": "Nội dung câu hỏi...",
       "intent": "Mục đích câu hỏi"
    }
  ]
}
`;
        try {
            const reply = await this.callGemini(prompt);
            const cleanJson = reply.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanJson);
        } catch (e) {
            console.error('AI Generate Questions Error:', e?.message || e);
            return { questions: [], error: e?.message || 'Unknown AI error' };
        }
    }

    // Feature 4: Parse JD to JSON Competency
    async parseJDCompetencies(description: string): Promise<any> {
        const prompt = `
### TASK:
Phân tích mô tả công việc (JD) sau đây và trích xuất ra các yêu cầu năng lực.
Job Description: ${description}

### OUTPUT FORMAT:
You MUST return ONLY a valid JSON object in this structure:
{
  "skills": ["Kỹ năng 1", "Kỹ năng 2"],
  "experience": ["Kinh nghiệm 1", "Kinh nghiệm 2"],
  "attitude": ["Thái độ/Phẩm chất 1", "Thái độ/Phẩm chất 2"]
}
`;
        try {
            const reply = await this.callGemini(prompt);
            const cleanJson = reply.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanJson);
        } catch (e) {
            console.error('AI Parse JD Error:', e);
            return { skills: [], experience: [], attitude: [] };
        }
    }

    // --- NEW STREAMING & FUNCTION CALLING IMPLEMENTATION ---
    async handleAiToolCall(functionName: string, args: any): Promise<any> {
        try {
            if (functionName === 'check_stock') {
                const products = await this.productsService.searchProducts(args.query);
                return products.map(p => ({ name: p.name, sku: p.sku, stock: p.quantity_in_stock, unit: p.unit }));
            }
            if (functionName === 'check_finance') {
                const m = args.month || new Date().getMonth() + 1;
                const y = args.year || new Date().getFullYear();
                if (m === 0) {
                    let totalIncome = 0; let totalExpense = 0; let totalProfit = 0;
                    for (let month = 1; month <= 12; month++) {
                        const dateStr = `${y}-${String(month).padStart(2, '0')}`;
                        try {
                            const rep = await this.financeService.getFinancialReport(dateStr);
                            totalIncome += rep.summary.income || 0;
                            totalExpense += rep.summary.expense || 0;
                            totalProfit += rep.summary.profit || 0;
                        } catch (e) {}
                    }
                    return { year: y, totalIncome, totalExpense, totalProfit };
                } else {
                    const dateStr = `${y}-${String(m).padStart(2, '0')}`;
                    try {
                        const rep = await this.financeService.getFinancialReport(dateStr);
                        return { month: m, year: y, income: rep.summary.income, profit: rep.summary.profit };
                    } catch (e) {
                        return { error: "Không có dữ liệu tháng này" };
                    }
                }
            }
            if (functionName === 'check_order') {
                const allOrders = await this.salesService.findAll();
                const orders = allOrders.filter((o: any) =>
                    o.order_code?.toLowerCase().includes(args.query.toLowerCase()) ||
                    o.customer?.name?.toLowerCase().includes(args.query.toLowerCase())
                ).slice(0, 5);
                return orders.map(o => ({ code: o.order_code, customer: o.customer?.name, total: o.total_amount, status: o.status }));
            }
            if (functionName === 'get_product_info') {
                const p = await this.productsService.findOneBySku(args.sku);
                if (!p) return { error: "Not found" };
                return { name: p.name, type: p.product_type, price: p.base_price, stock: p.quantity_in_stock };
            }
            if (functionName === 'search_customer') {
                const all = await this.customersService.findAll();
                return all.filter((c: any) =>
                    c.name?.toLowerCase().includes(args.query.toLowerCase()) ||
                    c.phone?.toLowerCase().includes(args.query.toLowerCase())
                ).slice(0, 5).map(c => ({ name: c.name, phone: c.phone, email: c.email }));
            }
            if (functionName === 'check_mrp') {
                try {
                    const sugg = await this.planningService.getSuggestion();
                    return sugg.slice(0, 5).map(o => ({ order: o.order_code, customer: o.customer?.name, delivery_date: o.delivery_date }));
                } catch(e) {
                    return { error: e.message };
                }
            }
            if (functionName === 'check_tasks') {
                const all = await this.tasksService.findAll();
                return all.filter((t: any) =>
                    t.title?.toLowerCase().includes(args.query.toLowerCase()) ||
                    t.assignee?.full_name?.toLowerCase().includes(args.query.toLowerCase())
                ).slice(0, 5).map(t => ({ title: t.title, assignee: t.assignee?.full_name, status: t.status, due: t.due_date }));
            }
            return { error: "Tool not found" };
        } catch (e) {
            return { error: e.message };
        }
    }

    async handleChatStream(userId: string, message: string, onChunk: (text: string) => void) {
        let apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
            onChunk("AI Service is not configured (Missing GEMINI_API_KEY).");
            return;
        }
        apiKey = apiKey.trim();

        // 1. Save user message to DB
        const userMsg = this.aiMessageRepo.create({ user_id: userId, role: 'user', content: message });
        await this.aiMessageRepo.save(userMsg);

        // 2. Load history (last 10 messages)
        const history = await this.aiMessageRepo.find({ where: { user_id: userId }, order: { id: 'ASC' }, take: 10 });
        
        // Format contents for Gemini
        const contents: any[] = history.map(h => ({
            role: h.role,
            parts: [{ text: h.content }]
        }));

        const now = new Date();
        const systemInstruction = {
            parts: [{ text: `You are HulaBot, an intelligent, helpful, and natural-sounding assistant for the Hula ERP system in Vietnam.
Current date: ${now.toISOString().split('T')[0]}
CRITICAL RULES:
- Always respond in Vietnamese naturally and politely.
- Use markdown for formatting (bold, lists, etc) to make the response easy to read.
- You can ONLY read data using the provided tools. You CANNOT create or update data.
- If you use tools to fetch data, summarize the data nicely for the user in a conversational tone. Do not just spit out raw JSON.` }]
        };

        const tools = [{
            functionDeclarations: [
                {
                    name: "check_stock",
                    description: "Tìm kiếm sản phẩm và kiểm tra tồn kho",
                    parameters: { type: "OBJECT", properties: { query: { type: "STRING" } }, required: ["query"] }
                },
                {
                    name: "check_finance",
                    description: "Kiểm tra doanh thu/tài chính. Nếu hỏi cả năm, truyền month=0.",
                    parameters: { type: "OBJECT", properties: { month: { type: "INTEGER" }, year: { type: "INTEGER" } }, required: ["year"] }
                },
                {
                    name: "check_order",
                    description: "Tìm kiếm đơn hàng theo tên khách hoặc mã",
                    parameters: { type: "OBJECT", properties: { query: { type: "STRING" } }, required: ["query"] }
                },
                {
                    name: "get_product_info",
                    description: "Lấy thông tin chi tiết 1 sản phẩm theo SKU",
                    parameters: { type: "OBJECT", properties: { sku: { type: "STRING" } }, required: ["sku"] }
                },
                {
                    name: "search_customer",
                    description: "Tìm khách hàng theo tên/sđt",
                    parameters: { type: "OBJECT", properties: { query: { type: "STRING" } }, required: ["query"] }
                },
                {
                    name: "check_mrp",
                    description: "Kiểm tra kế hoạch sản xuất MRP",
                    parameters: { type: "OBJECT", properties: {} }
                },
                {
                    name: "check_tasks",
                    description: "Kiểm tra danh sách công việc",
                    parameters: { type: "OBJECT", properties: { query: { type: "STRING" } }, required: ["query"] }
                }
            ]
        }];

        let modelName = 'models/gemini-1.5-flash';
        try {
            modelName = await this.getBestModel(apiKey);
        } catch (e) {}

        // Step 1: Call non-streaming to check for tool calls
        let generateRes;
        try {
            generateRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ systemInstruction, contents, tools })
            });
        } catch (e) {
            onChunk("Lỗi kết nối AI (Network).");
            return;
        }

        const data = await generateRes.json();
        if (data.error) {
            onChunk(`Lỗi AI API: ${data.error.message}`);
            return;
        }

        const candidate = data.candidates?.[0];
        if (!candidate) {
            onChunk("AI không trả về kết quả.");
            return;
        }

        let finalContents = [...contents];
        const functionCall = candidate.content?.parts?.find((p: any) => p.functionCall)?.functionCall;

        if (functionCall) {
            const funcName = functionCall.name;
            const args = functionCall.args;
            
            // Execute tool
            const result = await this.handleAiToolCall(funcName, args);
            
            // Append the function call message from model
            finalContents.push({ role: 'model', parts: [{ functionCall }] });
            
            // Append the function response
            finalContents.push({
                role: 'function',
                parts: [{ functionResponse: { name: funcName, response: { result } } }]
            });
        } else {
            // No function call, just return the text
            const text = candidate.content?.parts?.[0]?.text;
            if (text) {
                onChunk(text);
                const aiMsg = this.aiMessageRepo.create({ user_id: userId, role: 'model', content: text });
                await this.aiMessageRepo.save(aiMsg);
            }
            return;
        }

        // Step 2: Stream final response if function was called
        let finalResponseText = "";
        try {
            const streamRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelName}:streamGenerateContent?alt=sse&key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ systemInstruction, contents: finalContents })
            });

            if (!streamRes.ok) {
                const err = await streamRes.text();
                onChunk(`Lỗi kết nối Stream: ${err}`);
                return;
            }

            const reader = streamRes.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                
                const lines = buffer.split('\n');
                buffer = lines.pop() || ""; // Keep the incomplete line in buffer

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.replace('data: ', '').trim();
                        if (dataStr === '[DONE]') continue;
                        try {
                            const parsed = JSON.parse(dataStr);
                            const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
                            if (textChunk) {
                                finalResponseText += textChunk;
                                onChunk(textChunk);
                            }
                        } catch (e) {
                            // ignore parse error for incomplete JSON in SSE
                        }
                    }
                }
            }
        } catch (e) {
            onChunk(`\n(Lỗi Stream: ${e.message})`);
        }

        // Save AI response to DB
        if (finalResponseText) {
            const aiMsg = this.aiMessageRepo.create({ user_id: userId, role: 'model', content: finalResponseText });
            await this.aiMessageRepo.save(aiMsg);
        }
    }
}
