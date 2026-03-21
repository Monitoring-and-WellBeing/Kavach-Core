DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uk_payment_orders_razorpay_payment_id'
  ) THEN
    ALTER TABLE payment_orders
      ADD CONSTRAINT uk_payment_orders_razorpay_payment_id UNIQUE (razorpay_payment_id);
  END IF;
END
$$;
-- GAP-10 FIXED
