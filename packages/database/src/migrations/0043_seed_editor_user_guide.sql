-- Migration: Seed User Guide articles for the Editor role
-- Date: 2026-04-09
-- These are human-facing guides for editors using Studio Manager

-- Getting Started guide for editors
INSERT INTO knowledge_base (tenant_id, category, title, slug, content, tags, search_keywords, published)
SELECT
  t.id,
  'User Guide',
  'Editor — Getting Started',
  'editor-getting-started',
  '# Getting Started as an Editor

Welcome to Studio Manager. As an editor, you''ll use this system to receive editing jobs, track your time, and deliver finished images back to the team.

## Logging In

Go to **sm.macalister.nz** and sign in with the email and password you were given. You''ll land on the **Editing Jobs** dashboard — this is your home base.

## What You''ll See

Your sidebar has two main sections:

- **Editing Jobs** — your work queue (available jobs, your claimed jobs, completed jobs)
- **Galleries** — all client galleries where you can view and upload images

Plus **User Guide** (you''re reading it), **Staff Chat** for messaging the team, and **My Account** for your profile and theme settings.

## The Basics

1. **Jobs appear** when a photographer finishes a shoot and uploads images
2. **You claim** a job from the Available Jobs section
3. **You start** it when you begin working
4. **You complete** it when done, entering your hours worked
5. Your hours feed into your pay and the shoot''s cost tracking

That''s it at the highest level. Read the other guides for details on each step.',
  ARRAY['editor', 'getting-started', 'onboarding'],
  'editor;getting started;login;onboarding;new editor',
  true
FROM tenants t WHERE t.slug = 'macalister'
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- Editing Jobs workflow guide
INSERT INTO knowledge_base (tenant_id, category, title, slug, content, tags, search_keywords, published)
SELECT
  t.id,
  'User Guide',
  'Editor — Editing Jobs Workflow',
  'editor-editing-jobs',
  '# Editing Jobs Workflow

## How Jobs Arrive

When a photographer finishes a shoot, they click **Mark as Shot** on the project, then **Photos Uploaded** once images are in the shared location. This creates an editing job and you''ll receive a notification.

## Job Types

### Portraits (and other non-wedding genres)

Portrait shoots have two editing phases:

1. **Initial Edit** — first pass editing after the shoot
2. **Final Retouch** — retouching selected images after the client has ordered

### Weddings (4-stage pipeline)

Wedding editing has four stages. When you complete one, the next is automatically created:

1. **Sneak Peek Selection** — choose the best images for the sneak peek set
2. **Sneak Peek Edit** — edit those selected sneak peek images
3. **Culling** — cull the full wedding image set
4. **Full Edit** — complete edit and retouching of the full set

## Job Lifecycle

Each job follows this flow:

**Pending** → **Claimed** → **In Progress** → **Completed**

### Claiming a Job

On your Editing Jobs dashboard, unclaimed jobs appear in the **Available Jobs** section. Click **Claim** to take ownership. Once claimed, only you can see and work on that job.

### Starting a Job

After claiming, click **Start** when you begin working. This moves the job to In Progress.

### Completing a Job

When finished, click **Complete**. You''ll be asked to enter the hours and minutes you worked. This is important — it feeds into your pay calculation and the project''s cost tracking.

## Viewing a Project

Each job card has a "View project" link that takes you to the project detail page. The **Editing** tab there shows all editing jobs for that shoot, including the wedding pipeline progress if applicable.',
  ARRAY['editor', 'jobs', 'workflow', 'wedding', 'portrait'],
  'editing jobs;workflow;claim;start;complete;wedding pipeline;portrait;sneak peek;culling;retouch',
  true
FROM tenants t WHERE t.slug = 'macalister'
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- Time tracking guide
INSERT INTO knowledge_base (tenant_id, category, title, slug, content, tags, search_keywords, published)
SELECT
  t.id,
  'User Guide',
  'Editor — Time Tracking',
  'editor-time-tracking',
  '# Time Tracking

Your editing hours are tracked in Studio Manager. This feeds into your fortnightly pay and the cost recorded against each shoot.

## Using the Timer

The Editing Jobs dashboard has a built-in timer:

1. **Select jobs** — tick the checkbox next to one or more of your active jobs
2. **Click Start** — the timer begins and shows elapsed time at the top of the page
3. **Work on your editing** — the timer runs in the background
4. **Click Stop Timer** — the elapsed time is calculated and split across the selected jobs

### Multiple Jobs at Once

If you select multiple jobs before starting the timer, the time is split equally between them. For example, if you work 2 hours with 2 jobs selected, each job gets 1 hour logged.

## Manual Time Entry

When you complete a job, you enter hours and minutes in the completion form. This is added on top of any timer entries for that job.

## What Feeds Into Pay

Your total hours for the pay period are calculated from all completed jobs. Each job records:

- **Minutes worked** — total from timer + manual entry
- **Hourly rate** — set when the job is created

Your pay = sum of (minutes worked / 60 x hourly rate) across all jobs in the period.',
  ARRAY['editor', 'time-tracking', 'timer', 'pay'],
  'time tracking;timer;hours;pay;rate;fortnightly',
  true
FROM tenants t WHERE t.slug = 'macalister'
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- Gallery access guide
INSERT INTO knowledge_base (tenant_id, category, title, slug, content, tags, search_keywords, published)
SELECT
  t.id,
  'User Guide',
  'Editor — Working with Galleries',
  'editor-galleries',
  '# Working with Galleries

As an editor, you have full access to all client galleries. This lets you view the images you''re working on and upload finished edits when needed.

## Viewing Galleries

Click **Galleries** in the sidebar to see all galleries. You can:

- Browse published and draft galleries
- Search by gallery title
- Click into any gallery to see its photos

## Uploading Photos

Some jobs require you to upload finished images directly to a gallery:

1. Open the gallery from the Galleries list
2. Switch to the **Photos** tab
3. Use the upload area to drag and drop your edited images
4. Images are automatically optimised (resized, compressed) on upload

## Tips

- Galleries are organised by client — check the gallery title to match it to your editing job
- Each gallery can have multiple sections (e.g. "Ceremony", "Reception")
- If you''re unsure which gallery to upload to, check with the team via Staff Chat',
  ARRAY['editor', 'galleries', 'upload', 'photos'],
  'galleries;upload;photos;images;view;browse',
  true
FROM tenants t WHERE t.slug = 'macalister'
ON CONFLICT (tenant_id, slug) DO NOTHING;
