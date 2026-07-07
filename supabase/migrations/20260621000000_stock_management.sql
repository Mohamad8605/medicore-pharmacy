CREATE OR REPLACE FUNCTION public.decrement_stock(p_id UUID, p_quantity INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_stock INT;
BEGIN
  UPDATE public.medications
    SET stock = stock - p_quantity
    WHERE id = p_id AND stock >= p_quantity
    RETURNING stock INTO v_new_stock;

  IF v_new_stock IS NULL THEN
    RAISE EXCEPTION 'Insufficient stock for medication %', p_id USING ERRCODE = 'P0002';
  END IF;

  RETURN v_new_stock;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_stock(p_id UUID, p_quantity INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_stock INT;
BEGIN
  UPDATE public.medications
    SET stock = stock + p_quantity
    WHERE id = p_id
    RETURNING stock INTO v_new_stock;

  RETURN v_new_stock;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_stock(UUID, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_stock(UUID, INT) TO anon, authenticated;
