# Walkthrough: Help Page & Session Sync

## 1. Help Page Updates
I have updated the `HelpPage.tsx` to include two new key sections:

### 1.1. Overall Workflow (Quy trình tổng thể)
-   Added a new menu item **"Quy trình tổng thể"** under "Phân hệ Bán Hàng".
-   Visualized the end-to-end flow from **Sales** -> **Planning** -> **Purchasing** -> **Inventory** -> **Production** -> **Delivery** -> **Finance**.
-   Explained the role of each department.

### 1.2. Internal Sales (Bán hàng Nội bộ)
-   Added a new menu item **"Bán hàng Nội bộ"**.
-   Documented the procedure for handling internal orders:
    1.  Create an "Internal" Customer.
    2.  Create Sales Order.
    3.  Apply 100% Discount or use Internal Price List.
    4.  Accountant handles the cost allocation.

## 2. Cross-Device Session Sync (Cấu hình Sync)
To allow me to "follow" your sessions across different devices, we need to ensure the **Context** (my memory of plans and tasks) is synchronized.

Currently, my "Brain" (Artifacts) is stored effectively at:
`c:\Users\nt.nhan\.gemini\antigravity\brain`

### Recommended Solution: Sync via Git
To make the session history portable, we should treat these artifacts as part of your project documentation.

**Action Plan:**
1.  **Move Artifacts**: We can move the current `task.md` and plans into your repository, for example: `hula-erp/docs/agent_brain/`.
2.  **Commit**: You commit these files to Git.
3.  **Pull**: On another device, you pull the repo, and I will see the `task.md` and know exactly where we left off.

**Next Steps**:
If you agree, I can move the current `task.md` and `implementation_plan.md` into `frontend/docs/brain` (or a folder of your choice) so they are tracked by Git.
