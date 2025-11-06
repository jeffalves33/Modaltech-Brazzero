-- Seed menu items
INSERT INTO public.menu_items (name, description, category, price, is_available) VALUES
  ('X-Burger Clássico', 'Hambúrguer 180g, queijo, alface, tomate e molho especial', 'Hambúrgueres', 25.90, true),
  ('X-Bacon', 'Hambúrguer 180g, bacon crocante, queijo, alface e tomate', 'Hambúrgueres', 28.90, true),
  ('X-Salada', 'Hambúrguer 180g, queijo, alface, tomate, milho e batata palha', 'Hambúrgueres', 27.90, true),
  ('X-Tudo', 'Hambúrguer 180g, bacon, ovo, queijo, presunto, alface, tomate', 'Hambúrgueres', 32.90, true),
  ('X-Frango', 'Filé de frango grelhado, queijo, alface, tomate e maionese', 'Hambúrgueres', 24.90, true),
  ('Batata Frita P', 'Porção pequena de batata frita crocante', 'Acompanhamentos', 12.00, true),
  ('Batata Frita M', 'Porção média de batata frita crocante', 'Acompanhamentos', 18.00, true),
  ('Batata Frita G', 'Porção grande de batata frita crocante', 'Acompanhamentos', 24.00, true),
  ('Onion Rings', 'Anéis de cebola empanados e fritos', 'Acompanhamentos', 16.00, true),
  ('Nuggets (10un)', '10 unidades de nuggets de frango', 'Acompanhamentos', 20.00, true),
  ('Coca-Cola Lata', 'Refrigerante Coca-Cola 350ml', 'Bebidas', 6.00, true),
  ('Guaraná Lata', 'Refrigerante Guaraná 350ml', 'Bebidas', 6.00, true),
  ('Suco Natural', 'Suco natural de frutas da estação', 'Bebidas', 8.00, true),
  ('Água Mineral', 'Água mineral 500ml', 'Bebidas', 4.00, true),
  ('Milkshake', 'Milkshake cremoso (chocolate, morango ou baunilha)', 'Sobremesas', 15.00, true),
  ('Sorvete', 'Sorvete artesanal (2 bolas)', 'Sobremesas', 12.00, true)
ON CONFLICT DO NOTHING;
