-- pg_notify triggers for realtime SSE
-- Run this after schema creation: psql crm -f packages/database/src/triggers.sql

-- Messages: notify on insert/update
CREATE OR REPLACE FUNCTION notify_messages_change() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('messages', json_build_object(
    'operation', TG_OP,
    'id', NEW.id,
    'contact_id', NEW.contact_id,
    'direction', NEW.direction,
    'channel', NEW.channel
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS messages_notify ON messages;
CREATE TRIGGER messages_notify
  AFTER INSERT OR UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_messages_change();

-- Notifications: notify on insert
CREATE OR REPLACE FUNCTION notify_notifications_change() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('notifications', json_build_object(
    'operation', TG_OP,
    'id', NEW.id,
    'user_id', NEW.user_id,
    'type', NEW.type,
    'title', NEW.title
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notifications_notify ON notifications;
CREATE TRIGGER notifications_notify
  AFTER INSERT ON notifications
  FOR EACH ROW EXECUTE FUNCTION notify_notifications_change();

-- Projects: notify on insert/update
CREATE OR REPLACE FUNCTION notify_projects_change() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('projects', json_build_object(
    'operation', TG_OP,
    'id', NEW.id,
    'contact_id', NEW.contact_id,
    'stage_id', NEW.stage_id,
    'job_type', NEW.job_type
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS projects_notify ON projects;
CREATE TRIGGER projects_notify
  AFTER INSERT OR UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION notify_projects_change();
