import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

// Users table - handles students, teachers, owners, and secretaries
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  phone: text('phone').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull(), // 'student', 'teacher', 'owner', 'secretary'
  grade: text('grade'), // nullable, for students: '4-primary', '5-primary', '6-primary', '1-preparatory', '2-preparatory', '3-preparatory', '1-secondary', '2-secondary', '3-secondary'
  name: text('name').notNull(),
  age: integer('age'), // nullable, age of user
  subjects: text('subjects'), // nullable, comma-separated subjects for teachers
  teacherId: integer('teacher_id').references(() => users.id), // nullable, for secretaries - the teacher they work with
  subscriptionType: text('subscription_type'), // nullable, subscription type: 'free', 'premium', 'premium_plus'
  subscriptionExpiresAt: text('subscription_expires_at'), // nullable, when subscription expires
  parentPhone: text('parent_phone'), // nullable, parent contact information
  centerName: text('center_name'), // nullable, for teachers who are centers
  groupName: text('group_name'), // nullable, for teachers who belong to a group
  profileImage: text('profile_image'), // nullable, profile image URL for teachers
  heroImage: text('hero_image'), // nullable, hero/cover image URL for teachers
  bio: text('bio'), // nullable, user bio/description
  isBanned: integer('is_banned', { mode: 'boolean' }).notNull().default(false),
  bannedUntil: text('banned_until'), // nullable, when ban expires (null = permanent)
  banReason: text('ban_reason'), // nullable, reason for ban
  createdAt: text('created_at').notNull(),
});

// Secretary access codes - for secretary registration
export const secretaryAccessCodes = sqliteTable('secretary_access_codes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  secretaryName: text('secretary_name').notNull(),
  teacherId: integer('teacher_id').notNull().references(() => users.id),
  used: integer('used', { mode: 'boolean' }).notNull().default(false),
  usedByUserId: integer('used_by_user_id').references(() => users.id),
  createdAt: text('created_at').notNull(),
});

// Teacher access codes - for teacher registration
export const teacherAccessCodes = sqliteTable('teacher_access_codes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  teacherName: text('teacher_name').notNull(),
  used: integer('used', { mode: 'boolean' }).notNull().default(false),
  usedByUserId: integer('used_by_user_id').references(() => users.id),
  createdByOwnerId: integer('created_by_owner_id').notNull().references(() => users.id),
  createdAt: text('created_at').notNull(),
});

// Lesson access codes - for specific lesson access
export const lessonAccessCodes = sqliteTable('lesson_access_codes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  lessonId: integer('lesson_id').notNull().references(() => lessons.id),
  teacherId: integer('teacher_id').notNull().references(() => users.id),
  studentId: integer('student_id').references(() => users.id),
  used: integer('used', { mode: 'boolean' }).notNull().default(false),
  expiresAt: text('expires_at'),
  createdAt: text('created_at').notNull(),
});

// Center access codes - for centers to register as teachers
export const centerAccessCodes = sqliteTable('center_access_codes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  centerName: text('center_name').notNull(),
  used: integer('used', { mode: 'boolean' }).notNull().default(false),
  usedByUserId: integer('used_by_user_id').references(() => users.id),
  createdByOwnerId: integer('created_by_owner_id').notNull().references(() => users.id),
  createdAt: text('created_at').notNull(),
});

// Lesson folders - organize lessons by teacher and grade
export const lessonFolders = sqliteTable('lesson_folders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  teacherId: integer('teacher_id').notNull().references(() => users.id),
  grade: text('grade').notNull(),
  coverImage: text('cover_image'), // nullable, cover image URL for the folder/course
  subscriptionPrice: integer('subscription_price').default(150), // monthly price in EGP, default 150
  createdAt: text('created_at').notNull(),
});

// Lessons - main content with free/paid flag
export const lessons = sqliteTable('lessons', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  folderId: integer('folder_id').notNull().references(() => lessonFolders.id),
  teacherId: integer('teacher_id').notNull().references(() => users.id),
  videoUrl: text('video_url'),
  studyPdfUrl: text('study_pdf_url'),
  homeworkPdfUrl: text('homework_pdf_url'),
  lessonNotes: text('lesson_notes'),
  grade: text('grade').notNull(),
  isFree: integer('is_free', { mode: 'boolean' }).notNull().default(false),
  coverImage: text('cover_image'), // nullable, cover image for the lesson
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Video transcripts - AI-generated from lessons
export const videoTranscripts = sqliteTable('video_transcripts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  lessonId: integer('lesson_id').notNull().unique().references(() => lessons.id),
  transcriptText: text('transcript_text').notNull(),
  processingStatus: text('processing_status').notNull(), // 'pending', 'processing', 'completed', 'failed'
  createdAt: text('created_at').notNull(),
});

