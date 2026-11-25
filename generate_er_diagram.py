import matplotlib.pyplot as plt
import matplotlib.patches as patches

def draw_er_diagram(output_path='docs/er_diagram.png'):
    # Create figure with high resolution
    fig, ax = plt.subplots(figsize=(16, 9), dpi=300)
    ax.set_facecolor('#F8FAFC')
    fig.patch.set_facecolor('#F8FAFC')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Color palette
    hdr_color = '#1E293B'      # Dark Slate for table header
    hdr_txt = '#FFFFFF'
    body_bg = '#FFFFFF'
    border_color = '#CBD5E1'
    pk_color = '#B45309'        # Amber/Gold for PK
    fk_color = '#0369A1'        # Blue for FK
    attr_color = '#334155'
    line_color = '#64748B'

    # Table definitions: (x, y, w, h, title, [pk, fks, attrs])
    tables = {
        'food_items': {
            'x': 3, 'y': 68, 'w': 18, 'h': 26,
            'title': 'FOOD_ITEMS',
            'pk': 'PK: item_id (INT)',
            'fks': [],
            'attrs': ['item_name (VARCHAR UQ)', 'category (VARCHAR)', 'uom (VARCHAR)', 'min_stock (NUMERIC)', 'shelf_life_days (INT)']
        },
        'stock_inventory': {
            'x': 3, 'y': 36, 'w': 18, 'h': 27,
            'title': 'STOCK_INVENTORY',
            'pk': 'PK: stock_id (INT)',
            'fks': ['FK: item_id -> food_items'],
            'attrs': ['batch_number (VARCHAR)', 'received_date (DATE)', 'expiry_date (DATE)', 'current_qty (NUMERIC)', 'unit_price_inr (NUMERIC)']
        },
        'stock_transactions': {
            'x': 3, 'y': 5, 'w': 18, 'h': 26,
            'title': 'STOCK_TRANSACTIONS',
            'pk': 'PK: transaction_id (INT)',
            'fks': ['FK: stock_id -> stock_inventory', 'FK: item_id -> food_items', 'FK: ref_batch_id -> batches'],
            'attrs': ['transaction_type (VARCHAR)', 'quantity (NUMERIC)', 'timestamp (DATETIME)']
        },
        'menus': {
            'x': 27, 'y': 70, 'w': 18, 'h': 24,
            'title': 'MENUS',
            'pk': 'PK: menu_id (INT)',
            'fks': [],
            'attrs': ['menu_name (VARCHAR UQ)', 'meal_category (VARCHAR)', 'standard_calories (INT)', 'is_active (BOOLEAN)']
        },
        'recipe_ingredients': {
            'x': 27, 'y': 38, 'w': 18, 'h': 26,
            'title': 'RECIPE_INGREDIENTS',
            'pk': 'PK: recipe_id (INT)',
            'fks': ['FK: menu_id -> menus', 'FK: item_id -> food_items'],
            'attrs': ['qty_per_meal (NUMERIC)', 'uom (VARCHAR)', 'UQ (menu_id, item_id)']
        },
        'meal_batches': {
            'x': 27, 'y': 5, 'w': 18, 'h': 27,
            'title': 'MEAL_BATCHES',
            'pk': 'PK: batch_id (INT)',
            'fks': ['FK: menu_id -> menus'],
            'attrs': ['batch_code (VARCHAR UQ)', 'prep_date (DATE)', 'target_servings (INT)', 'actual_servings (INT)', 'food_temp_celsius (NUM)', 'status (VARCHAR)']
        },
        'delivery_routes': {
            'x': 53, 'y': 70, 'w': 18, 'h': 24,
            'title': 'DELIVERY_ROUTES',
            'pk': 'PK: route_id (INT)',
            'fks': [],
            'attrs': ['route_code (VARCHAR UQ)', 'route_name (VARCHAR)', 'vehicle_number (VARCHAR)', 'driver_name (VARCHAR)', 'max_capacity (INT)']
        },
        'institutions': {
            'x': 53, 'y': 36, 'w': 18, 'h': 27,
            'title': 'INSTITUTIONS',
            'pk': 'PK: institution_id (INT)',
            'fks': ['FK: route_id -> delivery_routes'],
            'attrs': ['school_code (VARCHAR UQ)', 'name (VARCHAR)', 'institution_type (VARCHAR)', 'total_enrolled (INT)', 'principal_phone (VARCHAR)']
        },
        'daily_indents': {
            'x': 53, 'y': 5, 'w': 18, 'h': 25,
            'title': 'DAILY_INDENTS',
            'pk': 'PK: indent_id (INT)',
            'fks': ['FK: inst_id -> institutions'],
            'attrs': ['indent_date (DATE)', 'requested_meals (INT)', 'actual_present (INT)', 'leftover_meals (INT)', 'wastage_reason (TEXT)']
        },
        'dispatch_deliveries': {
            'x': 78, 'y': 50, 'w': 19, 'h': 28,
            'title': 'DISPATCH_DELIVERIES',
            'pk': 'PK: dispatch_id (INT)',
            'fks': ['FK: batch_id -> batches', 'FK: route_id -> routes', 'FK: inst_id -> institutions'],
            'attrs': ['dispatch_date (DATE)', 'meals_dispatched (INT)', 'departure_time (DATETIME)', 'delivery_temp (NUMERIC)', 'delivery_status (VARCHAR)']
        },
        'sponsors': {
            'x': 78, 'y': 26, 'w': 19, 'h': 20,
            'title': 'SPONSORS',
            'pk': 'PK: sponsor_id (INT)',
            'fks': [],
            'attrs': ['name (VARCHAR)', 'organization_type (VARCHAR)', 'email (VARCHAR UQ)', 'pan_number (VARCHAR)']
        },
        'donations': {
            'x': 78, 'y': 2, 'w': 19, 'h': 21,
            'title': 'DONATIONS',
            'pk': 'PK: donation_id (INT)',
            'fks': ['FK: sponsor_id -> sponsors', 'FK: earmarked_inst -> inst'],
            'attrs': ['amount_inr (NUMERIC)', 'donation_date (DATE)', 'payment_mode (VARCHAR)', 'receipt_80g (VARCHAR UQ)']
        }
    }

    # Render Table Cards
    for k, t in tables.items():
        x, y, w, h = t['x'], t['y'], t['w'], t['h']
        
        # Shadow / Border Card
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.3,rounding_size=0.8",
                                      facecolor=body_bg, edgecolor=border_color, linewidth=1.2, zorder=2)
        ax.add_patch(rect)
        
        # Header bar
        header_h = 3.6
        hdr = patches.FancyBboxPatch((x, y + h - header_h), w, header_h, boxstyle="round,pad=0.2,rounding_size=0.6",
                                     facecolor=hdr_color, edgecolor=hdr_color, zorder=3)
        ax.add_patch(hdr)
        
        # Header Text
        ax.text(x + w/2, y + h - header_h/2, t['title'], color=hdr_txt, fontsize=8.5,
                fontweight='bold', ha='center', va='center', zorder=4)
        
        # Lines inside table
        curr_y = y + h - header_h - 1.8
        
        # PK
        ax.text(x + 0.8, curr_y, t['pk'], color=pk_color, fontsize=7.2, fontweight='bold', va='center', zorder=4)
        curr_y -= 1.8
        
        # FKs
        for fk in t['fks']:
            ax.text(x + 0.8, curr_y, fk, color=fk_color, fontsize=6.8, fontweight='semibold', va='center', zorder=4)
            curr_y -= 1.7
            
        # Attrs
        for attr in t['attrs']:
            ax.text(x + 0.8, curr_y, attr, color=attr_color, fontsize=6.8, va='center', zorder=4)
            curr_y -= 1.7

    # Connectors (Relationship Arrows with Cardinality)
    def connect(t1, t2, p1, p2, label1='1', label2='N', style='arc3,rad=0.0'):
        x1, y1 = p1
        x2, y2 = p2
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="->", color=line_color, lw=1.2,
                                    connectionstyle=style),
                    zorder=1)
        ax.text(x1, y1, label1, color='#475569', fontsize=7, fontweight='bold', zorder=5)
        ax.text(x2, y2, label2, color='#475569', fontsize=7, fontweight='bold', zorder=5)

    # Connections
    # food_items -> stock_inventory
    connect('food_items', 'stock_inventory', (12, 68), (12, 63), '1', 'N')
    # food_items -> recipe_ingredients
    connect('food_items', 'recipe_ingredients', (21, 75), (27, 55), '1', 'N', 'arc3,rad=-0.15')
    # menus -> recipe_ingredients
    connect('menus', 'recipe_ingredients', (36, 70), (36, 64), '1', 'N')
    # menus -> meal_batches
    connect('menus', 'meal_batches', (40, 70), (40, 32), '1', 'N', 'arc3,rad=0.25')
    # meal_batches -> stock_transactions
    connect('meal_batches', 'stock_transactions', (27, 18), (21, 18), '1', 'N')
    # delivery_routes -> institutions
    connect('delivery_routes', 'institutions', (62, 70), (62, 63), '1', 'N')
    # institutions -> daily_indents
    connect('institutions', 'daily_indents', (62, 36), (62, 30), '1', 'N')
    # meal_batches -> dispatch_deliveries
    connect('meal_batches', 'dispatch_deliveries', (45, 18), (78, 60), '1', 'N', 'arc3,rad=-0.25')
    # institutions -> dispatch_deliveries
    connect('institutions', 'dispatch_deliveries', (71, 50), (78, 65), '1', 'N', 'arc3,rad=0.1')
    # sponsors -> donations
    connect('sponsors', 'donations', (87, 26), (87, 23), '1', 'N')
    # donations -> institutions
    connect('donations', 'institutions', (78, 12), (71, 40), 'N', '1', 'arc3,rad=0.2')

    # Title block
    ax.text(50, 97.5, 'Akshaya Patra – Normalized Relational Database Schema (ER Model)',
            fontsize=13, fontweight='bold', color='#0F172A', ha='center', va='center')
    ax.text(50, 95.2, '12 BCNF-Compliant Entities with Foreign Key Integrity, Cascade Rules & Constraints',
            fontsize=8.5, color='#64748B', ha='center', va='center')

    plt.tight_layout()
    plt.savefig(output_path, dpi=300, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print(f'ER Diagram generated at: {output_path}')

if __name__ == '__main__':
    draw_er_diagram()
