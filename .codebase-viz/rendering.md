# Rendering Architecture

```mermaid
%% chunk:1/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src.ai"]
    direction TB
  leaf_ai_controller["`📄 **ai.controller** [/ai]
─────────────
**POST** /pricing
**POST** /chat
**POST** /chat-stream
**POST** /suggest-reply
**POST** /feedback
**GET** /analytics
**GET** /proactive`"]:::ctrl
  end
%%--CHUNK--%%
%% chunk:2/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src.analytics"]
    direction TB
  leaf_analytics_controller["`📄 **analytics.controller** [/public/analytics]
─────────────
**POST** /ping
**GET** /stats
**GET** /visitors`"]:::ctrl
  end
%%--CHUNK--%%
%% chunk:3/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src.announcements"]
    direction TB
  leaf_announcements_controller["`📄 **announcements.controller** [/announcements]
─────────────
**GET** /
**GET** /:id
**POST** /
**PUT** /:id
**DELETE** /:id
**GET** /user/active
**GET** /user/unread
**GET** /user/unread-count
**POST** /:id/read
**POST** /user/read-all
─────────────
🗄 announcements`"]:::ctrl
  end
%%--CHUNK--%%
%% chunk:4/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src.auth"]
    direction TB
  leaf_auth_controller["`📄 **auth.controller** [/auth]
─────────────
**POST** /login`"]:::ctrl
  end
%%--CHUNK--%%
%% chunk:5/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src.blogs"]
    direction TB
  leaf_blogs_controller["`📄 **blogs.controller** [/blogs]
─────────────
**GET** /categories
**POST** /categories
**GET** /
**GET** /:id
**POST** /
**PUT** /:id
**POST** /:id/publish
**POST** /:id/unpublish
**DELETE** /:id`"]:::ctrl
  end
%%--CHUNK--%%
%% chunk:6/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src.categories"]
    direction TB
  leaf_categories_controller["`📄 **categories.controller** [/categories]
─────────────
**GET** /
**POST** /
**PUT** /:id
**DELETE** /:id
─────────────
🗄 categories`"]:::ctrl
  end
%%--CHUNK--%%
%% chunk:7/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src.customers"]
    direction TB
  leaf_customers_controller["`📄 **customers.controller** [/customers]
─────────────
**POST** /
**GET** /
**GET** /:id
**PUT** /:id
**DELETE** /:id
**POST** /:id/impersonate
**POST** /:id/follow
**GET** /:id/orders
**PUT** /:id/bod-follow-up
**GET** /:id/comments
**POST** /:id/comment
**GET** /:id/credits
**POST** /:id/credits
─────────────
🗄 customers`"]:::ctrl
  end
%%--CHUNK--%%
%% chunk:8/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src.designs"]
    direction TB
  leaf_designs_controller["`📄 **designs.controller** [/designs]
─────────────
**GET** /logos
**POST** /logos
**PUT** /logos/:id
**DELETE** /logos/:id
**GET** /print-designs
**GET** /print-designs/:id
**POST** /print-designs
**PUT** /print-designs/:id
**DELETE** /print-designs/:id
**GET** /print-samples
**POST** /print-samples
**PUT** /print-samples/:id/status`"]:::ctrl
  end
%%--CHUNK--%%
%% chunk:9/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src.discussions"]
    direction TB
  leaf_discussions_controller["`📄 **discussions.controller** [/discussions]
─────────────
**GET** /
**GET** /:id
**POST** /
**PUT** /:id
**DELETE** /:id
**POST** /:id/comments
**DELETE** /comments/:commentId
**PUT** /:id/review
─────────────
🗄 discussions`"]:::ctrl
  end
%%--CHUNK--%%
%% chunk:10/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src.finance"]
    direction TB
  leaf_cash_flow_controller["`📄 **cash-flow.controller** [/finance/cash-flow]
─────────────
**GET** /summary
**GET** /chart
**GET** /receivables
**GET** /payables
**GET** /alerts`"]:::ctrl
  leaf_finance_controller["`📄 **finance.controller** [/finance]
