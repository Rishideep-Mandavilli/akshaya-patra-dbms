import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE
from pptx.dml.color import RGBColor

def create_presentation(output_path='Akshaya_Patra_DBMS_Presentation.pptx'):
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Color definitions
    COLOR_BG = RGBColor(248, 250, 252)         # #F8FAFC (Slate 50)
    COLOR_CARD = RGBColor(255, 255, 255)       # #FFFFFF
    COLOR_BORDER = RGBColor(226, 232, 240)     # #E2E8F0 (Slate 200)
    COLOR_PRIMARY = RGBColor(15, 23, 42)       # #0F172A (Slate 900)
    COLOR_SECONDARY = RGBColor(51, 65, 85)     # #334155 (Slate 700)
    COLOR_MUTED = RGBColor(100, 116, 139)      # #64748B (Slate 500)
    COLOR_SAFFRON = RGBColor(217, 119, 6)      # #D97706 (Amber 600)
    COLOR_EMERALD = RGBColor(5, 150, 105)      # #059669 (Emerald 600)
    COLOR_CODE_BG = RGBColor(15, 23, 42)       # #0F172A (Slate 900)
    COLOR_CODE_TXT = RGBColor(52, 211, 153)    # #34D399 (Emerald 400)

    def set_slide_background(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = COLOR_BG
        bg.line.fill.background() # No line
        return bg

    def add_header(slide, title_text, category_text="DBMS ACADEMIC CAPSTONE PROJECT"):
        # Header Badge
        badge_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.3))
        tf_badge = badge_box.text_frame
        tf_badge.word_wrap = True
        p_badge = tf_badge.paragraphs[0]
        p_badge.text = category_text.upper()
        p_badge.font.size = Pt(9.5)
        p_badge.font.bold = True
        p_badge.font.color.rgb = COLOR_SAFFRON

        # Main Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.65), Inches(11.7), Inches(0.6))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.size = Pt(22)
        p_title.font.bold = True
        p_title.font.color.rgb = COLOR_PRIMARY

        # Divider line
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.35), Inches(11.733), Inches(0.02))
        line.fill.solid()
        line.fill.fore_color.rgb = COLOR_BORDER
        line.line.fill.background()

    def add_card(slide, left, top, width, height, title="", border_color=COLOR_BORDER, bg_color=COLOR_CARD):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        card.line.color.rgb = border_color
        card.line.width = Pt(1.2)
        
        if title:
            # Title header inside card
            tbox = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.15), width - Inches(0.4), Inches(0.4))
            tf = tbox.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            p.text = title
            p.font.size = Pt(13)
            p.font.bold = True
            p.font.color.rgb = COLOR_PRIMARY
        return card

    # =========================================================================
    # SLIDE 1: Title Slide (with blank spaces for student/team details)
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1)

    # Accent Top Banner
    top_bar = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(0.15))
    top_bar.fill.solid()
    top_bar.fill.fore_color.rgb = COLOR_SAFFRON
    top_bar.line.fill.background()

    # Title Box
    tbox = s1.shapes.add_textbox(Inches(0.8), Inches(1.0), Inches(11.7), Inches(2.2))
    tf = tbox.text_frame
    tf.word_wrap = True

    p0 = tf.paragraphs[0]
    p0.text = "BCNF-NORMALIZED FOOD DISTRIBUTION MANAGEMENT SYSTEM"
    p0.font.size = Pt(28)
    p0.font.bold = True
    p0.font.color.rgb = COLOR_PRIMARY

    p1 = tf.add_paragraph()
    p1.text = "Akshaya Patra Mega-Kitchen & School Logistics Database Architecture"
    p1.font.size = Pt(16)
    p1.font.color.rgb = COLOR_SAFFRON
    p1.font.bold = True
    p1.space_before = Pt(8)

    p2 = tf.add_paragraph()
    p2.text = "Course: Database Management Systems (DBMS)"
    p2.font.size = Pt(13)
    p2.font.color.rgb = COLOR_MUTED
    p2.space_before = Pt(6)

    # Team & Submission Details Card (with blank placeholder lines as requested)
    card1 = add_card(s1, Inches(0.8), Inches(3.3), Inches(11.733), Inches(3.6), "PROJECT & TEAM INFORMATION")
    
    t_info = s1.shapes.add_textbox(Inches(1.1), Inches(3.85), Inches(11.1), Inches(2.8))
    tf_info = t_info.text_frame
    tf_info.word_wrap = True

    p_team = tf_info.paragraphs[0]
    p_team.text = "Team Name :  ____________________________________________________"
    p_team.font.size = Pt(13)
    p_team.font.bold = True
    p_team.font.color.rgb = COLOR_PRIMARY

    members = [
        ("Member 1 : _____________________________________", "Roll No : ________________________"),
        ("Member 2 : _____________________________________", "Roll No : ________________________"),
        ("Member 3 : _____________________________________", "Roll No : ________________________"),
        ("Member 4 : _____________________________________", "Roll No : ________________________"),
        ("Member 5 : _____________________________________", "Roll No : ________________________"),
        ("Member 6 : _____________________________________", "Roll No : ________________________"),
    ]

    for m_name, m_roll in members:
        p_m = tf_info.add_paragraph()
        p_m.text = f"{m_name}     |     {m_roll}"
        p_m.font.size = Pt(11.5)
        p_m.font.color.rgb = COLOR_SECONDARY
        p_m.space_before = Pt(6)

    # =========================================================================
    # SLIDE 2: Problem & Objective
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2)
    add_header(s2, "Problem & Objective")

    # Left Card: Problem Statement
    add_card(s2, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.3), "PROBLEM STATEMENT")
    pbox = s2.shapes.add_textbox(Inches(1.0), Inches(2.2), Inches(5.3), Inches(4.5))
    tf_p = pbox.text_frame
    tf_p.word_wrap = True

    p_desc = tf_p.paragraphs[0]
    p_desc.text = "Centralized mega-kitchens (cooking 20,000–100,000+ meals daily) face acute supply chain and database anomalies:"
    p_desc.font.size = Pt(12)
    p_desc.font.color.rgb = COLOR_SECONDARY

    problems = [
        "Inventory Stockouts & Spoilage: Disconnected recipes lead to unmonitored raw grain and perishable vegetable stockouts.",
        "Attendance Gap & Food Loss: Schools order static meal counts rather than dynamic daily morning attendance indents, causing unaccounted food wastage.",
        "Data Inconsistencies & Anomalies: Unnormalized databases suffer from update/delete anomalies when commodity prices or route drivers change.",
        "Lack of Traceability: Inability to audit batch-to-school delivery times, holding temperatures (≥65°C), or donor funding attribution."
    ]
    for pb in problems:
        p_item = tf_p.add_paragraph()
        p_item.text = f"•  {pb}"
        p_item.font.size = Pt(11)
        p_item.font.color.rgb = COLOR_SECONDARY
        p_item.space_before = Pt(8)

    # Right Card: Objective
    add_card(s2, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.3), "PROJECT OBJECTIVES")
    obox = s2.shapes.add_textbox(Inches(7.0), Inches(2.2), Inches(5.3), Inches(4.5))
    tf_o = obox.text_frame
    tf_o.word_wrap = True

    o_desc = tf_o.paragraphs[0]
    o_desc.text = "Design, normalize, and implement a BCNF-compliant relational database management system:"
    o_desc.font.size = Pt(12)
    o_desc.font.color.rgb = COLOR_SECONDARY

    objectives = [
        "Boyce-Codd Normalization (BCNF): Eliminate all redundant functional dependencies and update/deletion anomalies across 12 relations.",
        "Automated PL/pgSQL Triggers: Implement 'trg_deduct_inventory' to automate FIFO stock deduction upon cooking completion with deficit rollback.",
        "Integrity & Over-Dispatch Protection: Enforce strict constraints so total dispatched meals never exceed actual batch production count.",
        "Multi-Tier Analytics & Traceability: Provide end-to-end auditability connecting agricultural procurement, cooking runs, delivery fleets, and donor 80G grants."
    ]
    for ob in objectives:
        o_item = tf_o.add_paragraph()
        o_item.text = f"•  {ob}"
        o_item.font.size = Pt(11)
        o_item.font.color.rgb = COLOR_SECONDARY
        o_item.space_before = Pt(8)

    # =========================================================================
    # SLIDE 3: System Overview (The Workflow)
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3)
    add_header(s3, "System Overview: End-to-End Operational Workflow")

    workflows = [
        ("1. Demand Indent", "Institutions submit daily morning student attendance headcounts via 'daily_indents' before 7:30 AM to establish precise production targets."),
        ("2. Recipe & BOM", "Central kitchen selects daily standard menus. The Bill of Materials (BOM) in 'recipe_ingredients' calculates exact raw commodity proportions."),
        ("3. Mega-Cooking", "Cauldrons cook 2,500–5,000 meal batches in 'meal_batches'. PL/pgSQL trigger automatically verifies stock and deducts raw materials via FIFO."),
        ("4. Fleet Logistics", "Insulated vans on 'delivery_routes' transport hot containers in 'dispatch_deliveries', recording dispatch & delivery holding temperatures (≥65°C)."),
        ("5. Donor Grants", "Philanthropic & CSR funds in 'donations' are mapped directly to subsidized meal counts and beneficiary schools with automated 80G receipts.")
    ]

    card_w = Inches(2.2)
    card_gap = Inches(0.18)
    start_x = Inches(0.8)

    for idx, (wf_title, wf_desc) in enumerate(workflows):
        cx = start_x + idx * (card_w + card_gap)
        add_card(s3, cx, Inches(1.8), card_w, Inches(4.8), wf_title)
        
        wbox = s3.shapes.add_textbox(cx + Inches(0.15), Inches(2.5), card_w - Inches(0.3), Inches(3.8))
        tf_w = wbox.text_frame
        tf_w.word_wrap = True
        p_w = tf_w.paragraphs[0]
        p_w.text = wf_desc
        p_w.font.size = Pt(11)
        p_w.font.color.rgb = COLOR_SECONDARY

    # Bottom summary bar
    sum_bar = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(6.8), Inches(11.733), Inches(0.45))
    sum_bar.fill.solid()
    sum_bar.fill.fore_color.rgb = RGBColor(254, 243, 199) # Amber 100
    sum_bar.line.color.rgb = COLOR_SAFFRON
    sum_bar.line.width = Pt(1)
    
    sbox = s3.shapes.add_textbox(Inches(1.0), Inches(6.82), Inches(11.3), Inches(0.4))
    p_s = sbox.text_frame.paragraphs[0]
    p_s.text = "Key DBMS Innovation: Batch completion atomically deducts raw stock and triggers logistics scheduling within an ACID transaction."
    p_s.font.size = Pt(10)
    p_s.font.bold = True
    p_s.font.color.rgb = COLOR_SAFFRON

    # =========================================================================
    # SLIDE 4: Core Entities
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4)
    add_header(s4, "Core Relational Entities & Attributes")

    domains = [
        ("1. MASTER CATALOG & RECIPES", [
            ("FOOD_ITEMS", "item_id (PK), item_name (UQ), category, uom, min_stock_threshold, shelf_life_days"),
            ("MENUS", "menu_id (PK), menu_name (UQ), meal_category, standard_calories, is_active"),
            ("RECIPE_INGREDIENTS", "recipe_id (PK), menu_id (FK), item_id (FK), qty_per_meal, uom")
        ]),
        ("2. WAREHOUSE & INVENTORY", [
            ("STOCK_INVENTORY", "stock_id (PK), item_id (FK), batch_number, received_date, expiry_date, current_qty, unit_price"),
            ("STOCK_TRANSACTIONS", "transaction_id (PK), stock_id (FK), item_id (FK), transaction_type, quantity, ref_batch_id")
        ]),
        ("3. PRODUCTION & LOGISTICS", [
            ("MEAL_BATCHES", "batch_id (PK), batch_code (UQ), menu_id (FK), target_servings, actual_servings, food_temp, status"),
            ("DELIVERY_ROUTES", "route_id (PK), route_code (UQ), vehicle_number, driver_name, max_capacity_meals"),
            ("DISPATCH_DELIVERIES", "dispatch_id (PK), batch_id (FK), route_id (FK), institution_id (FK), meals_dispatched, status")
        ]),
        ("4. INSTITUTIONS & DONORS", [
            ("INSTITUTIONS", "institution_id (PK), school_code (UQ), name, route_id (FK), total_enrolled"),
            ("DAILY_INDENTS", "indent_id (PK), institution_id (FK), indent_date, requested_meals, actual_present, leftover_meals"),
            ("SPONSORS & DONATIONS", "sponsor_id (PK), name, pan_number, amount_inr, 80g_receipt (UQ), earmarked_school")
        ])
    ]

    card_h = Inches(2.6)
    card_w2 = Inches(5.7)

    positions = [
        (Inches(0.8), Inches(1.6)),
        (Inches(6.8), Inches(1.6)),
        (Inches(0.8), Inches(4.5)),
        (Inches(6.8), Inches(4.5))
    ]

    for (dom_title, entity_list), (cx, cy) in zip(domains, positions):
        add_card(s4, cx, cy, card_w2, card_h, dom_title)
        ebox = s4.shapes.add_textbox(cx + Inches(0.2), cy + Inches(0.6), card_w2 - Inches(0.4), card_h - Inches(0.7))
        tf_e = ebox.text_frame
        tf_e.word_wrap = True
        
        for e_name, e_attrs in entity_list:
            p_e = tf_e.add_paragraph() if tf_e.paragraphs[0].text else tf_e.paragraphs[0]
            p_e.text = f"{e_name}:"
            p_e.font.size = Pt(11)
            p_e.font.bold = True
            p_e.font.color.rgb = COLOR_PRIMARY
            p_e.space_before = Pt(4)
            
            p_a = tf_e.add_paragraph()
            p_a.text = e_attrs
            p_a.font.size = Pt(9.5)
            p_a.font.color.rgb = COLOR_SECONDARY

    # =========================================================================
    # SLIDE 5: ER Diagram
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5)
    add_header(s5, "Entity-Relationship (ER) Diagram", "CONCEPTUAL & LOGICAL SCHEMA")

    er_img_path = 'docs/er_diagram.png'
    if os.path.exists(er_img_path):
        # Insert high-res ER diagram image
        s5.shapes.add_picture(er_img_path, Inches(0.8), Inches(1.5), width=Inches(11.733), height=Inches(5.5))
    else:
        # Fallback card if image missing
        add_card(s5, Inches(0.8), Inches(1.5), Inches(11.733), Inches(5.5), "ER DIAGRAM")

    # =========================================================================
    # SLIDE 6: Cardinality
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6)
    add_header(s6, "Cardinality & Structural Relationship Mappings")

    cardinalities = [
        ("MENUS  →  RECIPE_INGREDIENTS  (1 : N)",
         "One standardized menu defines multiple raw ingredient ratios. Each ingredient record belongs to exactly one menu recipe."),
        ("FOOD_ITEMS  →  STOCK_INVENTORY  (1 : N)",
         "One master commodity item (e.g. Rice) has multiple warehouse lot batches with distinct expiry dates and procurement prices."),
        ("MEAL_BATCHES  →  DISPATCH_DELIVERIES  (1 : N)",
         "One central kitchen cooking cauldron batch (e.g. 3,000 servings) is allocated across multiple delivery vans and schools."),
        ("DELIVERY_ROUTES  →  INSTITUTIONS  (1 : N)",
         "One delivery vehicle route services multiple schools located along a planned geographic corridor."),
        ("INSTITUTIONS  →  DAILY_INDENTS  (1 : N)",
         "One government school submits daily morning attendance headcount requests every day of the academic calendar."),
        ("SPONSORS  →  DONATIONS  (1 : N)",
         "One corporate CSR benefactor or individual donor can contribute multiple philanthropic grants over time.")
    ]

    c_w = Inches(5.7)
    c_h = Inches(1.55)
    c_positions = [
        (Inches(0.8), Inches(1.6)),
        (Inches(6.8), Inches(1.6)),
        (Inches(0.8), Inches(3.45)),
        (Inches(6.8), Inches(3.45)),
        (Inches(0.8), Inches(5.3)),
        (Inches(6.8), Inches(5.3))
    ]

    for (rel_title, rel_desc), (cx, cy) in zip(cardinalities, c_positions):
        add_card(s6, cx, cy, c_w, c_h)
        rbox = s6.shapes.add_textbox(cx + Inches(0.2), cy + Inches(0.12), c_w - Inches(0.4), c_h - Inches(0.2))
        tf_r = rbox.text_frame
        tf_r.word_wrap = True

        p_rt = tf_r.paragraphs[0]
        p_rt.text = rel_title
        p_rt.font.size = Pt(11.5)
        p_rt.font.bold = True
        p_rt.font.color.rgb = COLOR_SAFFRON

        p_rd = tf_r.add_paragraph()
        p_rd.text = rel_desc
        p_rd.font.size = Pt(10)
        p_rd.font.color.rgb = COLOR_SECONDARY
        p_rd.space_before = Pt(4)

    # =========================================================================
    # SLIDE 7: Normalization Strategy (1NF, 2NF, 3NF)
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7)
    add_header(s7, "Normalization Strategy: Eliminating Anomalies (1NF to 3NF)")

    norm_steps = [
        ("FIRST NORMAL FORM (1NF)",
         "Atomicity & Key Identification",
         [
             "Eliminated repeating groups: Flattened multi-ingredient arrays and multi-school deliveries into independent relational tuples.",
             "Atomic domain values: Every attribute contains single-valued data types (quantities, dates, strings).",
             "Identified candidate keys for every relation (e.g. item_id, batch_code, school_code)."
         ]),
        ("SECOND NORMAL FORM (2NF)",
         "Eliminating Partial Dependencies",
         [
             "Addressed composite candidate key in RECIPE_INGREDIENTS (menu_id, item_id).",
             "Removed partial dependencies: Attribute qty_per_meal depends fully on both keys, while ingredient metadata (item_name, category, uom) was decoupled into FOOD_ITEMS.",
             "Ensured every non-prime attribute is fully functionally dependent on the entire primary key."
         ]),
        ("THIRD NORMAL FORM (3NF)",
         "Eliminating Transitive Dependencies",
         [
             "Eliminated transitive dependencies of the form X → Y → Z.",
             "In school logistics: institution_id → route_id → (driver_name, vehicle_number). If a driver changes, updating schools caused anomalies.",
             "Decomposed into DELIVERY_ROUTES and INSTITUTIONS, preserving foreign key linkage with zero driver duplication."
         ])
    ]

    n_w = Inches(3.75)
    n_gap = Inches(0.24)

    for idx, (n_title, n_sub, n_bullets) in enumerate(norm_steps):
        nx = Inches(0.8) + idx * (n_w + n_gap)
        add_card(s7, nx, Inches(1.6), n_w, Inches(5.3), n_title)

        nbox = s7.shapes.add_textbox(nx + Inches(0.2), Inches(2.2), n_w - Inches(0.4), Inches(4.5))
        tf_n = nbox.text_frame
        tf_n.word_wrap = True

        p_sub = tf_n.paragraphs[0]
        p_sub.text = n_sub
        p_sub.font.size = Pt(11)
        p_sub.font.bold = True
        p_sub.font.color.rgb = COLOR_SAFFRON

        for blt in n_bullets:
            p_b = tf_n.add_paragraph()
            p_b.text = f"•  {blt}"
            p_b.font.size = Pt(10)
            p_b.font.color.rgb = COLOR_SECONDARY
            p_b.space_before = Pt(8)

    # =========================================================================
    # SLIDE 8: Advancing to BCNF (Boyce-Codd Normal Form)
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_background(s8)
    add_header(s8, "Advancing to BCNF (Boyce-Codd Normal Form)")

    # Left: BCNF Rigor
    add_card(s8, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.3), "BOYCE-CODD NORMAL FORM RIGOR")
    bbox = s8.shapes.add_textbox(Inches(1.0), Inches(2.2), Inches(5.3), Inches(4.5))
    tf_b = bbox.text_frame
    tf_b.word_wrap = True

    p_bdef = tf_b.paragraphs[0]
    p_bdef.text = "Mathematical Definition of BCNF:"
    p_bdef.font.size = Pt(12)
    p_bdef.font.bold = True
    p_bdef.font.color.rgb = COLOR_PRIMARY

    b_points = [
        "A relation R is in BCNF if and only if for every non-trivial functional dependency X → Y, X is strictly a Superkey.",
        "BCNF eliminates anomalies that 3NF allows when relations have multiple overlapping composite candidate keys.",
        "In our schema, every functional determinant across all 12 relations is verified as a candidate key or primary key.",
        "Lossless Decomposition & Dependency Preservation: Guaranteed through foreign key referential integrity."
    ]
    for bp in b_points:
        p_bp = tf_b.add_paragraph()
        p_bp.text = f"•  {bp}"
        p_bp.font.size = Pt(11)
        p_bp.font.color.rgb = COLOR_SECONDARY
        p_bp.space_before = Pt(8)

    # Right: Examples from Project Schema
    add_card(s8, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.3), "SCHEMA VERIFICATION PROOFS")
    pbox2 = s8.shapes.add_textbox(Inches(7.0), Inches(2.2), Inches(5.3), Inches(4.5))
    tf_p2 = pbox2.text_frame
    tf_p2.word_wrap = True

    p_proof = tf_p2.paragraphs[0]
    p_proof.text = "Determinant Verification in 12 Relations:"
    p_proof.font.size = Pt(12)
    p_proof.font.bold = True
    p_proof.font.color.rgb = COLOR_PRIMARY

    proofs = [
        "FOOD_ITEMS: item_id → all attributes (PK is Superkey). item_name → all attributes (UNIQUE constraint is Candidate Key). Satisfies BCNF.",
        "INSTITUTIONS: institution_id → all (PK). school_code → all (UNIQUE candidate key). Satisfies BCNF.",
        "DONATIONS: donation_id → all (PK). tax_exemption_80g_receipt → all (UNIQUE candidate key). Satisfies BCNF.",
        "RECIPE_INGREDIENTS: Candidate key (menu_id, item_id) → qty_per_meal, uom. No non-superkey determinants exist. Satisfies BCNF."
    ]
    for pf in proofs:
        p_pf = tf_p2.add_paragraph()
        p_pf.text = f"✓  {pf}"
        p_pf.font.size = Pt(10.5)
        p_pf.font.color.rgb = COLOR_SECONDARY
        p_pf.space_before = Pt(8)

    # =========================================================================
    # SLIDE 9: Sample Data & Implementation
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_background(s9)
    add_header(s9, "Sample Data, SQL Realization & PL/pgSQL Triggers")

    # Left: Code Block Card
    add_card(s9, Inches(0.8), Inches(1.6), Inches(6.3), Inches(5.3), "SQL REALIZATION: 5-TABLE TRACEABILITY JOIN")
    
    # Dark code editor box
    code_bg = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(2.2), Inches(5.9), Inches(4.4))
    code_bg.fill.solid()
    code_bg.fill.fore_color.rgb = COLOR_CODE_BG
    code_bg.line.fill.background()

    cbox = s9.shapes.add_textbox(Inches(1.1), Inches(2.25), Inches(5.7), Inches(4.3))
    tf_code = cbox.text_frame
    tf_code.word_wrap = True
    p_code = tf_code.paragraphs[0]
    p_code.text = (
        "-- End-to-End Meal Traceability Query\n"
        "SELECT mb.batch_code, m.menu_name,\n"
        "       inst.name AS school_name,\n"
        "       dr.route_code, dr.vehicle_number,\n"
        "       dd.meals_dispatched,\n"
        "       dd.delivery_temp_celsius,\n"
        "       dd.delivery_status\n"
        "FROM dispatch_deliveries dd\n"
        "JOIN meal_batches mb ON dd.batch_id = mb.batch_id\n"
        "JOIN menus m ON mb.menu_id = m.menu_id\n"
        "JOIN institutions inst ON dd.institution_id = inst.institution_id\n"
        "JOIN delivery_routes dr ON dd.route_id = dr.route_id\n"
        "WHERE dd.dispatch_date = CURRENT_DATE\n"
        "ORDER BY dd.departure_time DESC;"
    )
    p_code.font.size = Pt(9.5)
    p_code.font.name = "Courier New"
    p_code.font.color.rgb = COLOR_CODE_TXT

    # Right: Procedural Triggers & Performance Card
    add_card(s9, Inches(7.4), Inches(1.6), Inches(5.1), Inches(5.3), "PROCEDURAL TRIGGERS & PERFORMANCE")
    rbox2 = s9.shapes.add_textbox(Inches(7.6), Inches(2.2), Inches(4.7), Inches(4.5))
    tf_r2 = rbox2.text_frame
    tf_r2.word_wrap = True

    triggers_info = [
        ("trg_deduct_inventory (AFTER UPDATE)",
         "Fires when batch status reaches 'COMPLETED'. Validates stock and auto-deducts raw commodities via FIFO. Aborts with 'INVENTORY DEFICIT' if stock is insufficient."),
        ("trg_check_dispatch (BEFORE INSERT)",
         "Enforces that cumulative meals dispatched across all school routes strictly does not exceed cooked batch production count."),
        ("B-Tree Performance Indexes",
         "Created indexes on foreign keys, stock_inventory(expiry_date), and meal_batches(prep_date), ensuring sub-5ms join execution.")
    ]

    for t_name, t_desc in triggers_info:
        p_t = tf_r2.add_paragraph() if tf_r2.paragraphs[0].text else tf_r2.paragraphs[0]
        p_t.text = t_name
        p_t.font.size = Pt(11)
        p_t.font.bold = True
        p_t.font.color.rgb = COLOR_SAFFRON
        p_t.space_before = Pt(6)

        p_td = tf_r2.add_paragraph()
        p_td.text = t_desc
        p_td.font.size = Pt(9.8)
        p_td.font.color.rgb = COLOR_SECONDARY
        p_td.space_before = Pt(2)

    # =========================================================================
    # SLIDE 10: Conclusion
    # =========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_background(s10)
    add_header(s10, "Conclusion & Academic Significance")

    conclusions = [
        ("BCNF Mathematical Compliance",
         "Achieved zero update, insertion, or deletion anomalies across all 12 relational entities. All functional dependencies satisfy superkey determinant constraints with lossless joins."),
        ("ACID & Procedural Reliability",
         "Automated business rules (FIFO raw ingredient deduction, over-dispatch blocking, and attendance gap tracking) run in database-level PL/pgSQL triggers, guaranteeing transactional integrity."),
        ("Real-World Operational Impact",
         "Models the exact operational requirements of Akshaya Patra: dynamic morning indents, food holding temperature compliance (≥65°C), route load balancing, and 80G philanthropic attribution.")
    ]

    card_w3 = Inches(3.75)
    gap3 = Inches(0.24)

    for idx, (c_title, c_desc) in enumerate(conclusions):
        cx = Inches(0.8) + idx * (card_w3 + gap3)
        add_card(s10, cx, Inches(1.8), card_w3, Inches(4.8), c_title)

        cbox3 = s10.shapes.add_textbox(cx + Inches(0.2), Inches(2.5), card_w3 - Inches(0.4), Inches(3.8))
        tf_c3 = cbox3.text_frame
        tf_c3.word_wrap = True

        p_c3 = tf_c3.paragraphs[0]
        p_c3.text = c_desc
        p_c3.font.size = Pt(11)
        p_c3.font.color.rgb = COLOR_SECONDARY

    # =========================================================================
    # SLIDE 11: Thank You!
    # =========================================================================
    s11 = prs.slides.add_slide(blank_layout)
    set_slide_background(s11)

    # Accent Top Banner
    tbar11 = s11.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(0.15))
    tbar11.fill.solid()
    tbar11.fill.fore_color.rgb = COLOR_SAFFRON
    tbar11.line.fill.background()

    # Center Thank You Box
    ty_box = s11.shapes.add_textbox(Inches(1.5), Inches(2.2), Inches(10.333), Inches(3.2))
    tf_ty = ty_box.text_frame
    tf_ty.word_wrap = True

    p_ty = tf_ty.paragraphs[0]
    p_ty.text = "Thank You!"
    p_ty.font.size = Pt(44)
    p_ty.font.bold = True
    p_ty.font.color.rgb = COLOR_PRIMARY
    p_ty.alignment = PP_ALIGN.CENTER

    p_subty = tf_ty.add_paragraph()
    p_subty.text = "Questions & Academic Viva Discussion"
    p_subty.font.size = Pt(18)
    p_subty.font.bold = True
    p_subty.font.color.rgb = COLOR_SAFFRON
    p_subty.alignment = PP_ALIGN.CENTER
    p_subty.space_before = Pt(12)

    p_sub2 = tf_ty.add_paragraph()
    p_sub2.text = "Akshaya Patra Food Distribution Management System • PostgreSQL 16 (PL/pgSQL) • BCNF"
    p_sub2.font.size = Pt(12)
    p_sub2.font.color.rgb = COLOR_MUTED
    p_sub2.alignment = PP_ALIGN.CENTER
    p_sub2.space_before = Pt(8)

    # Save presentation
    prs.save(output_path)
    print(f"Presentation saved successfully at: {output_path}")

if __name__ == '__main__':
    create_presentation()
