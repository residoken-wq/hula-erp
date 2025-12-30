---
description: Các prompt ngắn gọn để giao tiếp nhanh với AI
---

# 📌 Hướng dẫn sử dụng Prompt Ngắn

## 1. Resume Dự Án
| Prompt | Ý nghĩa |
|--------|---------|
| `/resume soc` | Tiếp tục dự án SOC Dashboard/Agent |
| `/resume erp` | Tiếp tục dự án Hula ERP |
| `/resume [tên]` | Tiếp tục dự án theo tên |

**Khi nhận prompt này:**
1. Đọc lại task.md và implementation_plan.md gần nhất
2. Kiểm tra các task còn dang dở `[ ]` hoặc `[/]`
3. Tiếp tục công việc từ task chưa hoàn thành

---

## 2. Review Công Việc
| Prompt | Ý nghĩa |
|--------|---------|
| `/review today` | Xem lại công việc hôm nay |
| `/review 29-30` | Xem công việc ngày 29-30 |
| `/status` | Tổng quan nhanh tiến độ các dự án |

**Khi nhận prompt này:**
1. Đọc các artifact (task.md, walkthrough.md) trong brain folder
2. Tổng hợp ngắn gọn những gì đã làm
3. Liệt kê các task còn pending

---

## 3. Fix / Debug
| Prompt | Ý nghĩa |
|--------|---------|
| `fix [mô tả lỗi]` | Debug và sửa lỗi |
| `debug [component]` | Phân tích và sửa lỗi component |
| `why [hiện tượng]` | Giải thích tại sao có hiện tượng này |

**Ví dụ:**
- `fix stock not updating` → Sửa lỗi tồn kho không cập nhật
- `fix login failed` → Sửa lỗi đăng nhập
- `debug PlanningPage` → Debug trang Planning

---

## 4. Add Feature
| Prompt | Ý nghĩa |
|--------|---------|
| `add [feature] to [page]` | Thêm tính năng vào trang |
| `new [module/page]` | Tạo module/trang mới |
| `update [component]` | Cập nhật component |

**Ví dụ:**
- `add filter to alerts` → Thêm filter vào trang alerts
- `new ReportPage` → Tạo trang Report mới
- `update ProductsPage columns` → Cập nhật cột trong ProductsPage

---

## 5. Deploy & Build
| Prompt | Ý nghĩa |
|--------|---------|
| `deploy` | Hướng dẫn hoặc chạy deploy |
| `build` | Build production |
| `start` | Start development server |
| `test` | Chạy tests |

---

## 6. Code Actions
| Prompt | Ý nghĩa |
|--------|---------|
| `show [file/function]` | Xem nội dung file hoặc function |
| `find [keyword]` | Tìm kiếm trong codebase |
| `refactor [target]` | Refactor code |
| `clean [target]` | Dọn dẹp code thừa |

---

## 7. Quick Questions
| Prompt | Ý nghĩa |
|--------|---------|
| `how [action]` | Hướng dẫn cách làm |
| `what is [term]` | Giải thích thuật ngữ |
| `where [target]` | Tìm vị trí file/code |

---

## 💡 Tips
- Prompt càng ngắn càng tốt, AI sẽ hỏi lại nếu cần chi tiết
- Có thể kết hợp: `fix + deploy` = sửa lỗi rồi deploy
- Dùng tiếng Việt hoặc Anh đều được
