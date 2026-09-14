const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const masterChecklist = require('./checklistData');

let dbDriver = null;
let engineType = 'sqlite';

function calculateScoreFromItems(items) {
  let totalWeight = 0;
  let earnedWeight = 0;
  let passed = 0;
  let failed = 0;
  let notReviewed = 0;
  let criticalRisks = 0;
  let highRisks = 0;
  let mediumRisks = 0;
  let lowRisks = 0;

  for (const item of items) {
    const weight = Number(item.weight) || 5;
    const severity = (item.severity || 'medium').toLowerCase();
    
    if (item.status === 'pass') {
      totalWeight += weight;
      earnedWeight += weight;
      passed++;
    } else if (item.status === 'fail') {
      totalWeight += weight;
      failed++;
      if (severity === 'critical') criticalRisks++;
      else if (severity === 'high') highRisks++;
      else if (severity === 'medium') mediumRisks++;
      else if (severity === 'low') lowRisks++;
    } else {
      notReviewed++;
    }
  }

  const reviewedCount = passed + failed;
  let percentage = 0;
  if (totalWeight > 0) {
    percentage = Math.round((earnedWeight / totalWeight) * 100);
  }

  // Penalty capping for critical vulnerabilities
  if (criticalRisks > 0 && percentage > 50) {
    percentage = Math.min(percentage, 50);
  }

  let rating = 'Not Reviewed';
  if (reviewedCount > 0) {
    if (criticalRisks > 0 || percentage < 50) {
      rating = 'Critical Risk (F)';
    } else if (highRisks > 2 || percentage < 70) {
      rating = 'High Risk (D)';
    } else if (highRisks > 0 || percentage < 85) {
      rating = 'Moderate Risk (C)';
    } else if (percentage < 95) {
      rating = 'Good Posture (B)';
    } else {
      rating = 'Secure / Compliant (A)';
    }
  }

  return {
    overall_score: percentage,
    security_rating: rating,
    total_controls: items.length,
    passed_controls: passed,
    failed_controls: failed,
    not_reviewed_controls: notReviewed,
    critical_risks: criticalRisks,
    high_risks: highRisks,
    medium_risks: mediumRisks,
    low_risks: lowRisks
  };
}

async function getDatabase() {
  if (dbDriver) return dbDriver;

  if (process.env.DATABASE_URL) {
    engineType = 'pg';
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    dbDriver = {
      query: (text, params) => pool.query(text, params),
      type: 'pg'
    };
    console.log('[DB] Using external PostgreSQL connection pool');
  } else {
    engineType = 'sqlite';
    const sqlite3 = require('sqlite3').verbose();
    const dataDir = path.resolve(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = path.join(dataDir, 'security_review.db');

    const sqliteDb = await new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) return reject(err);
        resolve(db);
      });
    });

    // SQLite query compatibility wrapper for standard parameterized queries
    const sqliteQuery = (sql, params = []) => {
      return new Promise((resolve, reject) => {
        // Convert $1, $2 to ? while correctly ordering params
        const orderedParams = [];
        let convertedSql = sql.replace(/\$([0-9]+)/g, (_, idx) => {
          const paramIndex = parseInt(idx, 10) - 1;
          orderedParams.push(params[paramIndex]);
          return '?';
        });
        const finalParams = orderedParams.length > 0 ? orderedParams : params;

        // Handle ILIKE for sqlite
        convertedSql = convertedSql.replace(/\bILIKE\b/gi, 'LIKE');

        // Handle RETURNING
        const hasReturning = /\bRETURNING\b/i.test(convertedSql);
        let returningField = '*';
        let cleanSql = convertedSql;

        if (hasReturning) {
          const match = convertedSql.match(/\bRETURNING\s+([a-zA-Z0-9_*, \t]+)/i);
          if (match) {
            returningField = match[1].trim();
            cleanSql = convertedSql.replace(/\s+\bRETURNING\b\s+[a-zA-Z0-9_*, \t]+/i, '');
          }
        }

        const isMutation = /^\s*(INSERT|UPDATE|DELETE)\b/i.test(cleanSql);

        if (isMutation) {
          sqliteDb.run(cleanSql, finalParams, function(err) {
            if (err) return reject(err);
            const lastID = this.lastID;
            const changes = this.changes;

            if (hasReturning) {
              // Try to find table name
              const tableMatch = cleanSql.match(/(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+([a-zA-Z0-9_]+)/i);
              const tableName = tableMatch ? tableMatch[1] : null;

              if (tableName && /INSERT/i.test(cleanSql) && lastID) {
                sqliteDb.get(`SELECT ${returningField} FROM ${tableName} WHERE rowid = ?`, [lastID], (err2, row) => {
                  if (err2) return reject(err2);
                  resolve({ rows: row ? [row] : [], changes, lastID });
                });
                return;
              } else if (tableName && /UPDATE/i.test(cleanSql)) {
                // If update, resolve with empty or re-queried rows
                resolve({ rows: [], changes, lastID });
                return;
              }
            }

            resolve({ rows: [], changes, lastID });
          });
        } else {
          sqliteDb.all(cleanSql, finalParams, (err, rows) => {
            if (err) return reject(err);
            resolve({ rows: rows || [] });
          });
        }
      });
    };

    dbDriver = {
      query: sqliteQuery,
      rawDb: sqliteDb,
      type: 'sqlite'
    };
    console.log(`[DB] Using persistent SQLite database at ${dbPath}`);
  }

  return dbDriver;
}

