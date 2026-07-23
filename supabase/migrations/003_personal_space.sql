-- LifeDeck Migration 003: Add personal flag to spaces
-- Creates the personal BOOLEAN column for identifying user-private spaces.

ALTER TABLE public.spaces ADD COLUMN IF NOT EXISTS personal BOOLEAN NOT NULL DEFAULT FALSE;
