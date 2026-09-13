-- Del Pasta Ops — sample data (Cheese Samosa end-to-end example)
-- Run AFTER schema.sql, once, in the Supabase SQL editor. Safe to re-run (upserts).

insert into categories (id, name_ar, name_en, name_sw, kind, sort_order) values
  ('pastries', 'المعجنات والمقليات', 'Pastries & Fried Items', 'Vitafunio na Vyakula vya Kukaanga', 'consumable', 0),
  ('dairy', 'الألبان', 'Dairy', 'Maziwa', 'consumable', 1),
  ('vegetables', 'الخضروات', 'Vegetables', 'Mboga', 'consumable', 2),
  ('spices', 'التوابل', 'Spices', 'Viungo', 'consumable', 3),
  ('rawmaterials', 'المواد الخام', 'Raw Materials', 'Malighafi', 'consumable', 4),
  ('packaging', 'مواد التغليف', 'Packaging', 'Ufungaji', 'consumable', 5),
  ('meat-chicken', 'اللحوم والدجاج', 'Meat & Chicken', 'Nyama na Kuku', 'consumable', 6),
  ('cleaning', 'مستلزمات التنظيف', 'Cleaning Supplies', 'Vifaa vya Usafi', 'consumable', 7),
  ('tableware', 'أدوات تقديم البوفيه', 'Buffet Tableware', 'Vyombo vya Tafrija', 'asset', 8)
on conflict (id) do update set name_ar = excluded.name_ar, name_en = excluded.name_en, name_sw = excluded.name_sw;

insert into inventory_items (id, name_ar, name_en, name_sw, category_id, icon, unit, qty, min_level, max_level, supplier,
  storage_location_ar, storage_location_en, storage_location_sw, storage_method_ar, storage_method_en, storage_method_sw,
  expiry_date, batch_number, purchase_price, cost_per_unit, active)
