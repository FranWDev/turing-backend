-- Agregar columnas previous_state y new_state a inventory_audit
ALTER TABLE inventory_audit ADD COLUMN IF NOT EXISTS previous_state TEXT;
ALTER TABLE inventory_audit ADD COLUMN IF NOT EXISTS new_state TEXT;

-- Agregar columnas previous_state y new_state a recipe_audit
ALTER TABLE recipe_audit ADD COLUMN IF NOT EXISTS previous_state TEXT;
ALTER TABLE recipe_audit ADD COLUMN IF NOT EXISTS new_state TEXT;
