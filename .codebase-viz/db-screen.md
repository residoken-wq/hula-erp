# Data Flow (Screen ↔ Data Source)

```mermaid
%%{init:{'theme':'base','themeVariables':{'background':'#060810','primaryColor':'#2a4055','primaryTextColor':'#f8fafc','primaryBorderColor':'#1e4060','lineColor':'#f59e0b','secondaryColor':'#0f172a','tertiaryColor':'#1a0a20','attributeBackgroundColorEven':'#ffffff','attributeBackgroundColorOdd':'#f1f5f9','textColor':'#1e293b','nodeBorder':'#1e4060','clusterBkg':'#0a0e1a','fontFamily':'JetBrains Mono','fontSize':'14'}}}%%
erDiagram
%% table:ai_feedbacks path:src/ai/ai-feedback.entity.ts
%% table:ai_learned_examples path:src/ai/ai-learned-example.entity.ts
%% table:ai_messages path:src/ai/ai-message.entity.ts
%% table:analytics_visitors path:src/analytics/analytics-visitor.entity.ts
%% table:announcement_reads path:src/announcements/announcement-read.entity.ts
%% table:announcements path:src/announcements/announcement.entity.ts
%% table:blog_posts path:src/blogs/blog-post.entity.ts
%% table:product_bom path:src/bom/bom.entity.ts
%% table:categories path:src/categories/category.entity.ts
%% table:customer_comments path:src/customers/customer-comment.entity.ts
%% table:customer_contacts path:src/customers/customer-contact.entity.ts
%% table:customer_credits path:src/customers/customer-credit.entity.ts
%% table:customers path:src/customers/customer.entity.ts
%% table:transaction_categories path:src/finance/transaction-category.entity.ts
%% table:transactions path:src/finance/transaction.entity.ts
%% table:inventory_stocks path:src/inventory/inventory-stock.entity.ts
%% table:stock_history path:src/inventory/stock-history.entity.ts
%% table:materials path:src/materials/material.entity.ts
%% table:notifications path:src/notifications/notification.entity.ts
%% table:pfo_material_requirements path:src/planning/pfo-material-requirement.entity.ts
%% table:pfo_milestones path:src/planning/pfo-milestone.entity.ts
%% table:pfo_qc_records path:src/planning/pfo-qc-record.entity.ts
%% table:production_fulfillment_orders path:src/planning/pfo.entity.ts
%% table:processes path:src/processes/process.entity.ts
%% table:work_order_steps path:src/production/work-order-step.entity.ts
%% table:work_orders path:src/production/work-order.entity.ts
%% table:product_components path:src/products/product-component.entity.ts
%% table:product_logistics path:src/products/product-logistics.entity.ts
%% table:product_patterns path:src/products/product-pattern.entity.ts
%% table:product_routings path:src/products/product-routing.entity.ts
%% table:products path:src/products/product.entity.ts
%% table:purchase_deliveries path:src/purchasing/purchase-delivery.entity.ts
%% table:qc_defect_items path:src/qc/qc-defect-item.entity.ts
%% table:quality_inspections path:src/qc/quality-inspection.entity.ts
%% table:product_samples path:src/sales/product-sample.entity.ts
%% table:promotions path:src/sales/promotion.entity.ts
%% table:sales_checklist_items path:src/sales/sales-checklist-item.entity.ts
%% table:sales_checklists path:src/sales/sales-checklist.entity.ts
%% table:sales_comments path:src/sales/sales-comment.entity.ts
%% table:sales_delivery_items path:src/sales/sales-delivery-item.entity.ts
%% table:sales_deliveries path:src/sales/sales-delivery.entity.ts
%% table:sales_order_items path:src/sales/sales-order-item.entity.ts
%% table:sales_order_versions path:src/sales/sales-order-version.entity.ts
%% table:sales_orders path:src/sales/sales-order.entity.ts
%% table:sales_targets path:src/sales/sales-target.entity.ts
%% table:supplier_contacts path:src/suppliers/supplier-contact.entity.ts
%% table:supplier_materials path:src/suppliers/supplier-material.entity.ts
%% table:suppliers path:src/suppliers/supplier.entity.ts
%% table:contract_templates path:src/system/contract-template.entity.ts
%% table:email_templates path:src/system/email-template.entity.ts
%% table:system_configs path:src/system/system-config.entity.ts
%% table:task_time_logs path:src/tasks/task-time-log.entity.ts
%% table:tasks path:src/tasks/task.entity.ts
%% table:customer_logos path:src/designs/entities/customer-logo.entity.ts
%% table:print_designs path:src/designs/entities/print-design.entity.ts
%% table:print_samples path:src/designs/entities/print-sample.entity.ts
%% table:discussion_comments path:src/discussions/entities/discussion-comment.entity.ts
%% table:discussions path:src/discussions/entities/discussion.entity.ts
%% table:assessments path:src/hr/entities/assessment.entity.ts
%% table:asset_assignments path:src/hr/entities/asset-assignment.entity.ts
%% table:attendances path:src/hr/entities/attendance.entity.ts
%% table:candidates path:src/hr/entities/candidate.entity.ts
%% table:employee_reviews path:src/hr/entities/employee-review.entity.ts
%% table:employees path:src/hr/entities/employee.entity.ts
%% table:interviews path:src/hr/entities/interview.entity.ts
%% table:job_posts path:src/hr/entities/job-post.entity.ts
%% table:leave_entitlements path:src/hr/entities/leave-entitlement.entity.ts
%% table:leave_requests path:src/hr/entities/leave-request.entity.ts
%% table:payslips path:src/hr/entities/payslip.entity.ts
%% table:review_campaigns path:src/hr/entities/review-campaign.entity.ts
%% table:review_questions path:src/hr/entities/review-question.entity.ts
%% table:training_plans path:src/hr/entities/training-plan.entity.ts
%% table:work_shifts path:src/hr/entities/work-shift.entity.ts
%% table:automation_workflows path:src/marketing/entities/automation-workflow.entity.ts
%% table:customer_segments path:src/marketing/entities/customer-segment.entity.ts
%% table:marketing_campaigns path:src/marketing/entities/marketing-campaign.entity.ts
%% table:milestones path:src/projects/entities/milestone.entity.ts
%% table:projects path:src/projects/entities/project.entity.ts
%% table:portal_otps path:src/public/entities/portal-otp.entity.ts
%% table:portal_sessions path:src/public/entities/portal-session.entity.ts
%% table:website_policies path:src/public/entities/website-policy.entity.ts
%% table:wizard_config path:src/public/entities/wizard-config.entity.ts
%% table:social_channels path:src/social/entities/social-channel.entity.ts
%% table:social_orders path:src/social/entities/social-order.entity.ts
%% table:social_product_mappings path:src/social/entities/social-product-mapping.entity.ts
%% table:group_permissions path:src/users/entities/group-permission.entity.ts
%% table:user_groups path:src/users/entities/user-group.entity.ts
%% table:users path:src/users/entities/user.entity.ts
%% table:website_projects path:src/website-projects/entities/web-project.entity.ts
%% table:goods_issue_items path:src/inventory/entities/goods-issue-item.entity.ts
%% table:goods_issues path:src/inventory/entities/goods-issue.entity.ts
%% table:goods_receipt_items path:src/inventory/entities/goods-receipt-item.entity.ts
%% table:goods_receipts path:src/inventory/entities/goods-receipt.entity.ts
%% table:shipping_carriers path:src/inventory/entities/shipping-carrier.entity.ts
%% table:supplier_stocks path:src/inventory/entities/supplier-stock.entity.ts
%% table:supplier_transactions path:src/inventory/entities/supplier-transaction.entity.ts
%% table:inventory_sample_transaction_items path:src/inventory/samples/sample-transaction-item.entity.ts
%% table:inventory_sample_transactions path:src/inventory/samples/sample-transaction.entity.ts
%% table:outsourcing_assignments path:src/production/entities/outsourcing-assignment.entity.ts
%% table:production_orders path:src/production/entities/production-order.entity.ts
%% table:product_website_config path:src/products/entities/product-website-config.entity.ts
%% table:purchase_order_items path:src/purchasing/entities/purchase-order-item.entity.ts
%% table:purchase_orders path:src/purchasing/entities/purchase-order.entity.ts
%% table:price_list_rules path:src/sales/pricelist/price-list-rule.entity.ts
%% table:price_lists path:src/sales/pricelist/price-list.entity.ts
%% table:activity_logs path:src/system/entities/activity-log.entity.ts
%% table:api_tokens path:src/system/entities/api-token.entity.ts
  ai_feedbacks {
    number id PK
    string user_id
    string message_id
    _GOOD_____BAD_ rating
    text user_correction
    text original_question
    text original_answer
    string tool_used
    boolean resolved
    Date created_at
  }
  ai_learned_examples {
    number id PK
    text question_pattern
    string expected_tool
    json expected_args
    text example_answer
    _FEEDBACK_____MANUAL_ source
    number usage_count
    decimal effectiveness_score
    Date created_at
  }
  ai_messages {
    number id PK
    string user_id
    string role
    text content
    Date created_at
  }
  analytics_visitors {
    number id PK
    varchar session_id
    varchar ip_address
    varchar user_agent
    timestamp last_active
    varchar country
    Date created_at
  }
  announcement_reads {
    number id PK
    ManyToOne announcement FK
    number announcement_id
    ManyToOne user FK
    number user_id
    Date read_at
  }
  announcements {
    number id PK
    string title
    text content
    enum type
    enum priority
    boolean is_active
    boolean is_pinned
    simple_array target_departments
    timestamp start_date
    timestamp end_date
    ManyToOne creator FK
    number created_by
    Date created_at
    Date updated_at
  }
  blog_posts {
    number id PK
    string slug
    string title
    text excerpt
    text content
    jsonb content_blocks
    string featured_image
    string featured_image_alt
    string featured_image_title
    string category
    ManyToOne author FK
    number author_id
    enum status
    timestamp published_at
    string meta_title
    text meta_description
    jsonb tags
    string focus_keyword
    number seo_score
    jsonb seo_meta
    boolean is_hidden
    number view_count
    Date created_at
    Date updated_at
  }
  product_bom {
    number id PK
    ManyToOne product FK
    number product_id
    ManyToOne material FK
    number material_id
    decimal quantity
    decimal waste_percent
    string note
  }
  categories {
    number id PK
    string code
    string name
    decimal profit_margin
    Date created_at
    Date updated_at
  }
  customer_comments {
    number id PK
    ManyToOne customer FK
    number customer_id
    _STAFF_____CUSTOMER_ sender_type
    string sender_name
    text content
    _CUSTOMER_____INTERNAL_ comment_type
    simple_array mentioned_user_ids
    Date created_at
  }
  customer_contacts {
    number id PK
    string full_name
    string job_title
    string email
    string phone
    ManyToOne customer FK
  }
  customer_credits {
    number id PK
    ManyToOne customer FK
    number customer_id
    enum type
    decimal amount
    text note
    string reference_code
    Date created_at
  }
  customers {
    number id PK
    string code
    string name
    enum type
    string lead_status
    string lead_source
    decimal potential_value
    ManyToOne assigned_to FK
    number assigned_to_id
    ManyToOne parent FK
    number parent_id
    string legal_name
    string legal_address
    string legal_representative
    string einvoice_email
    jsonb delivery_addresses
    jsonb history
    jsonb bod_follow_up
    string tax_code
    string phone
    string email
    string facebook
    string website
    string address
    string province
    string district
    decimal credit_limit
    decimal current_debt
    decimal credit_balance
    Date created_at
    Date updated_at
  }
  transaction_categories {
    number id PK
    string name
    _INCOME_____EXPENSE_ type
    string color
    string description
  }
  transactions {
    number id PK
    date date
    _INCOME_____EXPENSE_ type
    decimal amount
    ManyToOne category FK
    number category_id
    string description
    simple_json attachments
    string partner_name
    number supplier_id
    string reference_code
    string reference_type
    number project_id
    number task_id
    string vat_invoice_code
    string vat_invoice_url
    boolean is_accounting
    string accounting_invoice_code
    string accounting_note
    jsonb allocations
    Date created_at
  }
  inventory_stocks {
    number id PK
    _PRODUCT_____MATERIAL_ item_type
    number item_id
    string warehouse_code
    decimal quantity
  }
  stock_history {
    number id PK
    _IMPORT_____EXPORT_ type
    _PRODUCT_____MATERIAL_ item_type
    number item_id
    string item_code
    string warehouse
    decimal quantity
    decimal balance_after
    string reference_code
    string note
    string updated_by
    Date created_at
  }
  materials {
    number id PK
    string code
    string name
    string category
    string material_type
    string unit
    string purchase_unit
    decimal conversion_factor
    decimal cost_per_unit
    decimal quantity_in_stock
    string supplier_name
    decimal cost_price
    decimal reserved_stock
    Date created_at
    Date updated_at
  }
  notifications {
    number id PK
    string title
    string message
    string type
    boolean is_read
    string link
    ManyToOne user FK
    number user_id
    Date created_at
  }
  pfo_material_requirements {
    number id PK
    ManyToOne pfo FK
    number pfo_id
    number material_id
    number product_id
    string material_code
    string material_name
    enum supply_method
    float planned_quantity
    float actual_order_quantity
    float issued_quantity
    float consumed_quantity
    float returned_quantity
    float scrap_quantity
    decimal unit_price
    number supplier_id
    boolean use_inventory
    float available_stock
    float inventory_used_quantity
    text note
    simple_json bom_details
  }
  pfo_milestones {
    number id PK
    ManyToOne pfo FK
    number pfo_id
    string milestone_type
    string step_name
    number product_id
    string product_name
    ManyToOne vendor FK
    number vendor_id
    string vendor_name
    decimal unit_price
    decimal total_cost
    date planned_date
    date actual_date
    varchar status
    float planned_quantity
    float completed_quantity
    float rejected_quantity
    text evidence_photo_url
    text note
    number updated_by_id
    Date created_at
    Date updated_at
  }
  pfo_qc_records {
    number id PK
    ManyToOne pfo FK
    number pfo_id
    enum qc_stage
    enum result
    float inspected_quantity
    float passed_quantity
    float rejected_quantity
    text inspector_note
    number inspector_id
    simple_json defects
    Date created_at
    Date updated_at
  }
  production_fulfillment_orders {
    number id PK
    string code
    ManyToOne sales_order FK
    number sales_order_id
    number vendor_id
    number product_id
    int quantity
    date planned_start_date
    date committed_finish_date
    enum status
    enum risk_status
    float progress
    Date created_at
    Date updated_at
  }
  processes {
    number id PK
    string code
    string name
    string unit
    decimal standard_cost
    string description
    Date created_at
    Date updated_at
  }
  work_order_steps {
    number id PK
    ManyToOne work_order FK
    string step_name
    int order_index
    string status
    string assigned_to
    number supplier_id
    date start_date
    date end_date
    date actual_start
    date actual_end
    string note
  }
  work_orders {
    number id PK
    string code
    string product_sku
    int quantity
    enum status
    ManyToOne production_order FK
    number production_order_id
    number pfo_id
    string note
    Date created_at
    Date updated_at
  }
  product_components {
    number id PK
    ManyToOne parent_product FK
    ManyToOne child_product FK
    decimal quantity
    number sort_order
  }
  product_logistics {
    number id PK
    ManyToOne product FK
    number product_id
    string name
    decimal cost
    string note
  }
  product_patterns {
    number id PK
    OneToOne product FK
    number product_id
    string image_url
    decimal fabric_width
    decimal fabric_yield
    jsonb details
    string note
  }
  product_routings {
    number id PK
    ManyToOne product FK
    number product_id
    ManyToOne process FK
    number process_id
    ManyToOne supplier FK
    number supplier_id
    string step_name
    decimal cost
    number step_order
    boolean is_required
  }
  products {
    number id PK
    string sku
    string name
    ManyToOne category_link FK
    number category_id
    string category
    string product_type
    jsonb attributes
    string unit
    decimal base_price
    decimal cost_price
    decimal profit_margin
    decimal quantity_in_stock
    decimal booking_stock
    decimal approved_booking_stock
    boolean is_active
    boolean is_flagged
    text customer_description
    text processing_description
    text vat_description
    jsonb tags
    text image_url
    boolean show_on_website
    boolean contact_for_price
    decimal website_price
    decimal website_sale_price
    number website_order
    text website_display_name
    jsonb seo_meta
    Date created_at
    Date updated_at
  }
  purchase_deliveries {
    number id PK
    ManyToOne purchase_order FK
    number po_id
    string receipt_code
    date delivery_date
    jsonb items
    Date created_at
  }
  qc_defect_items {
    number id PK
    ManyToOne inspection FK
    number inspection_id
    string defect_type
    enum severity
    int quantity
    text description
    text image_url
    text action_taken
  }
  quality_inspections {
    number id PK
    string code
    enum type
    enum status
    ManyToOne purchase_order FK
    number po_id
    ManyToOne supplier FK
    number supplier_id
    number pfo_id
    int total_quantity
    int inspected_quantity
    int passed_quantity
    int defect_quantity
    decimal defect_rate
    decimal supplier_score
    string inspector
    date inspection_date
    text note
    text corrective_action
    Date created_at
    Date updated_at
  }
  product_samples {
    number id PK
    string sample_code
    string product_name
    ManyToOne customer FK
    number customer_id
    enum status
    date request_date
    date deadline_date
    string feedback
    string image_url
    Date created_at
  }
  promotions {
    number id PK
    string name
    text description
    enum discount_type
    decimal discount_value
    date start_date
    date end_date
    boolean is_active
    jsonb applicable_customer_ids
    jsonb applicable_product_ids
    int min_quantity
    decimal min_order_value
    int max_uses
    int used_count
    Date created_at
    Date updated_at
  }
  sales_checklist_items {
    number id PK
    number checklist_id
    ManyToOne checklist FK
    string task_code
    string task_name
    string stage
    boolean is_completed
    timestamp completed_at
    string completed_by
    date due_date
    text note
    number sort_order
    Date created_at
  }
  sales_checklists {
    number id PK
    number order_id
    ManyToOne order FK
    Date created_at
  }
  sales_comments {
    number id PK
    ManyToOne order FK
    _STAFF_____CUSTOMER_ sender_type
    string sender_name
    text content
    boolean is_visible
    _CUSTOMER_____INTERNAL_ comment_type
    simple_array mentioned_user_ids
    Date created_at
    timestamp deleted_at
    string deleted_by
  }
  sales_delivery_items {
    number id PK
    ManyToOne delivery FK
    string sku
    int quantity
  }
  sales_deliveries {
    number id PK
    string code
    ManyToOne sales_order FK
    number order_id
    date delivery_date
    string note
    simple_json attachments
    string status
    boolean email_sent
    string delivery_address
    string contact_name
    string contact_phone
    string shipping_carrier
    string tracking_code
    decimal shipping_cost
    Date created_at
  }
  sales_order_items {
    number id PK
    number position
    ManyToOne order FK
    string sku
    ManyToOne product FK
    text image_url
    decimal quantity
    decimal unit_price
    decimal subtotal
    decimal total_price
    decimal booked_quantity
    enum booking_status
    timestamp booking_expires_at
    string variant_color
    boolean is_sample_approved
    text sample_image
    string sample_note
    text vat_content
    json price_ranges
  }
  sales_order_versions {
    number id PK
    ManyToOne order FK
    number order_id
    number version_number
    simple_json data_snapshot
    Date created_at
    string created_by
  }
  sales_orders {
    number id PK
    string uuid
    string order_code
    int version
    ManyToOne customer FK
    number customer_id
    string customer_name
    string vat_company_name
    string vat_tax_code
    string vat_address
    int vat_rate
    string vat_invoice_link
    string vat_email
    date delivery_date
    string shipping_address
    string receiver_name
    string receiver_phone
    string contact_name
    string contact_phone
    string shipping_carrier
    string tracking_code
    decimal shipping_fee
    string order_source
    text note
    text cancel_reason
    ManyToOne assigned_to FK
    number assigned_to_id
    float discount_rate
    decimal discount_amount
    float deposit_percent
    decimal deposit_amount
    text payment_note
    decimal paid_amount
    enum payment_status
    text sample_image_url
    text sample_note
    boolean is_production_sample_approved
    simple_array approved_sample_images
    text terms_content
    boolean require_invoice
    text contract_html
    jsonb contract_variables
    number contract_template_id
    string contract_status
    jsonb bod_follow_up
    enum status
    decimal total_amount
    decimal total_cost
    Date order_date
    Date updated_at
    jsonb portal_view_logs
  }
  sales_targets {
    number id PK
    ManyToOne user FK
    number user_id
    number year
    number month
    decimal target_revenue
    number target_leads
    number target_activities
    Date created_at
    Date updated_at
  }
  supplier_contacts {
    number id PK
    string full_name
    string job_title
    string phone_number
    string email
    ManyToOne supplier FK
  }
  supplier_materials {
    number id PK
    ManyToOne supplier FK
    number supplier_id
    ManyToOne material FK
    number material_id
    ManyToOne process FK
    number process_id
    ManyToOne product FK
    number product_id
    decimal price
    string currency
    boolean is_preferred
    date valid_from
    date valid_to
    Date updated_at
  }
  suppliers {
    number id PK
    string code
    string name
    decimal debt
    enum type
    string tax_code
    string legal_name
    string vat_address
    string phone
    string email
    string address
    text note
    text po_template
    Date created_at
    Date updated_at
  }
  contract_templates {
    number id PK
    string name
    text content
    boolean is_active
    Date created_at
    Date updated_at
  }
  email_templates {
    number id PK
    string name
    string subject
    text content
    boolean is_active
    Date created_at
    Date updated_at
  }
  system_configs {
    string key PK
    text value
    text description
  }
  task_time_logs {
    number id PK
    ManyToOne task FK
    number task_id
    ManyToOne user FK
    number user_id
    timestamp start_time
    timestamp end_time
    int duration_seconds
    string description
    Date created_at
  }
  tasks {
    number id PK
    string title
    text description
    enum status
    enum priority
    timestamp start_date
    timestamp due_date
    boolean is_reminded
    string reference_code
    string reference_type
    ManyToOne project FK
    number project_id
    ManyToOne milestone FK
    number milestone_id
    float estimated_hours
    decimal estimated_cost
    decimal actual_cost
    text cost_note
    string department
    ManyToOne assignee FK
    number assignee_id
    ManyToOne creator FK
    number creator_id
    Date created_at
    Date updated_at
  }
  customer_logos {
    number id PK
    ManyToOne customer FK
    number customer_id
    string name
    text image_url
    string dimensions
    simple_array colors
    text note
    enum status
    Date created_at
    Date updated_at
  }
  print_designs {
    number id PK
    string code
    string name
    enum type
    ManyToOne customer FK
    number customer_id
    ManyToOne product FK
    number product_id
    text layout_image_url
    jsonb tech_pack
    enum status
    Date created_at
    Date updated_at
  }
  print_samples {
    number id PK
    ManyToOne print_design FK
    number print_design_id
    ManyToOne po FK
    number po_id
    ManyToOne supplier FK
    number supplier_id
    date sample_date
    text result_image_url
    enum status
    text feedback_notes
    Date created_at
    Date updated_at
  }
  discussion_comments {
    number id PK
    text content
    ManyToOne discussion FK
    number discussion_id
    ManyToOne user FK
    number user_id
    Date created_at
  }
  discussions {
    number id PK
    string title
    text content
    ManyToOne group FK
    number group_id
    ManyToOne creator FK
    number creator_id
    number views_count
    boolean is_reviewed
    boolean is_pinned
    string type
    boolean is_active
    Date created_at
    Date updated_at
  }
  assessments {
    number id PK
    ManyToOne candidate FK
    number candidate_id
    jsonb questions_json
    jsonb answers_json
    jsonb ai_feedback
    enum status
    timestamp submitted_at
    Date created_at
  }
  asset_assignments {
    number id PK
    ManyToOne employee FK
    number employee_id
    string asset_name
    string asset_code
    string serial_number
    date assigned_date
    date returned_date
    enum condition
    text note
    Date created_at
    Date updated_at
  }
  attendances {
    number id PK
    ManyToOne employee FK
    number employee_id
    date date
    timestamp check_in
    timestamp check_out
    decimal work_hours
    enum status
    string note
    Date created_at
  }
  candidates {
    number id PK
    string name
    string email
    string phone
    string cv_url
    string portal_token
    ManyToOne job_post FK
    number job_post_id
    decimal overall_score
    enum status
    enum source
    jsonb extra_info
    Date applied_at
    Date updated_at
  }
  employee_reviews {
    number id PK
    number campaign_id
    ManyToOne campaign FK
    number reviewer_id
    ManyToOne reviewer FK
    number reviewee_id
    ManyToOne reviewee FK
    jsonb questions_json
    jsonb answers_json
    text ai_feedback
    enum status
    Date created_at
    timestamp submitted_at
    Date updated_at
  }
  employees {
    number id PK
    OneToOne user FK
    number user_id
    string full_name
    enum gender
    date date_of_birth
    string phone
    string address
    string department
    string position
    date hire_date
    decimal base_salary
    ManyToOne work_shift FK
    number work_shift_id
    text note
    boolean is_active
    Date created_at
    Date updated_at
  }
  interviews {
    number id PK
    ManyToOne candidate FK
    number candidate_id
    timestamp scheduled_at
    string location
    string meeting_link
    string hr_interviewer
    enum result_status
    text notes
    Date created_at
    Date updated_at
  }
  job_posts {
    number id PK
    string title
    string slug
    string department
    string location
    text description
    jsonb requirements_json
    string salary_range
    enum job_type
    enum status
    jsonb assessment_template
    boolean show_on_website
    timestamp expires_at
    Date created_at
    Date updated_at
  }
  leave_entitlements {
    number id PK
    ManyToOne employee FK
    number employee_id
    int year
    decimal annual_days
    decimal carried_days
    Date created_at
    Date updated_at
  }
  leave_requests {
    number id PK
    ManyToOne employee FK
    number employee_id
    enum leave_type
    date start_date
    date end_date
    decimal days
    text reason
    enum status
    ManyToOne approved_by FK
    number approved_by_id
    timestamp approved_at
    string reject_reason
    Date created_at
    Date updated_at
  }
  payslips {
    number id PK
    ManyToOne employee FK
    number employee_id
    number month
    number year
    decimal base_salary
    decimal standard_work_days
    decimal actual_work_days
    decimal actual_salary
    decimal allowance_meal
    decimal allowance_transport
    decimal allowance_phone
    decimal bonus
    decimal gross_income
    decimal bhxh_company
    decimal bhyt_company
    decimal bhtn_company
    decimal bhxh_employee
    decimal bhyt_employee
    decimal bhtn_employee
    decimal union_fee
    decimal tax_income
    decimal other_deductions
    decimal net_salary
    boolean include_insurance
    text note
    boolean is_paid
    timestamp paid_date
    Date created_at
    Date updated_at
  }
  review_campaigns {
    number id PK
    string title
    timestamp start_date
    timestamp end_date
    jsonb config_json
    enum status
    Date created_at
    Date updated_at
  }
  review_questions {
    number id PK
    text content
    string category
    enum type
    Date created_at
    Date updated_at
  }
  training_plans {
    number id PK
    ManyToOne employee FK
    number employee_id
    string title
    text description
    date start_date
    date target_date
    enum status
    simple_array skills
    json milestones
    int progress
    text note
    Date created_at
    Date updated_at
  }
  work_shifts {
    number id PK
    string name
    string code
    time start_time
    time end_time
    time break_start
    time break_end
    decimal work_hours
    enum calc_type
    int late_tolerance_minutes
    int work_days_per_week
    boolean is_active
    text note
    Date created_at
    Date updated_at
  }
  automation_workflows {
    number id PK
    string name
    text description
    enum status
    enum trigger_type
    jsonb trigger_config
    jsonb steps
    jsonb stats
    int total_runs
    Date last_run_at
    Date created_at
    Date updated_at
  }
  customer_segments {
    number id PK
    string name
    text description
    enum type
    jsonb criteria
    jsonb customer_ids
    int customer_count
    Date last_calculated_at
    boolean is_active
    jsonb metadata
    Date created_at
    Date updated_at
  }
  marketing_campaigns {
    number id PK
    string name
    text description
    enum type
    enum status
    number segment_id
    jsonb content
    timestamp scheduled_at
    timestamp started_at
    timestamp completed_at
    int target_count
    jsonb metrics
    decimal budget
    decimal spent
    ManyToOne created_by FK
    number created_by_id
    jsonb settings
    Date created_at
    Date updated_at
  }
  milestones {
    number id PK
    string title
    text description
    timestamp start_date
    timestamp due_date
    string status
    string department
    int sort_order
    ManyToOne owner FK
    number owner_id
    boolean is_active
    ManyToOne project FK
    number project_id
    Date created_at
  }
  projects {
    number id PK
    string title
    text description
    enum status
    enum project_type
    ManyToOne sales_order FK
    number sales_order_id
    decimal budget
    timestamp start_date
    timestamp end_date
    ManyToOne manager FK
    number manager_id
    ManyToOne created_by FK
    number created_by_id
    Date created_at
    Date updated_at
  }
  portal_otps {
    number id PK
    string email
    string otp_code
    number customer_id
    boolean is_used
    timestamp expires_at
    Date created_at
  }
  portal_sessions {
    number id PK
    number customer_id
    string token
    string slug
    timestamp expires_at
    Date created_at
  }
  website_policies {
    string slug PK
    string title
    text content
    boolean is_active
    number display_order
    string icon
    Date created_at
    Date updated_at
  }
  wizard_config {
    string key PK
    jsonb value
    Date created_at
    Date updated_at
  }
  social_channels {
    number id PK
    enum platform
    string shop_name
    string shop_id
    string merchant_id
    text access_token
    text refresh_token
    timestamp token_expires_at
    enum status
    jsonb settings
    jsonb metadata
    Date last_sync_at
    string last_error
    Date created_at
    Date updated_at
  }
  social_orders {
    number id PK
    ManyToOne channel FK
    number channel_id
    enum platform
    string platform_order_id
    string platform_order_code
    ManyToOne sales_order FK
    number sales_order_id
    string platform_status
    enum sync_status
    string buyer_name
    string buyer_phone
    string buyer_email
    text shipping_address
    decimal total_amount
    decimal shipping_fee
    decimal platform_discount
    string currency
    jsonb raw_data
    jsonb items
    Date synced_at
    text sync_error
    Date created_at
    Date updated_at
  }
  social_product_mappings {
    number id PK
    ManyToOne channel FK
    number channel_id
    enum platform
    ManyToOne product FK
    number product_id
    string platform_product_id
    string platform_sku
    string platform_name
    enum status
    decimal platform_price
    int platform_stock
    jsonb platform_data
    Date last_sync_at
    text last_error
    Date created_at
    Date updated_at
  }
  group_permissions {
    number id PK
    string module_code
    boolean can_view
    boolean can_create
    boolean can_update
    boolean can_delete
    boolean view_cost_price
    ManyToOne group FK
    number group_id
  }
  user_groups {
    number id PK
    string name
    string description
  }
  users {
    number id PK
    string username
    string password
    string full_name
    string email
    boolean is_active
    ManyToOne group FK
    number group_id
    timestamp last_activity_at
    string ip_address
    string device_info
    Date created_at
    Date updated_at
  }
  website_projects {
    number id PK
    string slug
    string title
    string school_name
    text description
    text content
    jsonb content_blocks
    string image_url
    enum status
    int sort_order
    string meta_title
    text meta_description
    string focus_keyword
    int seo_score
    json seo_meta
    boolean is_hidden
    int view_count
    Date created_at
    Date updated_at
    timestamp published_at
  }
  goods_issue_items {
    number id PK
    ManyToOne issue FK
    number issue_id
    ManyToOne material FK
    number material_id
    number product_id
    ManyToOne supplier FK
    number supplier_id
    decimal quantity
    string material_category
    string note
  }
  goods_issues {
    number id PK
    string code
    enum type
    enum delivery_mode
    enum status
    ManyToOne purchase_order FK
    number po_id
    ManyToOne supplier FK
    number supplier_id
    number pfo_id
    date issue_date
    string vehicle
    string note
    Date created_at
    Date updated_at
  }
  goods_receipt_items {
    number id PK
    ManyToOne receipt FK
    number receipt_id
    ManyToOne material FK
    number material_id
    ManyToOne product FK
    number product_id
    ManyToOne po_item FK
    number po_item_id
    decimal quantity
    simple_json packing_data
  }
  goods_receipts {
    number id PK
    string code
    ManyToOne purchase_order FK
    number po_id
    enum status
    date delivery_date
    date actual_receive_date
    decimal shipping_fee
    string delivery_note_url
    string note
    Date created_at
    Date updated_at
  }
  shipping_carriers {
    number id PK
    string code
    string name
    string phone
    string website
    string tracking_url
    boolean is_active
    Date created_at
    Date updated_at
  }
  supplier_stocks {
    number id PK
    ManyToOne supplier FK
    number supplier_id
    ManyToOne material FK
    number material_id
    decimal quantity
    Date created_at
    Date updated_at
  }
  supplier_transactions {
    number id PK
    ManyToOne supplier FK
    number supplier_id
    ManyToOne material FK
    number material_id
    enum type
    decimal quantity
    decimal balance_after
    string reference_code
    string note
    Date created_at
  }
  inventory_sample_transaction_items {
    number id PK
    ManyToOne transaction FK
    number transaction_id
    ManyToOne product FK
    number product_id
    decimal quantity
    string note
  }
  inventory_sample_transactions {
    number id PK
    string code
    enum type
    enum status
    string reference_type
    number reference_id
    ManyToOne customer FK
    number customer_id
    decimal deposit_amount
    string note
    string created_by
    Date created_at
    Date updated_at
  }
  outsourcing_assignments {
    number id PK
    string code
    ManyToOne production_order FK
    number production_order_id
    ManyToOne step FK
    number step_id
    ManyToOne supplier FK
    number supplier_id
    number pfo_id
    int assigned_quantity
    int completed_quantity
    int defect_quantity
    decimal unit_price
    enum status
    date deadline
    date actual_completion_date
    text note
    Date created_at
    Date updated_at
  }
  production_orders {
    number id PK
    string code
    ManyToOne product FK
    number product_id
    ManyToOne pfo FK
    number pfo_id
    string sales_order_code
    number assigned_supplier_id
    decimal quantity
    date start_date
    date due_date
    string status
    Date created_at
    Date updated_at
  }
  product_website_config {
    number product_id PK
    OneToOne product FK
    jsonb customization_config
  }
  purchase_order_items {
    number id PK
    ManyToOne purchase_order FK
    number pfo_id
    ManyToOne material FK
    number material_id
    ManyToOne product FK
    number product_id
    string description
    decimal quantity
    decimal unit_price
    decimal subtotal
    string note
    decimal raw_quantity
    decimal wastage_rate
    decimal total_quantity
    ManyToOne print_design FK
    number print_design_id
    string front_color
    string back_color
  }
  purchase_orders {
    number id PK
    string po_code
    string uuid
    enum status
    enum type
    ManyToOne supplier FK
    number supplier_id
    ManyToOne pfo FK
    number pfo_id
    number project_id
    number task_id
    decimal total_amount
    decimal paid_amount
    string note
    decimal vat_rate
    jsonb outsourcing_delivery_info
    jsonb delivery_info
    jsonb packing_list_details
    number parent_po_id
    ManyToOne parent_po FK
    Date created_at
    Date updated_at
  }
  price_list_rules {
    number id PK
    ManyToOne price_list FK
    number price_list_id
    string product_sku
    decimal min_price
    decimal max_price
    decimal min_margin
    decimal max_margin
    decimal price_100
    decimal price_50
    decimal price_30
  }
  price_lists {
    number id PK
    string name
    string description
    number group_id
    date valid_from
    date valid_to
    boolean is_active
    Date created_at
    Date updated_at
  }
  activity_logs {
    number id PK
    number user_id
    string username
    string full_name
    string action
    string module
    string entity_id
    text description
    jsonb details
    jsonb metadata
    Date timestamp
  }
  api_tokens {
    number id PK
    string name
    string token_hash
    string token_hint
    jsonb permissions
    timestamp last_used_at
    timestamp expires_at
    boolean is_active
    Date created_at
    Date updated_at
  }
  announcements {
    string name
  }
  announcements__id {
    string name
  }
  announcements_user_active {
    string name
  }
  announcements_user_unread {
    string name
  }
  announcements_user_unread_count {
    string name
  }
  announcements__id_read {
    string name
  }
  announcements_user_read_all {
    string name
  }
  AnnouncementsController {
    string name
  }
  AnnouncementsModule {
    string name
  }
  AnnouncementsService {
    string name
  }
  categories {
    string name
  }
  categories__id {
    string name
  }
  CategoriesController {
    string name
  }
  CategoriesModule {
    string name
  }
  CategoriesService {
    string name
  }
  customers {
    string name
  }
  customers__id {
    string name
  }
  customers__id_impersonate {
    string name
  }
  customers__id_follow {
    string name
  }
  customers__id_orders {
    string name
  }
  customers__id_bod_follow_up {
    string name
  }
  customers__id_comments {
    string name
  }
  customers__id_comment {
    string name
  }
  customers__id_credits {
    string name
  }
  CustomersController {
    string name
  }
  CustomersModule {
    string name
  }
  CustomersService {
    string name
  }
  materials {
    string name
  }
  materials__id {
    string name
  }
  MaterialsController {
    string name
  }
  MaterialsModule {
    string name
  }
  MaterialsService {
    string name
  }
  notifications {
    string name
  }
  notifications__id_read {
    string name
  }
  notifications_read_all {
    string name
  }
  NotificationsController {
    string name
  }
  NotificationsModule {
    string name
  }
  NotificationsService {
    string name
  }
  processes {
    string name
  }
  processes__id {
    string name
  }
  processes_seed {
    string name
  }
  ProcessesController {
    string name
  }
  ProcessesModule {
    string name
  }
  ProcessesService {
    string name
  }
  products {
    string name
  }
  products__id {
    string name
  }
  products_create_variant {
    string name
  }
  products__id_routings {
    string name
  }
  products__id_logistics {
    string name
  }
  products__id_pattern {
    string name
  }
  products__id_website_config {
    string name
  }
  products__sku_boms {
    string name
  }
  products__id_boms {
    string name
  }
  products__id_sync_variants {
    string name
  }
  products_combo__sku {
    string name
  }
  products_combo_add {
    string name
  }
  products_combo_item__id {
    string name
  }
  products__id_components {
    string name
  }
  products_copy_bom {
    string name
  }
  products_copy_routings {
    string name
  }
  products_copy_logistics {
    string name
  }
  products_calculate_cost__sku {
    string name
  }
  products_calculate_all_costs {
    string name
  }
  ProductsController {
    string name
  }
  ProductsModule {
    string name
  }
  ProductsService {
    string name
  }
  suppliers {
    string name
  }
  suppliers__id {
    string name
  }
  suppliers__id_transactions {
    string name
  }
  suppliers__id_material_price {
    string name
  }
  suppliers_material_price__id {
    string name
  }
  suppliers_price {
    string name
  }
  suppliers_check_price {
    string name
  }
  SuppliersController {
    string name
  }
  SuppliersModule {
    string name
  }
  SuppliersService {
    string name
  }
  tasks {
    string name
  }
  tasks__id {
    string name
  }
  tasks__id_start_timer {
    string name
  }
  tasks__id_stop_timer {
    string name
  }
  tasks__id_logs {
    string name
  }
  TasksController {
    string name
  }
  TasksModule {
    string name
  }
  TasksService {
    string name
  }
  discussions {
    string name
  }
  discussions__id {
    string name
  }
  discussions__id_comments {
    string name
  }
  discussions_comments__commentId {
    string name
  }
  discussions__id_review {
    string name
  }
  DiscussionsController {
    string name
  }
  DiscussionsModule {
    string name
  }
  DiscussionsService {
    string name
  }
  projects {
    string name
  }
  projects__id {
    string name
  }
  projects_from_so__soId {
    string name
  }
  projects__id_cost_summary {
    string name
  }
  projects__id_milestones {
    string name
  }
  projects_milestones__milestoneId {
    string name
  }
  website_projects {
    string name
  }
  website_projects__id {
    string name
  }
  ProjectsController {
    string name
  }
  WebsiteProjectsController {
    string name
  }
  ProjectsModule {
    string name
  }
  WebsiteProjectsModule {
    string name
  }
  ProjectsService {
    string name
  }
  WebsiteProjectsService {
    string name
  }
  users {
    string name
  }
  users_online {
    string name
  }
  users__id {
    string name
  }
  users__id_change_password {
    string name
  }
  users_groups {
    string name
  }
  users_groups__id {
    string name
  }
  users_groups__id_permissions {
    string name
  }
  users_groups__id_update {
    string name
  }
  UsersController {
    string name
  }
  UsersModule {
    string name
  }
  UsersService {
    string name
  }
  announcements }|--|| announcements : "queries"
  announcements__id }|--|| announcements : "queries"
  announcements }|--|| announcements : "queries"
  announcements__id }|--|| announcements : "queries"
  announcements__id }|--|| announcements : "queries"
  announcements_user_active }|--|| announcements : "queries"
  announcements_user_unread }|--|| announcements : "queries"
  announcements_user_unread_count }|--|| announcements : "queries"
  announcements__id_read }|--|| announcements : "queries"
  announcements_user_read_all }|--|| announcements : "queries"
  AnnouncementsController }|--|| announcements : "queries"
  AnnouncementsModule }|--|| announcements : "queries"
  AnnouncementsService }|--|| announcements : "queries"
  categories }|--|| categories : "queries"
  categories }|--|| categories : "queries"
  categories__id }|--|| categories : "queries"
  categories__id }|--|| categories : "queries"
  CategoriesController }|--|| categories : "queries"
  CategoriesModule }|--|| categories : "queries"
  CategoriesService }|--|| categories : "queries"
  customers }|--|| customers : "queries"
  customers }|--|| customers : "queries"
  customers__id }|--|| customers : "queries"
  customers__id }|--|| customers : "queries"
  customers__id }|--|| customers : "queries"
  customers__id_impersonate }|--|| customers : "queries"
  customers__id_follow }|--|| customers : "queries"
  customers__id_orders }|--|| customers : "queries"
  customers__id_bod_follow_up }|--|| customers : "queries"
  customers__id_comments }|--|| customers : "queries"
  customers__id_comment }|--|| customers : "queries"
  customers__id_credits }|--|| customers : "queries"
  customers__id_credits }|--|| customers : "queries"
  CustomersController }|--|| customers : "queries"
  CustomersModule }|--|| customers : "queries"
  CustomersService }|--|| customers : "queries"
  materials }|--|| materials : "queries"
  materials }|--|| materials : "queries"
  materials__id }|--|| materials : "queries"
  materials__id }|--|| materials : "queries"
  MaterialsController }|--|| materials : "queries"
  MaterialsModule }|--|| materials : "queries"
  MaterialsService }|--|| materials : "queries"
  notifications }|--|| notifications : "queries"
  notifications__id_read }|--|| notifications : "queries"
  notifications_read_all }|--|| notifications : "queries"
  NotificationsController }|--|| notifications : "queries"
  NotificationsModule }|--|| notifications : "queries"
  NotificationsService }|--|| notifications : "queries"
  processes }|--|| processes : "queries"
  processes }|--|| processes : "queries"
  processes__id }|--|| processes : "queries"
  processes__id }|--|| processes : "queries"
  processes_seed }|--|| processes : "queries"
  ProcessesController }|--|| processes : "queries"
  ProcessesModule }|--|| processes : "queries"
  ProcessesService }|--|| processes : "queries"
  products }|--|| products : "queries"
  products__id }|--|| products : "queries"
  products }|--|| products : "queries"
  products__id }|--|| products : "queries"
  products__id }|--|| products : "queries"
  products_create_variant }|--|| products : "queries"
  products__id_routings }|--|| products : "queries"
  products__id_routings }|--|| products : "queries"
  products__id_logistics }|--|| products : "queries"
  products__id_logistics }|--|| products : "queries"
  products__id_pattern }|--|| products : "queries"
  products__id_pattern }|--|| products : "queries"
  products__id_website_config }|--|| products : "queries"
  products__id_website_config }|--|| products : "queries"
  products__sku_boms }|--|| products : "queries"
  products__id_boms }|--|| products : "queries"
  products__id_sync_variants }|--|| products : "queries"
  products_combo__sku }|--|| products : "queries"
  products_combo_add }|--|| products : "queries"
  products_combo_item__id }|--|| products : "queries"
  products__id_components }|--|| products : "queries"
  products_copy_bom }|--|| products : "queries"
  products_copy_routings }|--|| products : "queries"
  products_copy_logistics }|--|| products : "queries"
  products_calculate_cost__sku }|--|| products : "queries"
  products_calculate_all_costs }|--|| products : "queries"
  ProductsController }|--|| products : "queries"
  ProductsModule }|--|| products : "queries"
  ProductsService }|--|| products : "queries"
  suppliers }|--|| suppliers : "queries"
  suppliers }|--|| suppliers : "queries"
  suppliers__id }|--|| suppliers : "queries"
  suppliers__id_transactions }|--|| suppliers : "queries"
  suppliers__id }|--|| suppliers : "queries"
  suppliers__id }|--|| suppliers : "queries"
  suppliers__id_material_price }|--|| suppliers : "queries"
  suppliers_material_price__id }|--|| suppliers : "queries"
  suppliers_price }|--|| suppliers : "queries"
  suppliers_check_price }|--|| suppliers : "queries"
  SuppliersController }|--|| suppliers : "queries"
  SuppliersModule }|--|| suppliers : "queries"
  SuppliersService }|--|| suppliers : "queries"
  tasks }|--|| tasks : "queries"
  tasks }|--|| tasks : "queries"
  tasks__id }|--|| tasks : "queries"
  tasks__id }|--|| tasks : "queries"
  tasks__id_start_timer }|--|| tasks : "queries"
  tasks__id_stop_timer }|--|| tasks : "queries"
  tasks__id_logs }|--|| tasks : "queries"
  TasksController }|--|| tasks : "queries"
  TasksModule }|--|| tasks : "queries"
  TasksService }|--|| tasks : "queries"
  discussions }|--|| discussions : "queries"
  discussions__id }|--|| discussions : "queries"
  discussions }|--|| discussions : "queries"
  discussions__id }|--|| discussions : "queries"
  discussions__id }|--|| discussions : "queries"
  discussions__id_comments }|--|| discussions : "queries"
  discussions_comments__commentId }|--|| discussions : "queries"
  discussions__id_review }|--|| discussions : "queries"
  DiscussionsController }|--|| discussions : "queries"
  DiscussionsModule }|--|| discussions : "queries"
  DiscussionsService }|--|| discussions : "queries"
  projects }|--|| projects : "queries"
  projects__id }|--|| projects : "queries"
  projects }|--|| projects : "queries"
  projects__id }|--|| projects : "queries"
  projects__id }|--|| projects : "queries"
  projects_from_so__soId }|--|| projects : "queries"
  projects__id_cost_summary }|--|| projects : "queries"
  projects__id_milestones }|--|| projects : "queries"
  projects_milestones__milestoneId }|--|| projects : "queries"
  projects_milestones__milestoneId }|--|| projects : "queries"
  website_projects }|--|| projects : "queries"
  website_projects__id }|--|| projects : "queries"
  website_projects }|--|| projects : "queries"
  website_projects__id }|--|| projects : "queries"
  website_projects__id }|--|| projects : "queries"
  ProjectsController }|--|| projects : "queries"
  WebsiteProjectsController }|--|| projects : "queries"
  ProjectsModule }|--|| projects : "queries"
  WebsiteProjectsModule }|--|| projects : "queries"
  ProjectsService }|--|| projects : "queries"
  WebsiteProjectsService }|--|| projects : "queries"
  users }|--|| users : "queries"
  users_online }|--|| users : "queries"
  users }|--|| users : "queries"
  users__id }|--|| users : "queries"
  users__id }|--|| users : "queries"
  users__id_change_password }|--|| users : "queries"
  users_groups }|--|| users : "queries"
  users_groups__id }|--|| users : "queries"
  users_groups }|--|| users : "queries"
  users_groups__id_permissions }|--|| users : "queries"
  users_groups__id_update }|--|| users : "queries"
  UsersController }|--|| users : "queries"
  UsersModule }|--|| users : "queries"
  UsersService }|--|| users : "queries"
```
