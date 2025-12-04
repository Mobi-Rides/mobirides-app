-- RPC for host-initiated wallet top-up and withdrawal with validation

CREATE OR REPLACE FUNCTION public.wallet_topup(
  p_amount NUMERIC,
  p_payment_method TEXT DEFAULT NULL,
  p_payment_reference TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_host_id UUID := auth.uid();
  v_wallet_id UUID;
  v_balance_before NUMERIC;
  v_balance_after NUMERIC;
  v_tx_id UUID;
BEGIN
  IF v_host_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'not_authenticated');
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'invalid_amount');
  END IF;

  -- Ensure wallet exists
  SELECT id, balance INTO v_wallet_id, v_balance_before FROM public.host_wallets WHERE host_id = v_host_id;
  IF v_wallet_id IS NULL THEN
    INSERT INTO public.host_wallets (host_id)
    VALUES (v_host_id)
    RETURNING id, balance INTO v_wallet_id, v_balance_before;
  END IF;

  v_balance_after := v_balance_before + p_amount;

  -- Update wallet balance
  UPDATE public.host_wallets SET balance = v_balance_after, updated_at = now() WHERE id = v_wallet_id;

  -- Record transaction as credit
  INSERT INTO public.wallet_transactions (
    id, wallet_id, transaction_type, amount, balance_before, balance_after, description, metadata
  ) VALUES (
    gen_random_uuid(), v_wallet_id, 'credit', p_amount, v_balance_before, v_balance_after,
    COALESCE('Wallet top-up via ' || COALESCE(p_payment_method, 'unknown'), 'Wallet top-up'),
    jsonb_strip_nulls(jsonb_build_object('payment_method', p_payment_method, 'payment_reference', p_payment_reference))
  ) RETURNING id INTO v_tx_id;

  PERFORM public.log_audit_event(
    p_event_type := 'payment_refunded_admin',
    p_severity := 'low',
    p_actor_id := v_host_id,
    p_action_details := jsonb_build_object('action', 'wallet_topup', 'amount', p_amount, 'wallet_id', v_wallet_id)
  );

  RETURN json_build_object('success', true, 'wallet_id', v_wallet_id, 'balance', v_balance_after, 'transaction_id', v_tx_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.wallet_topup(NUMERIC, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.wallet_withdraw(
  p_amount NUMERIC,
  p_description TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_host_id UUID := auth.uid();
  v_wallet_id UUID;
  v_balance_before NUMERIC;
  v_balance_after NUMERIC;
  v_tx_id UUID;
BEGIN
  IF v_host_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'not_authenticated');
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'invalid_amount');
  END IF;

  SELECT id, balance INTO v_wallet_id, v_balance_before FROM public.host_wallets WHERE host_id = v_host_id;
  IF v_wallet_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'wallet_not_found');
  END IF;

  IF v_balance_before < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'insufficient_balance');
  END IF;

  v_balance_after := v_balance_before - p_amount;

  UPDATE public.host_wallets SET balance = v_balance_after, updated_at = now() WHERE id = v_wallet_id;

  -- Record transaction as debit/withdrawal
  INSERT INTO public.wallet_transactions (
    id, wallet_id, transaction_type, amount, balance_before, balance_after, description
  ) VALUES (
    gen_random_uuid(), v_wallet_id, 'withdrawal', p_amount, v_balance_before, v_balance_after,
    COALESCE(p_description, 'Wallet withdrawal')
  ) RETURNING id INTO v_tx_id;

  PERFORM public.log_audit_event(
    p_event_type := 'payment_refunded_admin',
    p_severity := 'low',
    p_actor_id := v_host_id,
    p_action_details := jsonb_build_object('action', 'wallet_withdraw', 'amount', p_amount, 'wallet_id', v_wallet_id)
  );

  RETURN json_build_object('success', true, 'wallet_id', v_wallet_id, 'balance', v_balance_after, 'transaction_id', v_tx_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.wallet_withdraw(NUMERIC, TEXT) TO authenticated;

