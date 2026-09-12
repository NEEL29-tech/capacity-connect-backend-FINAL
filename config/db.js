/**
 * PostgreSQL Database Connection Pool
 * Capacity Connect LMS (SIH26075)
 * Architecture: routes -> controllers -> services -> PostgreSQL pool
 */

require('dotenv').config();

const { Pool: PgPool } = require('pg');
const { newDb } = require('pg-mem');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

let pool;
let isPgMem = false;

/**
 * Create embedded PostgreSQL-compatible database
 * Used only when DATABASE_URL is not configured.
 */
function createPgMemPool() {
  const memDb = newDb({
    autoCreateForeignKeyIndices: true
  });

  // Register SQL functions
  memDb.public.registerFunction({
    name: 'gen_random_uuid',
    implementation: () => require('crypto').randomUUID()
  });

  memDb.public.registerFunction({
    name: 'now',
    implementation: () => new Date()
  });

  memDb.public.registerFunction({
    name: 'current_timestamp',
    implementation: () => new Date()
  });

  memDb.public.registerFunction({
    name: 'trim',
    implementation: (str) =>
      typeof str === 'string' ? str.trim() : str
  });

  memDb.public.registerFunction({
    name: 'lower',
    implementation: (str) =>
      typeof str === 'string' ? str.toLowerCase() : str
  });

  memDb.public.registerFunction({
    name: 'upper',
    implementation: (str) =>
      typeof str === 'string' ? str.toUpperCase() : str
  });

  memDb.public.registerFunction({
    name: 'round',
    implementation: (num, decimals = 2) => {
      const n = Number(num);
      return isNaN(n) ? 0 : Number(n.toFixed(decimals));
    }
  });

  memDb.public.registerFunction({
    name: 'coalesce',
    implementation: (...args) =>
      args.find((a) => a !== null && a !== undefined)
  });

  // Read and execute schema
  const schemaPath = path.resolve(
    __dirname,
    '..',
    'database',
    'schema.sql'
  );

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  try {
    memDb.public.none(schemaSql);
  } catch (err) {
    console.error(
      '[DB] Error loading schema into in-memory PostgreSQL:',
      err
    );
  }

  const { Pool } = memDb.adapters.createPg();

  const memPool = new Pool();

  isPgMem = true;

  return memPool;
}

/**
 * PostgreSQL connection
 *
 * DATABASE_URL example:
 * postgresql://postgres:password@localhost:5432/capacity_connect
 */

const hasExternalDb = Boolean(
  process.env.DATABASE_URL &&
  process.env.DATABASE_URL.startsWith('postgres')
);

if (hasExternalDb) {
  pool = new PgPool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false
  });

  isPgMem = false;

  console.log('[DB] Configured external PostgreSQL connection pool');
} else {
  console.log(
    '[DB] Initializing embedded PostgreSQL engine with all 18 tables'
  );

  pool = createPgMemPool();
}

/**
 * Test PostgreSQL connection
 */
async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW() AS currentTime');

    console.log(
      `[DB] Database connection successful${
        isPgMem ? ' (pg-mem)' : ' (PostgreSQL)'
      }`
    );

    return result.rows[0];
  } catch (err) {
    console.error('[DB] Database connection failed:', err.message);
    throw err;
  }
}

/**
 * Seed initial data
 */
