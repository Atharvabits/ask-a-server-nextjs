import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
  json,
} from "drizzle-orm/pg-core";

// ─── profiles ────────────────────────────────────────────────────────────────
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  role: text("role").notNull().default("user"),
  displayName: text("display_name"),
  companyName: text("company_name"),
  phone: text("phone"),
  addressStreet: text("address_street"),
  addressCity: text("address_city"),
  addressState: text("address_state"),
  addressZip: text("address_zip"),
  companyDescription: text("company_description"),
  websiteUrl: text("website_url"),
  profilePhotoUrl: text("profile_photo_url"),
  profileVisibility: text("profile_visibility"),
  status: text("status").notNull().default("active"),
  emailVerified: boolean("email_verified").notNull().default(false),
  verificationToken: text("verification_token"),
  verificationSentAt: timestamp("verification_sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── sessions ────────────────────────────────────────────────────────────────
export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── activity_log ─────────────────────────────────────────────────────────────
export const activityLog = pgTable("activity_log", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userEmail: text("user_email"),
  question: text("question"),
  eventType: text("event_type").notNull(),
  stateDetected: text("state_detected"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── chat_sessions ────────────────────────────────────────────────────────────
export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  title: text("title"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── messages ─────────────────────────────────────────────────────────────────
export const messages = pgTable("messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  chatSessionId: uuid("chat_session_id")
    .notNull()
    .references(() => chatSessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── rate_limits ──────────────────────────────────────────────────────────────
export const rateLimits = pgTable("rate_limits", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  ts: numeric("ts").notNull(),
});

// ─── state_laws ───────────────────────────────────────────────────────────────
export const stateLaws = pgTable("state_laws", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  state: text("state").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  addedBy: text("added_by"),
  creditCompany: text("credit_company"),
  creditUserId: uuid("credit_user_id").references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── feedback ─────────────────────────────────────────────────────────────────
export const feedback = pgTable("feedback", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: uuid("user_id").references(() => profiles.id),
  userEmail: text("user_email"),
  state: text("state"),
  title: text("title").notNull(),
  content: text("content").notNull(),
  companyName: text("company_name"),
  status: text("status").notNull().default("pending"),
  declineReason: text("decline_reason"),
  stateLawId: integer("state_law_id").references(() => stateLaws.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── blog_posts ───────────────────────────────────────────────────────────────
export const blogPosts = pgTable("blog_posts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  body: text("body").notNull(),
  photoUrl: text("photo_url"),
  linkUrl: text("link_url"),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  authorId: uuid("author_id").references(() => profiles.id),
  contributorId: uuid("contributor_id").references(() => profiles.id),
  status: text("status").notNull().default("draft"),
  isAdminPost: boolean("is_admin_post").notNull().default(false),
  trainAi: boolean("train_ai").notNull().default(false),
  isPinned: boolean("is_pinned").notNull().default(false),
  score: integer("score").notNull().default(0),
  adminEdited: boolean("admin_edited").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── blog_votes ───────────────────────────────────────────────────────────────
export const blogVotes = pgTable("blog_votes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  postId: integer("post_id")
    .notNull()
    .references(() => blogPosts.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  vote: integer("vote").notNull(),
});

// ─── blog_reports ─────────────────────────────────────────────────────────────
export const blogReports = pgTable("blog_reports", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  postId: integer("post_id")
    .notNull()
    .references(() => blogPosts.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  dismissed: boolean("dismissed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── published_faqs ───────────────────────────────────────────────────────────
export const publishedFaqs = pgTable("published_faqs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  status: text("status").notNull().default("published"),
  sortOrder: integer("sort_order").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

// ─── site_pages ───────────────────────────────────────────────────────────────
export const sitePages = pgTable("site_pages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content"),
  contactInfo: text("contact_info"),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  updatedBy: uuid("updated_by").references(() => profiles.id),
});

// ─── banner_messages ──────────────────────────────────────────────────────────
export const bannerMessages = pgTable("banner_messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  text: text("text").notNull(),
  linkUrl: text("link_url"),
  linkText: text("link_text"),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── company_notes ────────────────────────────────────────────────────────────
export const companyNotes = pgTable("company_notes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  state: text("state").notNull(),
  companyName: text("company_name").notNull(),
  websiteUrl: text("website_url"),
  notes: text("notes"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── app_feedback ─────────────────────────────────────────────────────────────
export const appFeedback = pgTable("app_feedback", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: uuid("user_id").references(() => profiles.id),
  userEmail: text("user_email"),
  description: text("description").notNull(),
  screenshotUrls: json("screenshot_urls"),
  category: text("category").notNull().default("inbox"),
  resolutionSummary: text("resolution_summary"),
  resolvedBy: text("resolved_by"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── app_feedback_comments ────────────────────────────────────────────────────
export const appFeedbackComments = pgTable("app_feedback_comments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  feedbackId: integer("feedback_id")
    .notNull()
    .references(() => appFeedback.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => profiles.id),
  userEmail: text("user_email"),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── admin_messages ───────────────────────────────────────────────────────────
export const adminMessages = pgTable("admin_messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").references(() => profiles.id),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── user_tags ────────────────────────────────────────────────────────────────
export const userTags = pgTable("user_tags", {
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  tag: text("tag").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── widget_keys ──────────────────────────────────────────────────────────────
export const widgetKeys = pgTable("widget_keys", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  widgetKey: text("widget_key").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  userEmail: text("user_email"),
  label: text("label"),
  accentColor: text("accent_color").notNull().default("#0f2b4c"),
  position: text("position").notNull().default("bottom-right"),
  mode: text("mode").notNull().default("light"),
  revoked: boolean("revoked").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── blocked_emails ───────────────────────────────────────────────────────────
export const blockedEmails = pgTable("blocked_emails", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").notNull().unique(),
  blockedBy: text("blocked_by"),
});

// ─── visitor_sessions ─────────────────────────────────────────────────────────
export const visitorSessions = pgTable("visitor_sessions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sessionId: text("session_id").notNull().unique(),
  userId: uuid("user_id").references(() => profiles.id),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  lastActive: timestamp("last_active", { withTimezone: true }),
  totalSeconds: integer("total_seconds").notNull().default(0),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  city: text("city"),
  region: text("region"),
  country: text("country"),
});

// ─── page_views ───────────────────────────────────────────────────────────────
export const pageViews = pgTable("page_views", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: uuid("user_id").references(() => profiles.id),
  sessionToken: text("session_token"),
  page: text("page").notNull(),
  durationSeconds: integer("duration_seconds"),
});

// ─── click_log ────────────────────────────────────────────────────────────────
export const clickLog = pgTable("click_log", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  state: text("state"),
});

// ─── keyword_scores ───────────────────────────────────────────────────────────
export const keywordScores = pgTable("keyword_scores", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  keyword: text("keyword").notNull().unique(),
  category: text("category"),
  score: integer("score").notNull().default(0),
  lastSeen: timestamp("last_seen", { withTimezone: true }),
});

// ─── state_scores ─────────────────────────────────────────────────────────────
export const stateScores = pgTable("state_scores", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  state: text("state").notNull().unique(),
  score: integer("score").notNull().default(0),
  lastSeen: timestamp("last_seen", { withTimezone: true }),
});

// ─── keyword_phrases ──────────────────────────────────────────────────────────
export const keywordPhrases = pgTable("keyword_phrases", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  phrase: text("phrase").notNull(),
  category: text("category"),
  relevanceScore: numeric("relevance_score"),
  hitCount: integer("hit_count").notNull().default(0),
});

// ─── chat_thumbs ──────────────────────────────────────────────────────────────
export const chatThumbs = pgTable("chat_thumbs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: uuid("user_id").references(() => profiles.id),
  chatSessionId: uuid("chat_session_id").references(() => chatSessions.id),
  direction: text("direction").notNull(),
  responseSnippet: text("response_snippet"),
});

// ─── archived_scan_results ────────────────────────────────────────────────────
export const archivedScanResults = pgTable("archived_scan_results", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
});