─────────────
**GET** /summary
**GET** /categories
**POST** /categories
**PUT** /categories/:id
**DELETE** /categories/:id
**GET** /transactions
**POST** /transactions
**PUT** /transactions/:id
**DELETE** /transactions/:id
**GET** /report
**GET** /so-profit
**GET** /history/:refCode
**POST** /payment
**POST** /payment/po
**POST** /payment/bulk-po
**POST** /payment/fix-mapping`"]:::ctrl
  end
%%--CHUNK--%%
%% chunk:11/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src.hr"]
    direction TB
  leaf_hr_controller["`📄 **hr.controller** [/hr]
─────────────
**GET** /shifts
**POST** /shifts
**PUT** /shifts/:id
**DELETE** /shifts/:id
**GET** /employees
**GET** /employees/by-user/:userId
**GET** /employees/:id
**POST** /employees
**PUT** /employees/:id
**DELETE** /employees/:id
**GET** /attendances
**POST** /check-in
**POST** /check-out
**POST** /attendances
**PUT** /attendances/:id
**DELETE** /attendances/:id
**GET** /leaves
**POST** /leaves
**PUT** /leaves/:id/approve
**DELETE** /leaves/:id
**GET** /entitlements
**POST** /entitlements
**PUT** /entitlements/:id
**GET** /balance/:employeeId
**GET** /assets
**POST** /assets
**PUT** /assets/:id
**DELETE** /assets/:id
**GET** /payslips
**POST** /payslips
**PUT** /payslips/:id
**DELETE** /payslips/:id
**GET** /trainings
**POST** /trainings
**PUT** /trainings/:id
**DELETE** /trainings/:id
**GET** /recruitment/jobs
**POST** /recruitment/jobs
**PUT** /recruitment/jobs/:id
**DELETE** /recruitment/jobs/:id
**POST** /recruitment/jobs/parse-requirements
**GET** /recruitment/candidates
**POST** /recruitment/candidates
**PUT** /recruitment/candidates/:id
**DELETE** /recruitment/candidates/:id
**POST** /recruitment/candidates/:id/send-assessment
**POST** /recruitment/candidates/:id/generate-questions
**GET** /recruitment/assessments/:candidateId
**POST** /recruitment/assessments/:id/evaluate
**GET** /recruitment/interviews
**POST** /recruitment/interviews
**PUT** /recruitment/interviews/:id
**DELETE** /recruitment/interviews/:id
**GET** /review-questions
**POST** /review-questions
**PUT** /review-questions/:id
**DELETE** /review-questions/:id
**GET** /review-campaigns
**POST** /review-campaigns
**PUT** /review-campaigns/:id
**DELETE** /review-campaigns/:id
**GET** /employee-reviews
**POST** /employee-reviews/:id/submit
**POST** /review-questions-seed`"]:::ctrl
  end
%%--CHUNK--%%
%% chunk:12/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src.inventory"]
    direction TB
  pkg_samples["samples"]:::pkg
  leaf_inventory_samples_controller["`📄 **inventory-samples.controller** [/inventory/samples]
─────────────
**GET** /transactions
**POST** /transactions
**GET** /transactions/:id
**POST** /transactions/:id/confirm
**DELETE** /transactions/:id
**GET** /stocks`"]:::ctrl
  pkg_samples --> leaf_inventory_samples_controller
  leaf_inventory_controller["`📄 **inventory.controller** [/inventory]
