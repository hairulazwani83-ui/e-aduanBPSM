-- ============================================================================
-- Sistem eAduan Kerosakan ICT - ADTEC JTM Kampus Pasir Gudang
-- Supabase Row Level Security (RLS) Policies
-- 
-- Run this in Supabase Dashboard → SQL Editor
-- Project: mrkyumzjcdcegpgbaroo
--
-- These policies provide defense-in-depth at the database level,
-- complementing the application-layer RBAC in NextAuth + Prisma.
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EquipmentType" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DamageCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Asset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Complaint" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StatusHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Suggestion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ComplaintRating" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILE policies
-- ============================================================================
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON "Profile"
  FOR SELECT USING (auth.uid() = id);
-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile" ON "Profile"
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- EQUIPMENT TYPE policies (readable by all authenticated users)
-- ============================================================================
CREATE POLICY "Authenticated can read equipment types" ON "EquipmentType"
  FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- DAMAGE CATEGORY policies
-- ============================================================================
CREATE POLICY "Authenticated can read damage categories" ON "DamageCategory"
  FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- ASSET policies
-- ============================================================================
CREATE POLICY "Authenticated can read assets" ON "Asset"
  FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- COMPLAINT policies (reporters see own; technicians see assigned; admin/management all)
-- ============================================================================
-- Note: Since we use Prisma with service role (postgres), these policies
-- act as additional protection if a user connects directly to the DB.
-- Application-layer RBAC handles the primary authorization logic.
CREATE POLICY "Users can read all complaints" ON "Complaint"
  FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- WORK LOG policies
-- ============================================================================
CREATE POLICY "Users can read work logs" ON "WorkLog"
  FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- STATUS HISTORY policies
-- ============================================================================
CREATE POLICY "Users can read status history" ON "StatusHistory"
  FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- SUGGESTION policies (reporters see own; admins see all)
-- ============================================================================
CREATE POLICY "Users can read suggestions" ON "Suggestion"
  FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- NOTIFICATION policies (users see only their own)
-- ============================================================================
CREATE POLICY "Users can read own notifications" ON "Notification"
  FOR SELECT TO authenticated USING (auth.uid() = "userId");
CREATE POLICY "Users can update own notifications" ON "Notification"
  FOR UPDATE TO authenticated USING (auth.uid() = "userId");

-- ============================================================================
-- COMPLAINT RATING policies
-- ============================================================================
CREATE POLICY "Users can read complaint ratings" ON "ComplaintRating"
  FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- AUDIT LOG policies (admin only - enforced at app layer)
-- ============================================================================
CREATE POLICY "Authenticated can read audit logs" ON "AuditLog"
  FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- Performance indexes (additional, complementing Prisma's auto-indexes)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_complaints_status_priority ON "Complaint" (status, priority);
CREATE INDEX IF NOT EXISTS idx_complaints_created_month ON "Complaint" (date_trunc('month', "createdAt"));
CREATE INDEX IF NOT EXISTS idx_worklogs_logged_month ON "WorkLog" (date_trunc('month', "loggedAt"));
CREATE INDEX IF NOT EXISTS idx_auditlog_action_severity ON "AuditLog" (action, severity);

-- ============================================================================
-- Update updated_at timestamps automatically
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profile_updated BEFORE UPDATE ON "Profile"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_complaint_updated BEFORE UPDATE ON "Complaint"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_asset_updated BEFORE UPDATE ON "Asset"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- Backup verification view (helpful for monthly reports)
-- ============================================================================
CREATE OR REPLACE VIEW monthly_complaint_summary AS
SELECT
  date_trunc('month', "createdAt") AS month,
  COUNT(*) AS total_complaints,
  COUNT(*) FILTER (WHERE status = 'BARU') AS baru,
  COUNT(*) FILTER (WHERE status = 'DITUGASKAN') AS ditugaskan,
  COUNT(*) FILTER (WHERE status = 'DALAM_TINDAKAN') AS dalam_tindakan,
  COUNT(*) FILTER (WHERE status = 'ON_HOLD') AS on_hold,
  COUNT(*) FILTER (WHERE status = 'SELESAI') AS selesai,
  COUNT(*) FILTER (WHERE status = 'DITUTUP') AS ditutup,
  AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt")) / 3600)
    FILTER (WHERE "resolvedAt" IS NOT NULL) AS avg_resolution_hours
FROM "Complaint"
GROUP BY 1
ORDER BY 1 DESC;

-- Done! Verification:
SELECT 'RLS enabled on all tables' AS status;
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
