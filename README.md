# Queueble

Peer tutoring office hours for Texas A&M. TAs open live queues; students from any section of the class join them.

> Not affiliated with Texas A&M University.

## What it does

Queueble helps course staff run office hours without section walls.

- **TAs** open a queue for a class, set location or Zoom, and work through students in order.
- **Students** pick their class, browse live office hours from any section, and join a queue.
- Everyone gets realtime updates when they are next, when a session starts, or when a queue closes.

## How it works

1. Sign in with Google.
2. Choose a class.
3. **Students** join an open queue and wait for a turn.
4. **TAs** manage the waitlist, help students, and close the queue when hours end.

Queues are shared at the class level: a student in section 501 can join a TA from section 502 if that TA’s queue is open.

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS (Vercel) |
| Backend | Express, Socket.IO (Render) |
| Data / Auth | PostgreSQL (Prisma), Supabase Auth |

## Local development

```bash
# API
cd my-app/backend
npm install
npm run dev

# Web
cd my-app/frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173` · API: `http://localhost:3000`

Copy env examples from each package and fill in Supabase, database, and API URLs before running.

## License

Private — all rights reserved.