values
  ('11111111-1111-1111-1111-111111111101', 'رقائق عجين السمبوسة', 'Samosa Pastry Sheets', 'Karatasi za Sambusa', 'rawmaterials', 'pastry', 'kg', 18, 8, 40, 'Oman Bakery Supplies',
    'المخزن البارد - رف A1', 'Cold storage — Shelf A1', 'Hifadhi baridi — Rafu A1', 'يُحفظ مبردًا 2-4°م', 'Keep refrigerated 2-4°C', 'Hifadhi jokofu 2-4°C',
    current_date + 5, 'PS-0912', 21.6, 1.2, true),
  ('11111111-1111-1111-1111-111111111102', 'جبن موزاريلا', 'Mozzarella Cheese', 'Jibini la Mozzarella', 'dairy', 'cheese', 'kg', 9, 6, 25, 'Gulf Dairy Trading',
    'الثلاجة الرئيسية - رف 2', 'Main fridge — Shelf 2', 'Jokofu kuu — Rafu 2', 'يُحفظ في الثلاجة 0-4°م', 'Refrigerate at 0-4°C', 'Hifadhi jokofu 0-4°C',
    current_date + 10, 'MZ-0905', 25.2, 2.8, true),
  ('11111111-1111-1111-1111-111111111103', 'بصل', 'Onion', 'Kitunguu', 'vegetables', 'onion', 'kg', 14, 5, 30, 'Al Amerat Farms',
    'مخزن الخضروات', 'Vegetable store', 'Hifadhi ya mboga', 'مكان بارد وجاف', 'Cool, dry place', 'Mahali baridi na kavu',
    null, '', 4.9, 0.35, true),
  ('11111111-1111-1111-1111-111111111104', 'خلطة بهارات السمبوسة', 'Samosa Spice Mix', 'Mchanganyiko wa Viungo vya Sambusa', 'spices', 'spice', 'kg', 1.4, 1, 5, 'Muscat Spice Co.',
    'رف التوابل', 'Spice shelf', 'Rafu ya viungo', 'وعاء محكم بعيدًا عن الرطوبة', 'Airtight container', 'Chombo kisichopitisha hewa',
    current_date + 180, 'SP-118', 6.3, 4.5, true),
  ('11111111-1111-1111-1111-111111111105', 'زيت نباتي', 'Vegetable Oil', 'Mafuta ya Mboga', 'rawmaterials', 'oil', 'L', 22, 10, 60, 'Oman Oil Trading',
    'مخزن جاف', 'Dry store', 'Hifadhi kavu', 'يُحفظ بعيدًا عن الحرارة', 'Store away from heat', 'Hifadhi mbali na joto',
    null, '', 24.2, 1.1, true),
  ('11111111-1111-1111-1111-111111111106', 'نشا الذرة', 'Corn Starch', 'Wanga wa Mahindi', 'rawmaterials', 'starch', 'kg', 3.2, 2, 10, 'Muscat Spice Co.',
    'مخزن جاف', 'Dry store', 'Hifadhi kavu', '', 'Sealed, dry place', '',
    null, '', 2.88, 0.9, true),
  ('11111111-1111-1111-1111-111111111107', 'علبة تغليف سمبوسة (10 قطع)', 'Samosa Packaging Box (10-pack)', 'Boksi la Ufungaji Sambusa (vipande 10)', 'packaging', 'packaging', 'unit', 180, 100, 600, 'Gulf Packaging LLC',
    'مخزن التغليف', 'Packaging store', 'Hifadhi ya ufungaji', '', 'Flat-packed, dry area', '',
    null, '', 45, 0.25, true),
  ('11111111-1111-1111-1111-111111111108', 'صدور دجاج', 'Chicken Breast', 'Kifua cha Kuku', 'meat-chicken', 'meat', 'kg', 4, 15, 40, 'Oman Poultry Co.',
    'الفريزر - رف 1', 'Freezer — Shelf 1', 'Friji — Rafu 1', 'مجمد -18°م', 'Frozen at -18°C', 'Gandishwa -18°C',
    current_date + 60, 'CH-221', 8.4, 2.1, true),
  ('11111111-1111-1111-1111-111111111109', 'سائل غسيل الأطباق', 'Dish Soap', 'Sabuni ya Vyombo', 'cleaning', 'clean', 'L', 0, 4, 20, 'Muscat Cleaning Supplies',
    'مخزن التنظيف', 'Cleaning store', 'Hifadhi ya usafi', '', 'Sealed, upright', '',
    null, '', 15, 1.5, true),
  ('11111111-1111-1111-1111-111111111110', 'حليب كامل الدسم', 'Whole Milk', 'Maziwa Yote', 'dairy', 'dairy', 'L', 12, 6, 24, 'Gulf Dairy Trading',
    'الثلاجة الرئيسية - رف 1', 'Main fridge — Shelf 1', 'Jokofu kuu — Rafu 1', 'يُحفظ في الثلاجة', 'Refrigerate', 'Hifadhi jokofu',
    current_date + 2, 'MK-330', 10.8, 0.9, true)
on conflict (id) do nothing;

insert into recipes (id, name_ar, name_en, name_sw, category, status, base_yield, yield_unit_ar, yield_unit_en, yield_unit_sw,
  prep_time_min, cook_time_min, storage_instructions_ar, storage_instructions_en, storage_instructions_sw,
  shelf_life_ar, shelf_life_en, shelf_life_sw, common_mistakes_ar, common_mistakes_en, common_mistakes_sw, photo_url)
values (
  'cheese-samosa', 'سمبوسة الجبن', 'Cheese Samosa', 'Sambusa ya Jibini', 'Pastries & Fried Items', 'approved', 100,
  'قطعة', 'pieces', 'vipande', 40, 15,
  'يُحفظ مبردًا حتى 3 أيام أو مجمدًا (غير مطهو) حتى شهرين في عبوة محكمة.',
  'Refrigerate up to 3 days, or freeze uncooked up to 2 months in an airtight container.',
  'Hifadhi jokofu hadi siku 3, au gandisha bila kupika hadi miezi 2 kwenye chombo kisichopitisha hewa.',
  '3 أيام مبردًا / شهرين مجمدًا', '3 days refrigerated / 2 months frozen', 'Siku 3 jokofu / Miezi 2 friji',
  'حشوة زائدة تؤدي لانفجار القطعة أثناء القلي؛ أيدٍ مبللة تجعل العجين طريًا؛ عدم إغلاق الحواف جيدًا يسبب تسرب الحشوة.',
  'Overfilling causes bursting during frying; wet hands make the pastry soggy; poorly sealed edges leak filling.',
  'Kujaza kupita kiasi husababisha kupasuka; mikono yenye unyevu hufanya ukoko kuwa laini; kingo zisizofungwa vizuri huvuja.',
  null
) on conflict (id) do update set name_ar = excluded.name_ar;