─────────────
**GET** /history
**GET** /stocks
**POST** /adjust
**POST** /reset
**POST** /transfer
**POST** /goods-receipt/draft
**GET** /goods-receipt/pending
**GET** /goods-receipt/po/:poId
**POST** /goods-receipt/:id/confirm
**DELETE** /goods-receipt/:id
**GET** /deliveries/pending
**GET** /deliveries/completed
**POST** /deliveries/:id/confirm
**GET** /shipping-carriers
**POST** /shipping-carriers
**PUT** /shipping-carriers/:id
**DELETE** /shipping-carriers/:id
**POST** /goods-issue
**PUT** /goods-issue/:id
**GET** /goods-issue/unlinked/:pfoId
**POST** /goods-issue/:id/link-po
**GET** /goods-issue
**GET** /goods-issue/:id
**POST** /goods-issue/:id/confirm
**POST** /goods-issue/:id/delivered
**DELETE** /goods-issue/:id
**GET** /supplier-stocks/all
**GET** /supplier-stocks/:supplierId`"]:::ctrl
  end
%%--CHUNK--%%
%% chunk:13/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src.marketing"]
    direction TB
  leaf_marketing_controller["`📄 **marketing.controller** [/marketing]
─────────────
**GET** /dashboard
**GET** /campaigns
**GET** /campaigns/:id
**POST** /campaigns
**PUT** /campaigns/:id
**PUT** /campaigns/:id/status
**DELETE** /campaigns/:id
**GET** /segments
**GET** /segments/:id
**GET** /segments/:id/customers
**POST** /segments/:id/calculate
**POST** /segments
**PUT** /segments/:id
**DELETE** /segments/:id
**GET** /workflows
**GET** /workflows/:id
**POST** /workflows
**PUT** /workflows/:id
**PUT** /workflows/:id/status
**DELETE** /workflows/:id`"]:::ctrl
  end
%%--CHUNK--%%
%% chunk:14/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src.materials"]
    direction TB
  leaf_materials_controller["`📄 **materials.controller** [/materials]
─────────────
**GET** /
**POST** /
**PUT** /:id
**DELETE** /:id
─────────────
🗄 materials`"]:::ctrl
  end
%%--CHUNK--%%
%% chunk:15/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src.notifications"]
    direction TB
  leaf_notifications_controller["`📄 **notifications.controller** [/notifications]
─────────────
**GET** /
**POST** /:id/read
**POST** /read-all
─────────────
🗄 notifications`"]:::ctrl
  end
%%--CHUNK--%%
%% chunk:16/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src.planning"]
    direction TB
  leaf_planning_controller["`📄 **planning.controller** [/planning]
─────────────
**GET** /
**GET** /suggestion
**GET** /booking-stats
**GET** /bookings
**GET** /bookings/:sku
**GET** /gantt
**POST** /sync-booking-stock
**GET** /pfo/suggestions
**POST** /pfo/generate
**POST** /pfo/material-issue/:reqId
**GET** /pfo/:id
**POST** /pfo/:id/calculate-bom
**POST** /pfo/:id/save-requirements
**POST** /pfo/:id/request-material
**POST** /pfo/:id/assign-vendor
**POST** /pfo/:id/process-routing
**POST** /pfo/:id/generate-pos
**GET** /pfo/:id/pos
**GET** /pfo/:id/pxks
**POST** /pfo/:id/milestone
**POST** /pfo/:id/qc
**GET** /:id/booking-items
**POST** /:id/confirm-bookings
**POST** /bookings/:itemId/revert`"]:::ctrl
  end
%%--CHUNK--%%
%% chunk:17/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src.processes"]
    direction TB
  leaf_processes_controller["`📄 **processes.controller** [/processes]
─────────────
**GET** /
**POST** /
**PUT** /:id
**DELETE** /:id
**POST** /seed
─────────────
🗄 processes`"]:::ctrl
  end
%%--CHUNK--%%
%% chunk:18/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src.production"]
    direction TB
  leaf_production_controller["`📄 **production.controller** [/production]
─────────────
**POST** /orders
**GET** /orders
**POST** /orders/:id/start
**POST** /orders/:id/complete
**GET** /work-orders/plan/:pfoId
**GET** /work-orders/:id
**PUT** /steps/:stepId/status
**DELETE** /steps/:stepId
**POST** /assignments
**GET** /assignments
**GET** /assignments/:id
**PUT** /assignments/:id
**DELETE** /assignments/:id`"]:::ctrl
  end
%%--CHUNK--%%
%% chunk:19/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src.products"]
    direction TB
  leaf_products_controller["`📄 **products.controller** [/products]
