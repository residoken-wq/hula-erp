import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
    async suggestPrice(dto: any) {
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