delete from recipe_equipment where recipe_id = 'cheese-samosa';
insert into recipe_equipment (recipe_id, name_ar, name_en, name_sw, sort_order) values
  ('cheese-samosa', 'وعاء خلط', 'Mixing bowl', 'Bakuli la kuchanganyia', 0),
  ('cheese-samosa', 'ميزان مطبخ', 'Kitchen scale', 'Mizani ya jikoni', 1),
  ('cheese-samosa', 'فرشاة لصق', 'Sealing brush', 'Brashi ya kuziba', 2),
  ('cheese-samosa', 'مقلاة أو فرن', 'Fryer or oven', 'Kikaangio au oveni', 3),
  ('cheese-samosa', 'رف تبريد', 'Cooling rack', 'Rafu ya kupoza', 4);

delete from recipe_ingredients where recipe_id = 'cheese-samosa';
insert into recipe_ingredients (recipe_id, item_id, qty, unit, prep_state_ar, prep_state_en, prep_state_sw, optional, notes, sort_order) values
  ('cheese-samosa', '11111111-1111-1111-1111-111111111102', 3, 'kg', 'مبشور', 'grated', 'iliyokwaruzwa', false, '', 0),
  ('cheese-samosa', '11111111-1111-1111-1111-111111111101', 2.5, 'kg', '', '', '', false, '', 1),
  ('cheese-samosa', '11111111-1111-1111-1111-111111111103', 0.5, 'kg', 'مقطّع ناعم', 'finely diced', 'iliyokatwa vizuri', false, '', 2),
  ('cheese-samosa', '11111111-1111-1111-1111-111111111104', 0.1, 'kg', '', '', '', false, '', 3),
  ('cheese-samosa', '11111111-1111-1111-1111-111111111105', 0.4, 'L', '', '', '', false, 'For sealing paste and frying loss', 4),
  ('cheese-samosa', '11111111-1111-1111-1111-111111111106', 0.05, 'kg', 'يُخلط كعجينة لصق', 'mixed into sealing paste', 'iliyochanganywa kuwa gundi', false, '', 5),
  ('cheese-samosa', '11111111-1111-1111-1111-111111111107', 10, 'unit', '', '', '', false, '', 6);

