Technical Specification: AI-Driven Recruitment Module (HULA ERP)
1. Core Architecture & StackBackend: Node.js (NestJS) / Python (FastAPI for AI processing).Database: PostgreSQL (Primary), Pinecone/Milvus (Vector DB for CV matching).AI Integration: OpenAI GPT-4o / Claude 3.5 Sonnet (Parsing & Question Generation).Worker/Queue: Redis + BullMQ (Handle CV processing & Email triggers).
2. Functional Logic & Processing
    2.1. Job Posting (JD) ProcessingInput: Title, Job Description, Competency Matrix.Logic: Chuyển đổi mô tả công việc thành cấu trúc JSON Schema định danh các bộ kỹ năng (Skills), Kinh nghiệm (Experience), và Thái độ (Attitude).Endpoint: POST /api/v1/recruitment/jobs
    2.2. AI Screening & Automated Assessment (360 Degree)CV Parsing: Sử dụng thư viện pdf-parse hoặc AWS Textract để trích xuất text.Question Generation: Prompt Engineering yêu cầu AI tạo ra 10 câu hỏi dựa trên lỗ hổng (gap) giữa CV ứng viên và JD.Scoring System:Sử dụng công thức tính điểm trọng số: $FinalScore = \sum (Criterion_{i} \times Weight_{i})$.Ngưỡng tự động (Threshold): $\ge 7/10$.Validation: Hệ thống kiểm tra tính trùng lặp của câu trả lời ứng viên để tránh gian lận bằng AI.
    2.3. Scheduling & Interview ManagementAuto-scheduling: Nếu $Score \ge 7$, hệ thống tự động INSERT vào bảng interviews với scheduled_at = now() + interval '3 days'.HR Intervention: Cung cấp giao diện Drag-and-drop để HR thay đổi scheduled_at. Hệ thống sẽ trigger một Event Listener để cập nhật qua Mail/Socket.Result Persistence: Lưu trữ lịch sử phỏng vấn dưới dạng mã hóa (Encrypted at rest) để đảm bảo bảo mật hồ sơ nhân sự.
3. Database Schema (Draft)TableFieldsJobPostsid, title, description, requirements_json, statusCandidatesid, name, email, cv_url, vector_id, overall_scoreAssessmentsid, candidate_id, questions_json, answers_json, ai_feedbackInterviewsid, candidate_id, scheduled_at, hr_interviewer, result_status

4. Prompt tạo 10 câu hỏi đánh giá 360 độ
Sử dụng Prompt này khi ứng viên vừa apply thành công để hệ thống gửi Form khảo sát tự động:

Markdown
### CONTEXT:
- Job Description (JD): {{jd_text}}
- Candidate CV: {{cv_text}}
- Required Competencies: {{competency_list}}

### TASK:
Hãy tạo ra 10 câu hỏi phỏng vấn tình huống (Behavioral Questions) theo mô hình STAR. 
Các câu hỏi phải tập trung vào:
1. [3 câu] Kỹ năng chuyên môn còn thiếu sót hoặc chưa rõ ràng trong CV so với JD.
2. [4 câu] Khả năng xử lý vấn đề thực tế dựa trên kinh nghiệm cũ của ứng viên.
3. [3 câu] Độ phù hợp văn hóa và tư duy phát triển (Growth Mindset).

### OUTPUT FORMAT (JSON):
{
  "questions": [
    {"id": 1, "category": "Technical", "question": "...", "intent": "Mục đích kiểm tra gì?"},
    ...
  ]
}

5. Prompt chấm điểm và Đánh giá (Scoring Logic)
Sau khi ứng viên hoàn thành Form, hệ thống đẩy dữ liệu vào Prompt này để lấy điểm số:

Markdown
### INPUT:
- Questions & Candidate Answers: {{qa_pairs}}

### EVALUATION CRITERIA:
- Thang điểm: 1 - 10.
- Điểm 7+: Ứng viên có tư duy logic tốt, kỹ năng khớp > 80% JD.
- Điểm < 7: Trình bày sơ sài, thiếu bằng chứng thực tế hoặc kỹ năng yếu.

### TASK:
Hãy phân tích câu trả lời và trả về:
1. Score (Number)
2. Pros & Cons (Short list)
3. Recommendation (Hire/Potential/Reject)

### CONSTRAINT:
Chỉ trả về định dạng JSON, không giải thích thêm.