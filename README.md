# Student Record Management System

A lightweight CRUD application for the Systems Analysis and Design laboratory. It lets a student developer add, view, edit, search, filter, and remove student records stored in Supabase PostgreSQL.

## System design summary

- **System name:** Student Record Management System (Campus Desk)
- **Purpose:** Maintain a simple directory of student information.
- **Users:** Student developer / classroom demonstrator.
- **Inputs:** Student ID, first name, last name, academic program, year level, and email.
- **Process:** Validate form input, then create, read, update, or delete a row in Supabase.
- **Outputs:** A searchable, filterable student directory and record totals.
- **Database:** Supabase PostgreSQL, `public.students`.

## Features

- Create student records with required fields and unique student IDs.
- List records, search across student details, and filter by year level.
- Edit records and confirm before deleting.
- Refresh the page while keeping saved records in the database.

## Developer

Student developer (add your name before submission).

## Database setup

The `public.students` table and its row-level security policy are provisioned for this lab. The demo policy allows anonymous create/read/update/delete access. **Use fictional sample records only; do not store real student information in this public demo.** A production deployment should add Supabase Auth and owner-scoped RLS policies.