// AI summaries - generated from transcripts
export const aiSummaries = sqliteTable('ai_summaries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  lessonId: integer('lesson_id').notNull().unique().references(() => lessons.id),
  summaryText: text('summary_text').notNull(),
  createdAt: text('created_at').notNull(),
});

// Flashcards - manual or AI-generated
export const flashcards = sqliteTable('flashcards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  lessonId: integer('lesson_id').notNull().references(() => lessons.id),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  explanation: text('explanation'),
  type: text('type').notNull(), // 'manual', 'ai'
  createdByTeacherId: integer('created_by_teacher_id').references(() => users.id),
  createdAt: text('created_at').notNull(),
});

// Homework questions - multiple choice
export const homeworkQuestions = sqliteTable('homework_questions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  lessonId: integer('lesson_id').notNull().references(() => lessons.id),
  questionText: text('question_text').notNull(),
  optionA: text('option_a').notNull(),
  optionB: text('option_b').notNull(),
  optionC: text('option_c').notNull(),
  optionD: text('option_d').notNull(),
  correctAnswer: text('correct_answer').notNull(), // 'a', 'b', 'c', 'd'
  explanation: text('explanation'),
  createdAt: text('created_at').notNull(),
});

// Student progress tracking
export const studentProgress = sqliteTable('student_progress', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studentId: integer('student_id').notNull().references(() => users.id),
  lessonId: integer('lesson_id').notNull().references(() => lessons.id),
  videoWatched: integer('video_watched', { mode: 'boolean' }).notNull().default(false),
  homeworkCompleted: integer('homework_completed', { mode: 'boolean' }).notNull().default(false),
  homeworkScore: integer('homework_score'),
  lastAccessed: text('last_accessed').notNull(),
  createdAt: text('created_at').notNull(),
});

// Subscriptions table - student subscriptions to lesson folders
export const subscriptions = sqliteTable('subscriptions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studentId: integer('student_id').notNull().references(() => users.id),
  folderId: integer('folder_id').notNull().references(() => lessonFolders.id),
  subscriptionType: text('subscription_type').notNull(), // 'free_trial', 'premium', 'premium_plus', 'owner_granted'
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  paymentMethod: text('payment_method'), // 'vodafone_cash', 'fawry', 'instapay', 'owner_granted'
  paymentScreenshotUrl: text('payment_screenshot_url'),
  monthlyPrice: integer('monthly_price'),
  grantedByOwnerId: integer('granted_by_owner_id').references(() => users.id),
  createdAt: text('created_at').notNull(),
});

// Ratings table - student ratings for teachers
export const ratings = sqliteTable('ratings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studentId: integer('student_id').notNull().references(() => users.id),
  teacherId: integer('teacher_id').notNull().references(() => users.id),
  folderId: integer('folder_id').notNull().references(() => lessonFolders.id),
  rating: integer('rating').notNull(), // 1-5
  reviewText: text('review_text'),
  createdAt: text('created_at').notNull(),
});

// Notifications table - student notifications
export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studentId: integer('student_id').notNull().references(() => users.id),
  lessonId: integer('lesson_id').references(() => lessons.id),
  notificationType: text('notification_type').notNull(), // 'new_lesson', 'subscription_expiring', 'payment_approved'
  message: text('message').notNull(),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
});

// Exam questions table - questions for exams
export const examQuestions = sqliteTable('exam_questions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  lessonId: integer('lesson_id').notNull().references(() => lessons.id),
  questionText: text('question_text').notNull(),
  optionA: text('option_a').notNull(),
  optionB: text('option_b').notNull(),
  optionC: text('option_c').notNull(),
  optionD: text('option_d').notNull(),
  correctAnswer: text('correct_answer').notNull(), // 'a', 'b', 'c', 'd'
  explanation: text('explanation'),
  questionOrder: integer('question_order').notNull(),
  createdAt: text('created_at').notNull(),
});

