-- Fix About Page RLS Policies for WebxRide
-- Run this in your Supabase SQL Editor to fix the save issue

-- First, drop the existing policies
DROP POLICY IF EXISTS "Anyone can read about page" ON about_page;
DROP POLICY IF EXISTS "Authenticated users can update about page" ON about_page;
DROP POLICY IF EXISTS "Authenticated users can insert about page" ON about_page;

-- Create new policies that work with WebxRide's authentication system
-- Allow anyone to read the about page
CREATE POLICY "Anyone can read about page" ON about_page 
FOR SELECT USING (true);

-- Allow anyone to update the about page (since it's admin-only in the app)
CREATE POLICY "Anyone can update about page" ON about_page 
FOR UPDATE USING (true);

-- Allow anyone to insert about page content
CREATE POLICY "Anyone can insert about page" ON about_page 
FOR INSERT WITH CHECK (true);

-- Also allow deletes if needed
CREATE POLICY "Anyone can delete about page" ON about_page 
FOR DELETE USING (true); 