async function seedInitialData() {
  try {
    const userCheck = await pool.query(
      'SELECT COUNT(*) AS count FROM users'
    );

    if (parseInt(userCheck.rows[0].count, 10) > 0) {
      console.log('[DB] Existing data found. Skipping seed.');
      return;
    }

    console.log('[DB] Seeding initial database records...');

    const learnerHash = await bcrypt.hash('learner123', 10);
    const trainerHash = await bcrypt.hash('trainer123', 10);
    const adminHash = await bcrypt.hash('admin123', 10);

    // 1. Users
    await pool.query(
      `
      INSERT INTO users
        (name, email, password_hash, role, bio)
      VALUES
        (
          'Test Learner',
          'learner@test.com',
          $1,
          'LEARNER',
          'Enthusiastic digital learner expanding skills in web and data.'
        ),
        (
          'Prof. Rajesh Sharma',
          'trainer@test.com',
          $2,
          'TRAINER',
          'Lead Instructor & Systems Architect.'
        ),
        (
          'System Administrator',
          'admin@test.com',
          $3,
          'ADMIN',
          'Capacity Connect Portal Super Admin'
        )
      `,
      [learnerHash, trainerHash, adminHash]
    );

    // 2. Competencies
    await pool.query(`
      INSERT INTO competencies
        (name, description, category)
      VALUES
        (
          'JavaScript',
          'Modern ECMAScript, closures, async programming, and DOM APIs',
          'TECHNICAL'
        ),
        (
          'Node.js & Express',
          'Backend RESTful API development, middleware, and architecture',
          'TECHNICAL'
        ),
        (
          'PostgreSQL & SQL',
          'Relational database schema design, querying, indexing, and transactions',
          'TECHNICAL'
        ),
        (
          'React & Frontend Architecture',
          'Component lifecycle, hooks, state management, and modern UI',
          'TECHNICAL'
        ),
        (
          'DevOps & Docker',
          'Containerization, CI/CD pipelines, and environment management',
          'DEVOPS'
        ),
        (
          'System Architecture & Cloud',
          'Scalable distributed systems, caching, and microservices',
          'ARCHITECTURE'
        ),
        (
          'Professional Communication',
          'Technical documentation, team collaboration, and client interactions',
          'SOFT_SKILL'
        )
    `);

    // 3. Courses
    await pool.query(`
      INSERT INTO courses
        (title, description, category, level, trainer_id, is_published)
      VALUES
        (
          'Full Stack Web Development & Microservices',
          'Comprehensive digital capacity building course covering Node.js, Express, PostgreSQL, and scalable API design.',
          'Software Engineering',
          'INTERMEDIATE',
          2,
          true
        ),
        (
          'Database Management & Advanced SQL Analytics',
          'In-depth mastery of PostgreSQL relational modeling, indexing, query optimization, and transaction handling.',
          'Data Engineering',
          'BEGINNER',
          2,
          true
        ),
        (
          'Cloud Infrastructure & DevOps Mastery',
          'Master modern cloud deployment pipelines, containerization with Docker, and CI/CD automation.',
          'Cloud Computing',
          'ADVANCED',
          2,
          true
        )
    `);

    // 4. Course Competencies
    await pool.query(`
      INSERT INTO course_competencies
        (course_id, competency_id, required_level)
      VALUES
        (1, 1, 'INTERMEDIATE'),
        (1, 2, 'INTERMEDIATE'),
        (1, 3, 'INTERMEDIATE'),
        (2, 3, 'ADVANCED'),
        (3, 5, 'ADVANCED'),
        (3, 6, 'ADVANCED')
    `);

    // 5. Learner Competencies
    await pool.query(`
      INSERT INTO learner_competencies
        (user_id, competency_id, proficiency_level, acquired_from)
      VALUES
        (1, 1, 'BEGINNER', 'SELF_ASSESSMENT')
    `);

    // 6. Modules
    await pool.query(`
      INSERT INTO modules
        (course_id, title, description, order_index)
      VALUES
        (
          1,
          'Module 1: Backend Architecture Fundamentals',
          'Core concepts of Node.js event loop, Express routing, and middleware.',
          1
        ),
        (
          1,
          'Module 2: PostgreSQL Integration & Relational Design',
          'Connecting pg pool, writing safe parameterized queries, and transactions.',
          2
        ),
        (
          1,
          'Module 3: Authentication, Security & JWT',
          'Hashing with bcrypt, role-based authorization, and token lifecycle.',
          3
        ),
        (
          2,
          'Module 1: Relational Schema Modeling',
          'Entity relationship diagrams, normal forms, and constraints.',
          1
        ),
        (
          2,
          'Module 2: Advanced Query Performance & Indexes',
          'Query planning with EXPLAIN, B-Tree indexes, and optimization.',
          2
        )
    `);

    // 7. Module Contents
    await pool.query(`
      INSERT INTO module_contents
        (
          module_id,
          title,
          content_type,
          content_url,
          content_data,
          order_index
        )
      VALUES
        (
          1,
          'Introduction to Express Routing',
          'ARTICLE',
          'https://example.com/docs/express-routes',
          'Learn how Express matches endpoints and orchestrates middleware pipelines.',
          1
        ),
        (
          1,
          'Architecture Video Lecture',
          'VIDEO',
          'https://example.com/videos/backend-arch.mp4',
          'Video lecture explaining routes -> controllers -> services design.',
          2
        ),
        (
          2,
          'PostgreSQL Pool Best Practices',
          'DOCUMENT',
          'https://example.com/docs/pg-pool.pdf',
          'Guide to connection pooling and resource management.',
          1
        ),
        (
          3,
          'Security Best Practices & OWASP',
          'ARTICLE',
          'https://example.com/docs/security.html',
          'Essential protection against injection, token hijacking, and privilege escalation.',
          1
        )
    `);

    // 8. Enrollments
    await pool.query(`
      INSERT INTO enrollments
        (user_id, course_id, status)
      VALUES
        (1, 1, 'ACTIVE')
    `);

    // 9. Initial Progress
    await pool.query(`
      INSERT INTO learning_progress
        (enrollment_id, module_id, completed, completed_at)
      VALUES
        (1, 1, true, NOW())
    `);

    // 10. Quizzes
    await pool.query(`
      INSERT INTO quizzes
        (
          course_id,
          module_id,
          title,
          description,
          passing_score,
          total_marks,
          time_limit_minutes,
          created_by
        )
      VALUES
        (
          1,
          1,
          'Module 1 Assessment: Backend Core',
          'Test your knowledge on Express middleware, HTTP status codes, and routing.',
          60.0,
          100.0,
          20,
          2
        ),
        (
          1,
          2,
          'Module 2 Assessment: SQL & Database Integrity',
          'Evaluation of queries, ACID properties, and relational constraints.',
          70.0,
          100.0,
          25,
          2
        )
    `);

    // 11. Quiz Questions
    await pool.query(`
      INSERT INTO quiz_questions
        (
          quiz_id,
          question_text,
          question_type,
          options,
          correct_answer,
          marks,
          order_index
        )
      VALUES
        (
          1,
          'What is the primary role of middleware in Express?',
          'MULTIPLE_CHOICE',
          '["Database driver", "Inspect and modify request/response objects", "Frontend UI rendering", "Network socket proxy"]',
          'Inspect and modify request/response objects',
          50.0,
          1
        ),
        (
          1,
          'Which HTTP status code signifies resource creation?',
          'MULTIPLE_CHOICE',
          '["200 OK", "201 Created", "204 No Content", "304 Not Modified"]',
          '201 Created',
          50.0,
          2
        )
    `);

    // 12. Knowledge Resources
    await pool.query(`
      INSERT INTO knowledge_resources
        (
          title,
          description,
          category,
          resource_type,
          url,
          file_size,
          created_by
        )
      VALUES
        (
          'SIH26075 Digital Competency Framework',
          'National capacity building guidelines and skill matrix documentation.',
          'Framework',
          'PDF',
          'https://capacity-connect.gov.in/docs/competency-matrix.pdf',
          '2.4 MB',
          2
        ),
        (
          'PostgreSQL 15 Performance Handbook',
          'Comprehensive guide to query optimization, indexing, and lock management.',
          'Database',
          'DOCUMENT',
          'https://capacity-connect.gov.in/docs/pg-perf.pdf',
          '5.1 MB',
          2
        ),
        (
          'Secure Coding Standards for Public Digital Platforms',
          'Security requirements including OWASP ASVS compliance and auth architecture.',
          'Security',
          'PDF',
          'https://capacity-connect.gov.in/docs/secure-coding.pdf',
          '1.8 MB',
          3
        )
    `);

    // 13. Assignments
    await pool.query(`
      INSERT INTO assignments
        (
          course_id,
          module_id,
          title,
          description,
          due_date,
          max_score,
          created_by
        )
      VALUES
        (
          1,
          1,
          'Milestone Project: RESTful Service Design',
          'Submit architectural design and service implementation for user onboarding.',
          NOW(),
          100.0,
          2
        )
    `);

    // 14. Notifications
    await pool.query(`
      INSERT INTO notifications
        (
          user_id,
          title,
          message,
          type,
          is_read
        )
      VALUES
        (
          1,
          'Welcome to Capacity Connect',
          'Your account has been activated. Start by completing your Skill Gap Assessment.',
          'INFO',
          false
        ),
        (
          1,
          'Course Enrollment Confirmed',
          'You are now enrolled in Full Stack Web Development & Microservices.',
          'SUCCESS',
          false
        )
    `);

    console.log('[DB] Database seeded successfully!');
  } catch (err) {
    console.error('[DB] Seeding error:', err.message);
  }
}

/**
 * Initial database setup
 */
const seedPromise = (async () => {
  await testConnection();
  await seedInitialData();
})();

/**
 * Query helper
 */
async function query(text, params) {
  await seedPromise;
  return pool.query(text, params);
}

module.exports = {
  pool,
  query,
  seedInitialData,
  seedPromise,
  testConnection
};