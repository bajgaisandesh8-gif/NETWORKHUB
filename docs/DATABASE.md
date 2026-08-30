# NET-LAB — PostgreSQL & Supabase Database Architecture

**Platform:** NET-LAB Interactive Networking Platform  
**Database:** PostgreSQL 15+ / Supabase  
**Creator:** Sandesh Bajgai  

---

## Architecture Principles

1. **Relational Normalization & UUID Keys**: All primary keys use standard UUIDs (`uuid_generate_v4()`).
2. **Row Level Security (RLS)**: Enforces zero-trust data access. Users can only access and modify their private projects, topologies, notes, and lab attempts.
3. **Public Educational Data**: Labs, Protocols, and Quiz Questions are globally readable.
4. **Local-First Synchronization**: If Supabase credentials are not yet configured in `.env`, the client operates seamlessly against localStorage and syncs upon connecting.

---

## Entity Relationship Overview

- `profiles` (User identity & role-based access: `student`, `instructor`, `admin`)
  - 1-to-Many with `saved_topologies`
  - 1-to-Many with `projects`
  - 1-to-Many with `lab_attempts`
  - 1-to-Many with `quiz_attempts`
  - 1-to-Many with `user_achievements`
  - 1-to-Many with `activity_logs`
- `labs` (Structured practical learning modules)
  - 1-to-Many with `lab_attempts`
- `quiz_questions` (Assessment question banks)

---

## Tables and Schema

### `public.profiles`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, FK auth.users(id) | Supabase Auth user reference |
| `email` | TEXT | UNIQUE, NOT NULL | Account email |
| `full_name` | TEXT | | Display name |
| `role` | TEXT | NOT NULL DEFAULT 'student' | student, instructor, or admin |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Timestamp |

### `public.saved_topologies`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK DEFAULT uuid_generate_v4() | Topology identifier |
| `user_id` | UUID | FK profiles(id) | Owner identifier |
| `name` | TEXT | NOT NULL | Topology title |
| `devices` | JSONB | NOT NULL | Serialized network nodes |
| `connections` | JSONB | NOT NULL | Serialized links (Ethernet, Fiber, Wireless) |
| `is_public` | BOOLEAN | NOT NULL DEFAULT FALSE | Community sharing flag |

### `public.projects`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Workspace project ID |
| `user_id` | UUID | FK profiles(id) | Owner ID |
| `name` | TEXT | NOT NULL | Project name |
| `status` | TEXT | CHECK IN ('Planning','Building','Testing','Completed') | Lifecycle phase |
| `topology` | JSONB | | Active attached network diagram |
| `notes` | TEXT | | Engineering documentation |

---

## Migration Steps
Run `/supabase/migrations/001_initial_schema.sql` in the Supabase SQL Editor, followed by `/supabase/seed/seed_data.sql`.