─────────────
**GET** /
**GET** /:id
**POST** /
**PUT** /:id
**DELETE** /:id
**POST** /create-variant
**GET** /:id/routings
**POST** /:id/routings
**GET** /:id/logistics
**POST** /:id/logistics
**GET** /:id/pattern
**POST** /:id/pattern
**GET** /:id/website-config
**POST** /:id/website-config
**GET** /:sku/boms
**POST** /:id/boms
**POST** /:id/sync-variants
**GET** /combo/:sku
**POST** /combo/add
**DELETE** /combo/item/:id
**POST** /:id/components
**POST** /copy-bom
**POST** /copy-routings
**POST** /copy-logistics
**GET** /calculate-cost/:sku
**POST** /calculate-all-costs
─────────────
🗄 products`"]:::ctrl
  end
%%--CHUNK--%%
%% chunk:20/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src.projects"]
    direction TB
  leaf_projects_controller["`📄 **projects.controller** [/projects]
─────────────
**GET** /
**GET** /:id
**POST** /
**PUT** /:id
**DELETE** /:id
**POST** /from-so/:soId
**GET** /:id/cost-summary
**POST** /:id/milestones
**PUT** /milestones/:milestoneId
**DELETE** /milestones/:milestoneId
─────────────
🗄 projects`"]:::ctrl
  end
%%--CHUNK--%%
%% chunk:21/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src.public"]
    direction TB
  leaf_portal_controller["`📄 **portal.controller** [/public/portal]
─────────────
**POST** /request-otp
**POST** /verify-otp
**GET** /dashboard/:slug
**POST** /reorder/:slug
**GET** /validate-token
**GET** /promotion/:slug/:id
**POST** /promotion/:slug/:id/order
**GET** /product-stats/:slug
**POST** /custom-order/:slug`"]:::ctrl
  leaf_public_controller["`📄 **public.controller** [/public]
─────────────
**GET** /home-config
**GET** /about-config
**GET** /settings
**GET** /products/:sku
**GET** /categories
**GET** /blogs
**GET** /blogs/:slug
**POST** /leads
**POST** /orders
**GET** /products
**GET** /policies
**GET** /policies/:slug
**PUT** /policies/:slug
**GET** /wizard/config
**PUT** /wizard/config
**GET** /recruitment/jobs
**GET** /recruitment/jobs/:slug
**POST** /recruitment/apply
**GET** /recruitment/portal/:token
**POST** /recruitment/portal/:token/submit-assessment
**POST** /wizard/submit
**GET** /projects
**GET** /projects/:slug
**POST** /projects
**PUT** /projects/:id
**DELETE** /projects/:id
**GET** /portal/quote/:uuid
**POST** /portal/quote/:uuid/action
**POST** /portal/quote/:orderId/comment
**DELETE** /portal/quote/comment/:commentId
**GET** /proxy-image`"]:::ctrl
  end
%%--CHUNK--%%
%% chunk:22/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src.purchasing"]
    direction TB
  leaf_purchasing_controller["`📄 **purchasing.controller** [/purchasing]
─────────────
**POST** /
**GET** /
**GET** /requirements
**GET** /available-for-pooling
**DELETE** /pooled/all
**POST** /create-pooled
**GET** /pooled/:id/aggregate
**GET** /:id
**PUT** /:id
**POST** /batch-delete
**DELETE** /:id
**GET** /:id/outsourcing-materials
**POST** /:id/receive
**GET** /portal/:uuid
**POST** /portal/:uuid/action`"]:::ctrl
  end
%%--CHUNK--%%
%% chunk:23/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src.qc"]
    direction TB
  leaf_qc_controller["`📄 **qc.controller** [/qc]