// Exam attempts table - student exam attempts
export const examAttempts = sqliteTable('exam_attempts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studentId: integer('student_id').notNull().references(() => users.id),
  lessonId: integer('lesson_id').notNull().references(() => lessons.id),
  score: integer('score').notNull(),
  totalQuestions: integer('total_questions').notNull(),
  answersJson: text('answers_json').notNull(), // JSON string
  createdAt: text('created_at').notNull(),
});

// Payment requests table - student payment requests
export const paymentRequests = sqliteTable('payment_requests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studentId: integer('student_id').notNull().references(() => users.id),
  folderId: integer('folder_id').notNull().references(() => lessonFolders.id),
  subscriptionType: text('subscription_type').notNull(), // 'premium', 'premium_plus'
  paymentMethod: text('payment_method').notNull(), // 'vodafone_cash', 'fawry', 'instapay'
  amount: integer('amount').notNull(),
  screenshotUrl: text('screenshot_url').notNull(),
  status: text('status').notNull().default('pending'), // 'pending', 'approved', 'rejected'
  ownerNote: text('owner_note'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Teacher uploads table - store uploaded files (videos, PDFs, homework)
export const teacherUploads = sqliteTable('teacher_uploads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  teacherId: integer('teacher_id').notNull().references(() => users.id),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(), // 'video', 'pdf', 'homework'
  fileSize: integer('file_size').notNull(), // in bytes
  filePath: text('file_path').notNull(), // relative path to file
  fileUrl: text('file_url').notNull(), // full URL
  mimeType: text('mime_type'),
  createdAt: text('created_at').notNull(),
});

// Lesson comments - student comments on lessons
export const lessonComments = sqliteTable('lesson_comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  lessonId: integer('lesson_id').notNull().references(() => lessons.id),
  studentId: integer('student_id').notNull().references(() => users.id),
  commentText: text('comment_text').notNull(),
  createdAt: text('created_at').notNull(),
});

// Secretary permissions - what each secretary can do for a teacher
export const secretaryPermissions = sqliteTable('secretary_permissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  secretaryId: integer('secretary_id').notNull().references(() => users.id),
  teacherId: integer('teacher_id').notNull().references(() => users.id),
  canCreateFlashcards: integer('can_create_flashcards', { mode: 'boolean' }).notNull().default(false),
  canCreateHomework: integer('can_create_homework', { mode: 'boolean' }).notNull().default(false),
  canCreateExams: integer('can_create_exams', { mode: 'boolean' }).notNull().default(false),
  canEditLessons: integer('can_edit_lessons', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Live sessions table - for teacher live/zoom sessions
export const liveSessions = sqliteTable('live_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  teacherId: integer('teacher_id').notNull().references(() => users.id),
  folderId: integer('folder_id').notNull().references(() => lessonFolders.id),
  title: text('title').notNull(),
  description: text('description'),
  zoomLink: text('zoom_link').notNull(),
  isFree: integer('is_free', { mode: 'boolean' }).notNull().default(false),
  scheduledAt: text('scheduled_at').notNull(),
  status: text('status').notNull().default('scheduled'), // 'scheduled', 'live', 'ended'
  createdAt: text('created_at').notNull(),
});

// Live attendance table - for tracking student attendance in live sessions
export const liveAttendance = sqliteTable('live_attendance', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  liveSessionId: integer('live_session_id').notNull().references(() => liveSessions.id),
  studentId: integer('student_id').notNull().references(() => users.id),
  joinedAt: text('joined_at').notNull(),
  createdAt: text('created_at').notNull(),
});

// Add new payments table at the end
export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  folderId: integer('folder_id').notNull().references(() => lessonFolders.id),
  merchantOrderId: text('merchant_order_id').notNull().unique(),
  provider: text('provider').notNull(), // 'paymob' or 'fawry'
  providerReferenceNumber: text('provider_reference_number'),
  providerTransactionId: text('provider_transaction_id'),
  amount: integer('amount').notNull(), // amount in piastres (cents)
  currency: text('currency').notNull().default('EGP'),
  paymentMethod: text('payment_method'), // 'CARD', 'WALLET', 'FAWRY', 'PAYATFAWRY'
  status: text('status').notNull().default('pending'), // 'pending', 'paid', 'failed', 'expired', 'cancelled'
  webhookReceived: integer('webhook_received', { mode: 'boolean' }).notNull().default(false),
  webhookReceivedAt: text('webhook_received_at'),
  paymentCompletedAt: text('payment_completed_at'),
  subscriptionType: text('subscription_type').notNull(), // 'premium', 'premium_plus'
  metadata: text('metadata', { mode: 'json' }),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});