# SlotSync — Campus Resource Booking

## Project Name

SlotSync

## Problem Statement

Campus labs, study rooms, and sports facilities are often reserved through fragmented processes that make availability hard to check and simultaneous booking conflicts easy to create.

## Target Users

- **Students:** discover facilities, reserve hourly slots, cancel bookings, and join waitlists.
- **Campus administrators:** maintain the facility catalog, inspect reservations, and cancel bookings when needed.

## Solution

SlotSync is a campus resource booking app with authenticated student and administrator views. Students see date-based availability and book one-hour slots. MongoDB enforces one confirmed booking per resource, date, and hour, including concurrent attempts. When a booking is cancelled, the oldest eligible waitlisted student is promoted and notified.

## Key Features

- Student and administrator accounts with role-protected admin pages and actions.
- Search and filter active facilities by name, location, and type.
- Hourly availability from 08:00 to 20:00, with past slots disabled.
- Maximum of two confirmed bookings per student per day.
- Database-enforced prevention of double booking.
- Per-slot FIFO waitlists, automatic promotion, and in-app notifications.
- Booking cancellation, admin facility CRUD, activation controls, and reservation feed.

## Tech Stack

- Next.js 14 App Router and React 18
- TypeScript and Tailwind CSS
- MongoDB Atlas or local MongoDB with Mongoose
- `bcryptjs` password hashing and `jose` signed JWT sessions in HTTP-only cookies
- Lucide React icons
- Vercel deployment

## Architecture

### Components

- **App Router pages** render the catalog, resource availability, personal bookings, and admin dashboard.
- **Client components** provide filters, slot selection, forms, modals, notification interactions, and pending/error feedback.
- **Server actions** in `lib/actions` validate sessions, authorization, input, and business rules before changing data.
- **Mongoose models** define users, resources, bookings, waitlist entries, and notifications.
- **MongoDB** stores application data and enforces unique constraints. No external queue or worker is used.

### Preventing double booking

`Booking` has a partial unique index on `{ resourceId, bookingDate, hour }` for documents whose status is `confirmed`. MongoDB checks this constraint atomically, so two simultaneous requests cannot both create a confirmed booking. The losing request receives duplicate-key error `E11000`; the server action returns a conflict response and offers the waitlist.

### Waitlist promotion

When an owner or administrator cancels a confirmed booking, the server action sorts waiting entries for that exact resource/date/hour by `createdAt` ascending. It checks candidates in FIFO order and skips anyone already at the daily confirmed-booking limit. The first eligible candidate receives a confirmed booking, their waiting entry is removed, and an in-app notification is created. The same booking unique index protects the promotion insert from conflicting with another confirmed booking.

## Local Setup

1. Install Node.js (18 or newer) and npm. Start MongoDB locally or create an Atlas database.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local` and set both values (see Environment Variables).
4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000), create a student account, and browse the seeded sample facilities. The first catalog visit inserts sample resources if the resources collection is empty.

Public signup creates student accounts only. To create an administrator, set a user's `role` to `admin` directly in MongoDB using a trusted database session.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB connection string, including database name and credentials for Atlas. Local default example: `mongodb://localhost:27017/slotsync`. |
| `JWT_SECRET` | Yes | Cryptographically random secret of at least 32 characters. Use a different value for each environment. Generate one with `openssl rand -base64 32`. |

Never commit `.env.local` or production secrets. `.env.example` contains placeholders only.

## Deployment

**Live deployment:** _Add your Vercel URL here after deployment._

### Vercel deployment checklist

- [ ] Push the project to the intended Git repository and confirm `.env.local` is ignored.
- [ ] Create/select a Vercel project and configure the correct project root (`END TERM` if this repository is the parent workspace).
- [ ] Provision MongoDB Atlas and create a least-privilege database user.
- [ ] Configure Atlas Network Access for the Vercel deployment. Avoid broad public access where your hosting/network setup permits a narrower rule.
- [ ] Add `MONGODB_URI` and a unique, random `JWT_SECRET` (32+ characters) to Vercel for Production and any Preview environments that need authentication.
- [ ] Set the correct framework/build settings; use `npm run build` and the default Next.js output.
- [ ] Deploy, then test signup/login, session persistence, catalog reads, booking, cancellation, and notification flows against the deployed database.
- [ ] Promote a trusted account to admin directly in MongoDB, then verify admin access and student denial.
- [ ] Add the final deployment URL above and confirm no credentials appear in Git history or deployment logs.

## Manual Test Cases Before Recording the Demo

1. **Signup validation:** submit empty fields, malformed email, short password, and a valid signup. Confirm valid public signup creates a student account even if a crafted request submits `role=admin`.
2. **Duplicate signup and login:** sign up with the same email twice; try a wrong password and a valid login. Check useful errors and that a failed request does not leave the form loading.
3. **Unauthorized access:** open `/admin` as a student and try admin server actions without an admin session. Confirm the page redirects and actions reject the request.
4. **Catalog:** search by facility name/location, filter each type, clear filters, and test a no-results search.
5. **Resource errors:** visit a malformed resource ID and a valid but nonexistent ID. Confirm each gives a clear not-found state.
6. **Availability/date:** browse today and a future date; verify past slots cannot be selected, only 08:00–19:00 start times are offered, and invalid date/hour submissions are rejected.
7. **Booking rules:** book one slot, reload and confirm it remains reserved; attempt to book the same slot from a second account and confirm conflict handling. Attempt more than two bookings in one day.
8. **Waitlist:** join a booked slot, try joining the same queue again, then leave the queue. Confirm queue counts and personal booking views update.
9. **FIFO promotion:** have two students join the same queue, cancel the booking, and verify the oldest eligible student receives the booking and notification. Test that a candidate at the daily limit is skipped for the next eligible candidate.
10. **Cancellation authorization:** cancel your own booking, try cancelling another student's booking, then verify an admin can cancel any confirmed booking.
11. **Admin resource management:** create, edit, deactivate, and reactivate a resource. Confirm deactivated resources disappear for students and cannot be booked.
12. **Network/database failure:** temporarily make MongoDB unreachable, then try catalog, login, booking, and an admin save. Confirm each view/action shows recoverable feedback rather than raw secrets/errors or a stuck spinner.
13. **Notifications:** open the bell with unread items, confirm the badge clears, reload, and confirm read state persists.
14. **Deployment smoke test:** repeat signup, login, one booking, cancellation, and admin denial on the Vercel URL.