─────────────
**POST** /
**GET** /
**GET** /summary
**GET** /supplier/:id/report
**GET** /:id
**POST** /:id/start
**POST** /:id/complete
**POST** /:id/defects
**DELETE** /defects/:defectId
**DELETE** /:id`"]:::ctrl
  end
%%--CHUNK--%%
%% chunk:24/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src.sales"]
    direction TB
  leaf_sales_controller["`📄 **sales.controller** [/sales]
─────────────
**POST** /price-lists
**GET** /price-lists
**POST** /price-lists/:id/rules
**GET** /price-lists/:id/rules
**GET** /validate-price
**GET** /samples/all
**GET** /analytics
**POST** /analytics/push-reminder
**GET** /targets
**POST** /targets
**GET** /promotions
**GET** /promotions/active
**GET** /promotions/for-customer/:customerId
**POST** /promotions
**PUT** /promotions/:id
**DELETE** /promotions/:id
**GET** /:id/comments
**POST** /:id/comment
**PUT** /comment/:id
**POST** /comment/:id/toggle
**DELETE** /comment/:id
**GET** /:id/deliveries
**POST** /:id/delivery
**PUT** /delivery/:deliveryId
**GET** /:code/payments
**GET** /:code/payment-history
**GET** /portal/:uuid
**POST** /portal/:uuid/action
**POST** /
**GET** /
**GET** /:idOrCode
**PUT** /:id
**POST** /:id/convert
**PUT** /:id/bod-follow-up
**PUT** /quote/:id
**DELETE** /quote/:id
**POST** /:id/approve-samples
**POST** /:id/complete
**POST** /:id/cancel
**POST** /:id/revision
**GET** /:id/revisions
**DELETE** /delivery/:deliveryId
**DELETE** /:id
**POST** /:id/book-items
**GET** /:id/checklist
**POST** /:id/checklist/init
**POST** /:id/checklist/toggle/:itemId
**POST** /:id/checklist/add
**PUT** /:id/checklist/:itemId/note
**DELETE** /:id/checklist/:itemId
**POST** /:id/checklist/sync`"]:::ctrl
  end
%%--CHUNK--%%
%% chunk:25/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src.social"]
    direction TB
  leaf_social_controller["`📄 **social.controller** [/social]
─────────────
**GET** /channels
**GET** /channels/:id
**GET** /channels/:id/stats
**POST** /channels
**PUT** /channels/:id
**DELETE** /channels/:id
**GET** /orders
**GET** /orders/:id
**POST** /orders/:id/sync
**GET** /mappings
**POST** /mappings
**PUT** /mappings/:id
**DELETE** /mappings/:id`"]:::ctrl
  end
%%--CHUNK--%%
%% chunk:26/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src.suppliers"]
    direction TB
  leaf_suppliers_controller["`📄 **suppliers.controller** [/suppliers]
─────────────
**POST** /
**GET** /
**GET** /:id
**GET** /:id/transactions
**PUT** /:id
**DELETE** /:id
**POST** /:id/material-price
**DELETE** /material-price/:id
**POST** /price
**POST** /check-price
─────────────
🗄 suppliers`"]:::ctrl
  end
%%--CHUNK--%%
%% chunk:27/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src.system"]
    direction TB
  leaf_agent_api_controller["`📄 **agent-api.controller** [/api/v1/agent]
─────────────
**GET** /orders
**GET** /orders/:id
**GET** /inventory
**GET** /mrp/needs
**GET** /customers`"]:::ctrl
  leaf_dashboard_controller["`📄 **dashboard.controller** [/system/dashboard]
─────────────
**GET** /stats`"]:::ctrl
  leaf_system_controller["`📄 **system.controller** [/system]
─────────────
**GET** /smtp
**POST** /smtp
**POST** /smtp/test
**GET** /company
**POST** /company
**GET** /seller-info
**GET** /logs
**GET** /api-tokens
**POST** /api-tokens
**DELETE** /api-tokens/:id
**GET** /config/:key
**POST** /config
**GET** /templates
**POST** /templates
**DELETE** /templates/:id
**GET** /email-templates
**POST** /email-templates
**DELETE** /email-templates/:id
**GET** /home-config
**POST** /home-config
**GET** /about-config
**POST** /about-config
**GET** /so-project-template
**POST** /so-project-template`"]:::ctrl
  end
%%--CHUNK--%%
%% chunk:28/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src.tasks"]
    direction TB
  leaf_tasks_controller["`📄 **tasks.controller** [/tasks]
