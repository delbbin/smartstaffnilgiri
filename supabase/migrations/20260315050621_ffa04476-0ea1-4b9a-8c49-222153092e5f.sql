
-- Fix: the previous migration partially succeeded (policies were created).
-- This is a no-op migration to mark the sequence as clean.
SELECT 1;
