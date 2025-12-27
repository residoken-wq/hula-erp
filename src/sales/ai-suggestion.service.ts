import { Injectable } from '@nestjs/common';

@Injectable()
export class AiSuggestionService {
    async generatePriceSuggestions(context: any) {
        // --- MOCK AI LOGIC ---
        // Trong thực tế, đoạn này sẽ gọi OpenAI/Gemini API

        const { scenario, products } = context;
        let marketAnalysis = '';
        let rules: any[] = [];
        let generalAdvice = '';

        if (scenario === 'Mua He') {
            marketAnalysis = `
### Phân tích Thị trường Mùa Hè 2025:
- **Nhu cầu**: Tăng cao đối với các sản phẩm thoáng mát, chất liệu cotton/linen.
- **Đối thủ**: Các thương hiệu local brand đang giảm giá 10% để kích cầu đầu mùa.
- **Nguyên liệu**: Giá bông thế giới đang ổn định, nhưng chi phí vận chuyển tăng nhẹ (2%).
            `;
            generalAdvice = 'Nên tập trung vào các combo áo phông + quần short. Áp dụng chiến lược giá "Mua nhiều giảm sâu" để đẩy hàng tồn kho vụ trước.';

            // Mock rules generation
            if (Array.isArray(products)) {
                rules = products.map((p: any) => ({
                    product_sku: p.sku,
                    price_100: Math.floor(p.price * 0.85 / 1000) * 1000, // Giả lập giảm 15%
                    price_50: Math.floor(p.price * 0.90 / 1000) * 1000,
                    price_30: Math.floor(p.price * 0.95 / 1000) * 1000,
                    min_margin: 15,
                    reason: 'Mùa hè cạnh tranh cao, cần giá tốt để volume lớn.'
                }));
            }

        } else if (scenario === 'Khach VIP') {
            marketAnalysis = `
### Phân tích Khách hàng VIP/Doanh nghiệp:
- **Đặc điểm**: Nhạy cảm về chất lượng phục vụ hơn là giá cả tuyệt đối. Luôn ưu tiên độ ổn định và giao hàng đúng hẹn.
- **Đối thủ**: Thường chiết khấu 20% cho đơn hàng > 1000 bộ.
            `;
            generalAdvice = 'Đề xuất mức giá Premium nhưng đi kèm cam kết "Ưu tiên sản xuất". Mức giảm giá không cần quá sâu nhưng cần rõ ràng theo bậc thang.';

            if (Array.isArray(products)) {
                rules = products.map((p: any) => ({
                    product_sku: p.sku,
                    price_100: Math.floor(p.price * 0.80 / 1000) * 1000, // VIP discount tốt hơn
                    price_50: Math.floor(p.price * 0.85 / 1000) * 1000,
                    price_30: Math.floor(p.price * 0.90 / 1000) * 1000,
                    min_margin: 10,
                    reason: 'Chính sách ưu đãi độc quyền cho VIP.'
                }));
            }
        } else {
            marketAnalysis = `
### Phân tích Chung:
- Thị trường đang trong giai đoạn bão hòa nhẹ.
- Giá nguyên phụ liệu không biến động nhiều.
            `;
            generalAdvice = 'Giữ nguyên mức biên lợi nhuận tiêu chuẩn (30%).';
            if (Array.isArray(products)) {
                rules = products.map((p: any) => ({
                    product_sku: p.sku,
                    price_100: Math.floor(p.price * 0.90 / 1000) * 1000,
                    price_50: Math.floor(p.price * 0.95 / 1000) * 1000,
                    price_30: Math.floor(p.price * 1.0 / 1000) * 1000,
                    min_margin: 20,
                    reason: 'Mức giá tiêu chuẩn.'
                }));
            }
        }

        return {
            market_analysis: marketAnalysis,
            general_advice: generalAdvice,
            suggested_rules: rules
        };
    }
}