async function query(text, params = []) {
  const db = await getDatabase();
  return db.query(text, params);
}

async function initDB() {
  const db = await getDatabase();

  if (db.type === 'sqlite') {
    // SQLite Tables
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'reviewer',
        avatar_color TEXT DEFAULT '#0284c7',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        repository_url TEXT,
        description TEXT,
        technologies TEXT,
        lead_developer TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(created_by) REFERENCES users(id)
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS checklist_master (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        control_id TEXT UNIQUE NOT NULL,
        requirement TEXT NOT NULL,
        explanation TEXT NOT NULL,
        severity TEXT NOT NULL,
        weight INTEGER NOT NULL DEFAULT 5,
        cwe_id TEXT,
        remediation TEXT,
        code_example_vulnerable TEXT,
        code_example_safe TEXT
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        project_id INTEGER,
        reviewer_id INTEGER,
        lead_developer TEXT,
        technologies TEXT,
        deadline DATE,
        status TEXT DEFAULT 'pending',
        overall_score REAL DEFAULT 0,
        security_rating TEXT DEFAULT 'Not Rated',
        total_controls INTEGER DEFAULT 0,
        passed_controls INTEGER DEFAULT 0,
        failed_controls INTEGER DEFAULT 0,
        not_reviewed_controls INTEGER DEFAULT 0,
        critical_risks INTEGER DEFAULT 0,
        high_risks INTEGER DEFAULT 0,
        medium_risks INTEGER DEFAULT 0,
        low_risks INTEGER DEFAULT 0,
        executive_summary TEXT,
        recommendations TEXT,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY(reviewer_id) REFERENCES users(id)
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS review_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        review_id INTEGER,
        master_control_id INTEGER,
        status TEXT DEFAULT 'not_reviewed',
        reviewer_notes TEXT,
        evidence TEXT,
        remediation TEXT,
        file_path TEXT,
        line_number TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(review_id) REFERENCES reviews(id) ON DELETE CASCADE,
        FOREIGN KEY(master_control_id) REFERENCES checklist_master(id)
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        review_id INTEGER,
        user_id INTEGER,
        user_name TEXT,
        action TEXT NOT NULL,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } else {
    // PostgreSQL Tables
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(150) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'reviewer',
        avatar_color VARCHAR(50) DEFAULT '#0284c7',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        repository_url VARCHAR(255),
        description TEXT,
        technologies TEXT,
        lead_developer VARCHAR(150),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS checklist_master (
        id SERIAL PRIMARY KEY,
        category VARCHAR(100) NOT NULL,
        control_id VARCHAR(50) UNIQUE NOT NULL,
        requirement VARCHAR(255) NOT NULL,
        explanation TEXT NOT NULL,
        severity VARCHAR(50) NOT NULL,
        weight INTEGER NOT NULL DEFAULT 5,
        cwe_id VARCHAR(50),
        remediation TEXT,
        code_example_vulnerable TEXT,
        code_example_safe TEXT
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        reviewer_id INTEGER REFERENCES users(id),
        lead_developer VARCHAR(150),
        technologies TEXT,
        deadline DATE,
        status VARCHAR(50) DEFAULT 'pending',
        overall_score NUMERIC(5,2) DEFAULT 0,
        security_rating VARCHAR(50) DEFAULT 'Not Rated',
        total_controls INTEGER DEFAULT 0,
        passed_controls INTEGER DEFAULT 0,
        failed_controls INTEGER DEFAULT 0,
        not_reviewed_controls INTEGER DEFAULT 0,
        critical_risks INTEGER DEFAULT 0,
        high_risks INTEGER DEFAULT 0,
        medium_risks INTEGER DEFAULT 0,
        low_risks INTEGER DEFAULT 0,
        executive_summary TEXT,
        recommendations TEXT,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS review_items (
        id SERIAL PRIMARY KEY,
        review_id INTEGER REFERENCES reviews(id) ON DELETE CASCADE,
        master_control_id INTEGER REFERENCES checklist_master(id),
        status VARCHAR(50) DEFAULT 'not_reviewed',
        reviewer_notes TEXT,
        evidence TEXT,
        remediation TEXT,
        file_path VARCHAR(255),
        line_number VARCHAR(50),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        review_id INTEGER,
        user_id INTEGER,
        user_name VARCHAR(150),
        action VARCHAR(100) NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  // Seed checklist_master if empty
  const checkControls = await db.query('SELECT COUNT(*) as count FROM checklist_master');
  if (parseInt(checkControls.rows[0].count, 10) === 0) {
    console.log('[DB] Seeding master security controls...');
    for (const item of masterChecklist) {
      await db.query(
        `INSERT INTO checklist_master 
         (category, control_id, requirement, explanation, severity, weight, cwe_id, remediation, code_example_vulnerable, code_example_safe)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          item.category,
          item.control_id,
          item.requirement,
          item.explanation,
          item.severity,
          item.weight,
          item.cwe_id,
          item.remediation,
          item.code_example_vulnerable,
          item.code_example_safe
        ]
      );
    }
    console.log(`[DB] Successfully seeded ${masterChecklist.length} master controls.`);
  }

  // Seed Users if empty
  const checkUsers = await db.query('SELECT COUNT(*) as count FROM users');
  if (parseInt(checkUsers.rows[0].count, 10) === 0) {
    console.log('[DB] Seeding demo users...');
    const adminPass = await bcrypt.hash('Admin@123456', 10);
    const reviewerPass = await bcrypt.hash('Reviewer@123456', 10);
    const devPass = await bcrypt.hash('Dev@123456', 10);

    await db.query(
      `INSERT INTO users (username, email, password_hash, full_name, role, avatar_color)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['admin', 'admin@secureshield.io', adminPass, 'Security Admin', 'admin', '#06b6d4']
    );
    await db.query(
      `INSERT INTO users (username, email, password_hash, full_name, role, avatar_color)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['reviewer', 'reviewer@secureshield.io', reviewerPass, 'Security Reviewer', 'reviewer', '#10b981']
    );
    await db.query(
      `INSERT INTO users (username, email, password_hash, full_name, role, avatar_color)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['developer', 'dev@secureshield.io', devPass, 'Developer', 'developer', '#8b5cf6']
    );
    console.log('[DB] Demo users created.');
  }

  // Seed Projects if empty
  const checkProjects = await db.query('SELECT COUNT(*) as count FROM projects');
  if (parseInt(checkProjects.rows[0].count, 10) === 0) {
    console.log('[DB] Seeding demo projects...');
    const adminUser = await db.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    const adminId = adminUser.rows[0]?.id || 1;

    await db.query(
      `INSERT INTO projects (name, repository_url, description, technologies, lead_developer, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'FinTech Core Payment Gateway',
        'https://github.com/enterprise-corp/fintech-payment-service',
        'High-throughput PCI-DSS compliant credit card processing microservice with multi-currency settlement.',
        'Node.js, Express, PostgreSQL, Redis, Stripe API, Docker',
        'Developer',
        adminId
      ]
    );

    await db.query(
      `INSERT INTO projects (name, repository_url, description, technologies, lead_developer, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'HealthTrack Patient Portal API',
        'https://github.com/enterprise-corp/healthtrack-telehealth',
        'HIPAA-governed electronic medical records telehealth application with patient messaging and prescription handling.',
        'React, TypeScript, GraphQL, Node.js, AWS S3, PostgreSQL',
        'Developer',
        adminId
      ]
    );

    await db.query(
      `INSERT INTO projects (name, repository_url, description, technologies, lead_developer, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'CloudVault Enterprise IAM Broker',
        'https://github.com/enterprise-corp/cloudvault-iam-broker',
        'Centralized Single Sign-On (SSO) gateway supporting SAML 2.0, OAuth2, and OIDC tokens.',
        'Go, OAuth2, JWT, Redis, SQLite',
        'Developer',
        adminId
      ]
    );
    console.log('[DB] Demo projects created.');
  }

  // Seed Demo Reviews if empty
  const checkReviews = await db.query('SELECT COUNT(*) as count FROM reviews');
  if (parseInt(checkReviews.rows[0].count, 10) === 0) {
    console.log('[DB] Seeding demo reviews and realistic findings...');
    const reviewerUser = await db.query("SELECT id FROM users WHERE role = 'reviewer' LIMIT 1");
    const reviewerId = reviewerUser.rows[0]?.id || 2;
    const project1 = await db.query("SELECT id FROM projects WHERE name LIKE 'FinTech%' LIMIT 1");
    const p1Id = project1.rows[0]?.id || 1;
    const project2 = await db.query("SELECT id FROM projects WHERE name LIKE 'HealthTrack%' LIMIT 1");
    const p2Id = project2.rows[0]?.id || 2;

    const masterControls = (await db.query('SELECT * FROM checklist_master ORDER BY id ASC')).rows;

    // Review 1: Completed Review with realistic critical & high findings
    await db.query(
      `INSERT INTO reviews (
        title, project_id, reviewer_id, lead_developer, technologies, deadline,
        status, executive_summary, recommendations
      ) VALUES ($1, $2, $3, $4, $5, date('now', '+5 days'), 'completed', $6, $7)`,
      [
        'Q3 Comprehensive Security Code Audit: FinTech Payment Gateway',
        p1Id,
        reviewerId,
        'Developer',
        'Node.js, Express, PostgreSQL, Stripe API',
        'Comprehensive security review completed for the core payment processing service. Critical SQL injection vulnerability identified in the audit logs search handler, and insufficient CSRF token validation found on the internal transfer webhook. Authentication and password security mechanisms comply with industry benchmarks.',
        '1. Immediately parameterize the dynamic search query in server/src/controllers/audit.js.\n2. Enforce strict CSRF verification on all state-altering POST routes.\n3. Add restrictive Content-Security-Policy and HSTS headers before production release.'
      ]
    );

    const r1Row = (await db.query('SELECT id FROM reviews WHERE project_id = $1 LIMIT 1', [p1Id])).rows[0];
    const r1Id = r1Row.id;

    for (const ctrl of masterControls) {
      let status = 'pass';
      let notes = 'Verified: Code complies with security baseline standard.';
      let evidence = '';
      let filePath = '';
      let lineNo = '';

      if (ctrl.control_id === 'SQLI-01') {
        status = 'fail';
        notes = 'Critical SQL Injection detected. String concatenation used directly inside the audit search endpoint.';
        evidence = 'const sql = "SELECT * FROM transactions WHERE notes LIKE \'%" + req.query.q + "%\'";';
        filePath = 'src/services/transactionSearch.js';
        lineNo = '44-48';
      } else if (ctrl.control_id === 'CSRF-01') {
        status = 'fail';
        notes = 'Anti-CSRF middleware missing on the payment webhook callback and internal transfer route.';
        evidence = 'router.post("/process-transfer", transferController.handle); // No csrf protection middleware';
        filePath = 'src/routes/payment.routes.js';
        lineNo = '112';
      } else if (ctrl.control_id === 'HDR-01') {
        status = 'fail';
        notes = 'Strict-Transport-Security (HSTS) header is not configured on the Express app instance.';
        evidence = 'Missing helmet.hsts() in application middleware chain.';
        filePath = 'src/app.js';
        lineNo = '29';
      } else if (ctrl.control_id === 'DATA-01') {
        status = 'pass';
        notes = 'Secrets are properly extracted to process.env and validated on boot.';
        evidence = 'Checked config/vault.js: STRIPE_KEY loaded from process.env.STRIPE_SECRET_KEY';
        filePath = 'src/config/vault.js';
        lineNo = '12';
      }

      await db.query(
        `INSERT INTO review_items (review_id, master_control_id, status, reviewer_notes, evidence, remediation, file_path, line_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [r1Id, ctrl.id, status, notes, evidence, ctrl.remediation, filePath, lineNo]
      );
    }

    // Recalculate score
    const r1Items = (await db.query(`
      SELECT ri.*, cm.severity, cm.weight 
      FROM review_items ri 
      JOIN checklist_master cm ON ri.master_control_id = cm.id 
      WHERE ri.review_id = $1
    `, [r1Id])).rows;
    const r1Metrics = calculateScoreFromItems(r1Items);

    await db.query(
      `UPDATE reviews SET
        overall_score = $1,
        security_rating = $2,
        total_controls = $3,
        passed_controls = $4,
        failed_controls = $5,
        not_reviewed_controls = $6,
        critical_risks = $7,
        high_risks = $8,
        medium_risks = $9,
        low_risks = $10
       WHERE id = $11`,
      [
        r1Metrics.overall_score,
        r1Metrics.security_rating,
        r1Metrics.total_controls,
        r1Metrics.passed_controls,
        r1Metrics.failed_controls,
        r1Metrics.not_reviewed_controls,
        r1Metrics.critical_risks,
        r1Metrics.high_risks,
        r1Metrics.medium_risks,
        r1Metrics.low_risks,
        r1Id
      ]
    );

    // Review 2: In-progress review
    await db.query(
      `INSERT INTO reviews (
        title, project_id, reviewer_id, lead_developer, technologies, deadline,
        status, executive_summary, recommendations
      ) VALUES ($1, $2, $3, $4, $5, date('now', '+10 days'), 'in_progress', $6, $7)`,
      [
        'Pre-Release HIPAA Security Review: HealthTrack Telehealth',
        p2Id,
        reviewerId,
        'Developer',
        'React, TypeScript, GraphQL, Node.js, AWS S3',
        'Review in progress focusing on patient record confidentiality (HIPAA), GraphQL query depth limiting, and S3 pre-signed URL expiration.',
        'Pending completion of dependency scans and API authorization matrix.'
      ]
    );

    const r2Row = (await db.query('SELECT id FROM reviews WHERE project_id = $1 LIMIT 1', [p2Id])).rows[0];
    const r2Id = r2Row.id;

    for (let i = 0; i < masterControls.length; i++) {
      const ctrl = masterControls[i];
      let status = 'not_reviewed';
      let notes = '';
      if (i < 8) {
        status = (i % 3 === 0) ? 'fail' : 'pass';
        notes = status === 'fail' ? 'Requires remediation before audit sign-off.' : 'Verified compliant.';
      }
      await db.query(
        `INSERT INTO review_items (review_id, master_control_id, status, reviewer_notes, remediation)
         VALUES ($1, $2, $3, $4, $5)`,
        [r2Id, ctrl.id, status, notes, ctrl.remediation]
      );
    }

    const r2Items = (await db.query(`
      SELECT ri.*, cm.severity, cm.weight 
      FROM review_items ri 
      JOIN checklist_master cm ON ri.master_control_id = cm.id 
      WHERE ri.review_id = $1
    `, [r2Id])).rows;
    const r2Metrics = calculateScoreFromItems(r2Items);

    await db.query(
      `UPDATE reviews SET
        overall_score = $1,
        security_rating = $2,
        total_controls = $3,
        passed_controls = $4,
        failed_controls = $5,
        not_reviewed_controls = $6,
        critical_risks = $7,
        high_risks = $8,
        medium_risks = $9,
        low_risks = $10
       WHERE id = $11`,
      [
        r2Metrics.overall_score,
        r2Metrics.security_rating,
        r2Metrics.total_controls,
        r2Metrics.passed_controls,
        r2Metrics.failed_controls,
        r2Metrics.not_reviewed_controls,
        r2Metrics.critical_risks,
        r2Metrics.high_risks,
        r2Metrics.medium_risks,
        r2Metrics.low_risks,
        r2Id
      ]
    );

    // Initial audit log
    await db.query(
      `INSERT INTO audit_logs (review_id, user_id, user_name, action, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        r1Id,
        reviewerId,
        'Security Reviewer',
        'REVIEW_COMPLETED',
        'Completed full security review and generated security rating.'
      ]
    );

    console.log('[DB] Demo reviews and findings seeded successfully.');
  }

  console.log('[DB] Database initialization completed.');
}

module.exports = {
  query,
  initDB,
  calculateScoreFromItems
};
