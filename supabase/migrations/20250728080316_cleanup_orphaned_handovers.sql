-- Clean up orphaned handover sessions for completed bookings
DELETE FROM handover_sessions 
WHERE booking_id IN (
  SELECT b.id 
  FROM bookings b 
  WHERE b.status = 'completed'
  AND b.end_date < CURRENT_DATE
) 
AND handover_completed = false;