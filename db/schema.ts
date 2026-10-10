import {index,integer,sqliteTable,text} from 'drizzle-orm/sqlite-core';

export const extensionPairCodes=sqliteTable('extension_pair_codes',{
  codeHash:text('code_hash').primaryKey(),
  userId:text('user_id').notNull(),
  expiresAt:integer('expires_at').notNull(),
  createdAt:integer('created_at').notNull(),
});

export const extensionDevices=sqliteTable('extension_devices',{
  id:text('id').primaryKey(),
  tokenHash:text('token_hash').notNull().unique(),
  userId:text('user_id').notNull(),
  label:text('label').notNull(),
  createdAt:integer('created_at').notNull(),
  lastSeenAt:integer('last_seen_at').notNull(),
  revokedAt:integer('revoked_at'),
});

export const emailAlerts=sqliteTable('email_alerts',{
  id:text('id').primaryKey(),
  userId:text('user_id').notNull(),
  sender:text('sender').notNull(),
  subject:text('subject').notNull(),
  riskScore:integer('risk_score').notNull(),
  signals:text('signals').notNull(),
  source:text('source').notNull(),
  createdAt:integer('created_at').notNull(),
  updatedAt:integer('updated_at').notNull(),
  reviewedAt:integer('reviewed_at'),
});

export const campaignReports=sqliteTable('campaign_reports',{
  id:text('id').primaryKey(),
  reporterId:text('reporter_id').notNull(),
  host:text('host').notNull(),
  channel:text('channel').notNull(),
  createdAt:integer('created_at').notNull(),
  updatedAt:integer('updated_at').notNull(),
},table=>[index('campaign_reports_host_idx').on(table.host),index('campaign_reports_reporter_idx').on(table.reporterId)]);