delete from recipe_steps where recipe_id = 'cheese-samosa';
insert into recipe_steps (recipe_id, step_number, icon, short_ar, short_en, short_sw, detailed_ar, detailed_en, detailed_sw,
  warning_ar, warning_en, warning_sw, qc_ar, qc_en, qc_sw) values
  ('cheese-samosa', 1, 'cheese',
    'تحضير الحشوة', 'Prepare the filling', 'Andaa kujaza',
    'قطّع البصل ناعمًا جدًا واخلطه مع الجبن المبشور وخلطة البهارات في وعاء واحد حتى يتجانس المزيج.',
    'Finely dice the onion and mix it with grated cheese and the spice blend in one bowl until evenly combined.',
    'Katakata kitunguu vizuri sana kisha changanya na jibini lililokwaruzwa na mchanganyiko wa viungo kwenye bakuli moja.',
    'أبقِ الحشوة باردة لتفادي أن تصبح طرية ومبللة.', 'Keep the filling cold to prevent it from becoming soggy.', 'Weka kujaza baridi ili kuzuia unyevu mwingi.',
    'يجب أن تكون الحشوة متجانسة بدون كتل جبن كبيرة.', 'Filling should be uniform with no large cheese clumps.', 'Kujaza kunapaswa kuwa sawasawa bila mabonge makubwa ya jibini.'),
  ('cheese-samosa', 2, 'default',
    'تقسيم الحشوة', 'Portion the filling', 'Gawanya kujaza',
    'زِن 15 غرامًا من الحشوة لكل قطعة باستخدام الميزان لضمان حجم موحّد لكل سمبوسة.',
    'Weigh 15g of filling per piece using the kitchen scale to keep every samosa a consistent size.',
    'Pima gramu 15 za kujaza kwa kila kipande kwa kutumia mizani.',
    '', '', '',
    'وزن كل قطعة ثابت بفارق غرام واحد كحد أقصى.', 'Each portion weight consistent within ±1g.', 'Uzito wa kila kipande thabiti ndani ya gramu 1.'),
  ('cheese-samosa', 3, 'samosa',
    'طيّ السمبوسة', 'Fold the samosa', 'Kunja sambusa',
    'ضع الحشوة على شريط العجين واطوِه على شكل مثلث، ثم أغلق الحافة بعجينة النشا لضمان الإحكام.',
    'Place the filling on the pastry strip and fold it into a triangle shape, then seal the edge with the corn-starch paste.',
    'Weka kujaza kwenye ukanda wa unga kisha kunja kuwa umbo la pembetatu, halafu funga kingo kwa mchanganyiko wa wanga.',
    'أغلق الحواف بالكامل وإلا ستتسرب الحشوة أثناء القلي.', 'Seal the edges fully or the filling will leak out during frying.', 'Funga kingo zote vizuri la sivyo kujaza kutavuja.',
    'طية مثلثة محكمة بلا فجوات ظاهرة.', 'Tight triangular fold with no visible gaps.', 'Mkunjo wa pembetatu ulio imara bila mianya.'),
  ('cheese-samosa', 4, 'oil',
    'القلي أو الخَبز', 'Fry or bake', 'Kaanga au oka',
    'اقلِ عند 170°م حتى يصبح اللون ذهبيًا (حوالي 3-4 دقائق)، أو اخبز عند 200°م لمدة 12 دقيقة.',
    'Fry at 170°C until golden brown (about 3-4 minutes), or bake at 200°C for 12 minutes.',
    'Kaanga kwa 170°C hadi rangi ya dhahabu (dakika 3-4), au oka kwa 200°C kwa dakika 12.',
    'زيت شديد السخونة يحرق العجين قبل أن تسخن الحشوة بالكامل.', 'Oil that is too hot burns the pastry before the filling heats through.', 'Mafuta yenye joto kupita kiasi huunguza ukoko.',
    'لون ذهبي، قوام مقرمش، وحشوة ذائبة بالكامل.', 'Golden-brown color, crisp texture, filling fully melted.', 'Rangi ya dhahabu, muundo wenye ukavu, kujaza kuyeyuka vizuri.'),
  ('cheese-samosa', 5, 'tray',
    'التبريد والتعبئة', 'Cool and pack', 'Poza na fungasha',
    'اترك السمبوسة على رف التبريد لمدة 5 دقائق، ثم عبّئ 10 قطع في كل علبة مع بطاقة تاريخ الإنتاج.',
    'Let the samosas cool on a rack for 5 minutes, then pack 10 pieces per box with a production-date label.',
    'Ache sambusa zipoe kwenye rafu kwa dakika 5, kisha fungasha vipande 10 kwa kila boksi.',
    '', '', '',
    'العلبة مغلقة بإحكام وموسومة بتاريخ الإنتاج ومدة الصلاحية.', 'Box sealed and labeled with production date and shelf life.', 'Boksi limefungwa vizuri na kuwekwa lebo.');

delete from recipe_qc_checkpoints where recipe_id = 'cheese-samosa';
insert into recipe_qc_checkpoints (recipe_id, text_ar, text_en, text_sw, sort_order) values
  ('cheese-samosa', 'لون ذهبي متجانس', 'Even golden-brown color', 'Rangi ya dhahabu sawasawa', 0),
  ('cheese-samosa', 'طية مثلثة محكمة بلا فجوات', 'Tight triangular fold, no gaps', 'Mkunjo wa pembetatu kamili bila mianya', 1),
  ('cheese-samosa', 'وزن الحشوة ثابت (±1غ)', 'Consistent filling weight (±1g)', 'Uzito wa kujaza thabiti (±1g)', 2);

insert into inventory_transactions (item_id, type, qty, unit, datetime, user_name, reason) values
  ('11111111-1111-1111-1111-111111111102', 'in', 12, 'kg', now() - interval '3 days', 'Admin', 'Weekly purchase'),
  ('11111111-1111-1111-1111-111111111102', 'out', 3, 'kg', now() - interval '1 day', 'Staff', 'production: Cheese Samosa'),
  ('11111111-1111-1111-1111-111111111101', 'in', 24, 'kg', now() - interval '4 days', 'Admin', 'Weekly purchase'),
  ('11111111-1111-1111-1111-111111111108', 'waste', 1.2, 'kg', now() - interval '2 days', 'Staff', 'Spoiled — temperature excursion'),
  ('11111111-1111-1111-1111-111111111109', 'out', 4, 'L', now() - interval '5 days', 'Staff', 'Cleaning');