─────────────
**GET** /
**POST** /
**PUT** /:id
**DELETE** /:id
**POST** /:id/start-timer
**POST** /:id/stop-timer
**GET** /:id/logs
─────────────
🗄 tasks`"]:::ctrl
  end
%%--CHUNK--%%
%% chunk:29/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src.upload"]
    direction TB
  leaf_upload_controller["`📄 **upload.controller** [/upload]
─────────────
**GET** /list
**GET** /usage
**POST** /materials
**POST** /image
**POST** /products
**POST** /boms
**POST** /combos
**POST** /customers
**POST** /sales
**POST** /file
**POST** /watermark/image
**GET** /watermark/config
**POST** /watermark/config
**POST** /watermark/b2b/image
**GET** /watermark/b2b/config
**POST** /watermark/b2b/config
**POST** /watermark/regenerate
**GET** /files/original/:filename
**GET** /files/b2b/:filename
**GET** /template/:type
**GET** /files/:filename
**DELETE** /files/:filename`"]:::ctrl
  end
%%--CHUNK--%%
%% chunk:30/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src.users"]
    direction TB
  leaf_users_controller["`📄 **users.controller** [/users]
─────────────
**GET** /
**GET** /online
**POST** /
**PUT** /:id
**DELETE** /:id
**POST** /:id/change-password
**GET** /groups
**GET** /groups/:id
**POST** /groups
**POST** /groups/:id/permissions
**POST** /groups/:id/update
─────────────
🗄 users`"]:::ctrl
  end
%%--CHUNK--%%
%% chunk:31/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src.website-projects"]
    direction TB
  leaf_website_projects_controller["`📄 **website-projects.controller** [/website-projects]
─────────────
**GET** /
**GET** /:id
**POST** /
**PUT** /:id
**DELETE** /:id
─────────────
🗄 projects`"]:::ctrl
  end
%%--CHUNK--%%
%% chunk:32/32
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#0c1a30','primaryTextColor':'#7dd3fc','primaryBorderColor':'#0e3a6e','edgeLabelBackground':'#0c1a30','lineColor':'#334155','secondaryColor':'#0f172a','clusterBkg':'#060c18','clusterBorder':'#1e3a5f','fontFamily':'JetBrains Mono','fontSize':'14'},'flowchart':{'nodeSpacing':25,'rankSpacing':8,'padding':4}}}%%
graph TD
  classDef ssr fill:#0d1a0d,stroke:#16a34a,color:#86efac
  classDef ctrl fill:#042f2e,stroke:#0d9488,color:#5eead4
  classDef csr fill:#2d1200,stroke:#c2410c,color:#fb923c
  classDef ssg fill:#1a0d1a,stroke:#7c3aed,color:#c4b5fd
  classDef isr fill:#1a1a0d,stroke:#ca8a04,color:#fde047
  classDef ppr fill:#0d1a2d,stroke:#2563eb,color:#93c5fd
  classDef unk fill:#1a1a1a,stroke:#6b7280,color:#9ca3af
  classDef pkg fill:#0c1018,stroke:#475569,color:#cbd5e1
  classDef ext fill:#2d1a06,stroke:#d97706,color:#fcd34d
  classDef muted fill:#0a0d14,stroke:#374151,color:#64748b,stroke-dasharray: 3 3
  classDef hdr fill:#06080f,stroke:#1e3a5f,color:#7dd3fc
  subgraph HDR_PKG ["📁 src/main/java/src"]
    direction TB
  leaf_app_controller["`📄 **app.controller**
─────────────
**GET** /test`"]:::ctrl
  end
```
