const checklist = [
  // 1. XSS Prevention
  {
    category: 'XSS Prevention',
    control_id: 'XSS-01',
    requirement: 'Context-Aware Output Encoding',
    explanation: 'All user-controlled data rendered into HTML, attributes, JavaScript, or CSS contexts must be properly encoded using context-appropriate escapers to prevent Cross-Site Scripting.',
    severity: 'critical',
    weight: 10,
    cwe_id: 'CWE-79',
    remediation: 'Utilize templating engines with automatic HTML escaping (e.g. React JSX, DOMPurify). Never bypass escaping with dangerouslySetInnerHTML without strict sanitization.',
    code_example_vulnerable: 'const name = req.query.name;\nres.send(`<h1>Welcome, ${name}!</h1>`);',
    code_example_safe: 'const name = req.query.name;\nres.render("welcome", { name: escapeHtml(name) });'
  },
  {
    category: 'XSS Prevention',
    control_id: 'XSS-02',
    requirement: 'Safe DOM Sink Usage',
    explanation: 'Avoid dangerous DOM manipulation sinks such as innerHTML, outerHTML, document.write, and eval with unsanitized dynamic input.',
    severity: 'high',
    weight: 8,
    cwe_id: 'CWE-79',
    remediation: 'Use textContent, innerText, or DOMPurify.sanitize() before assigning to HTML sinks.',
    code_example_vulnerable: 'document.getElementById("output").innerHTML = location.hash.substring(1);',
    code_example_safe: 'document.getElementById("output").textContent = location.hash.substring(1);'
  },
  {
    category: 'XSS Prevention',
    control_id: 'XSS-03',
    requirement: 'Strict Content Security Policy (CSP)',
    explanation: 'Implement a restrictive Content-Security-Policy header restricting script execution sources and disallowing inline scripts and eval.',
    severity: 'medium',
    weight: 5,
    cwe_id: 'CWE-1021',
    remediation: 'Deploy Content-Security-Policy with default-src "self", script-src with nonces or hashes, and frame-ancestors "none".',
    code_example_vulnerable: 'app.use((req, res, next) => { res.removeHeader("Content-Security-Policy"); next(); });',
    code_example_safe: 'app.use(helmet.contentSecurityPolicy({ directives: { defaultSrc: ["\'self\'"], scriptSrc: ["\'self\'"] } }));'
  },

  // 2. CSRF Protection
  {
    category: 'CSRF Protection',
    control_id: 'CSRF-01',
    requirement: 'Anti-CSRF Tokens for State-Changing Requests',
    explanation: 'State-changing HTTP operations (POST, PUT, DELETE, PATCH) must validate an unpredictable, cryptographically random, per-session anti-CSRF token.',
    severity: 'critical',
    weight: 10,
    cwe_id: 'CWE-352',
    remediation: 'Use Double-Submit Cookie pattern or synchronizer token pattern (e.g. csurf / modern SameSite cookies combined with custom request headers like X-CSRF-Token).',
    code_example_vulnerable: 'app.post("/api/transfer", (req, res) => { transferFunds(req.user.id, req.body.to, req.body.amount); });',
    code_example_safe: 'app.post("/api/transfer", csrfProtection, (req, res) => { transferFunds(req.user.id, req.body.to, req.body.amount); });'
  },
  {
    category: 'CSRF Protection',
    control_id: 'CSRF-02',
    requirement: 'SameSite Cookie Attribute Enforcement',
    explanation: 'Authentication and session cookies must specify the SameSite=Strict or SameSite=Lax attribute to prevent unauthorized cross-site requests.',
    severity: 'high',
    weight: 7,
    cwe_id: 'CWE-352',
    remediation: 'Set SameSite="Lax" or "Strict" for all session and authentication cookies.',
    code_example_vulnerable: 'res.cookie("session", token, { httpOnly: true });',
    code_example_safe: 'res.cookie("session", token, { httpOnly: true, secure: true, sameSite: "strict" });'
  },
  {
    category: 'CSRF Protection',
    control_id: 'CSRF-03',
    requirement: 'Safe HTTP Methods Non-Mutability',
    explanation: 'GET, HEAD, and OPTIONS requests must be idempotent and must not alter application state or perform transactions.',
    severity: 'medium',
    weight: 6,
    cwe_id: 'CWE-352',
    remediation: 'Ensure all mutations (database writes, balance transfers, deletions) are handled exclusively via POST/PUT/DELETE.',
    code_example_vulnerable: 'app.get("/api/users/:id/delete", (req, res) => { deleteUser(req.params.id); });',
    code_example_safe: 'app.delete("/api/users/:id", requireAuth, (req, res) => { deleteUser(req.params.id); });'
  },

  // 3. Authentication & Authorization
  {
    category: 'Authentication & Authorization',
    control_id: 'AUTH-01',
    requirement: 'Broken Object Level Authorization (BOLA / IDOR) Prevention',
    explanation: 'Verify that the requesting user has permission to access or modify the specific resource identifier provided in parameters, body, or URL.',
    severity: 'critical',
    weight: 10,
    cwe_id: 'CWE-639',
    remediation: 'Enforce tenancy validation: always query database filtering by both resource ID AND authenticated user tenant/ownership ID.',
    code_example_vulnerable: 'app.get("/invoice/:id", (req, res) => { const doc = await db.query("SELECT * FROM invoices WHERE id = $1", [req.params.id]); });',
    code_example_safe: 'app.get("/invoice/:id", (req, res) => { const doc = await db.query("SELECT * FROM invoices WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]); });'
  },
  {
    category: 'Authentication & Authorization',
    control_id: 'AUTH-02',
    requirement: 'Role-Based Access Control (RBAC) Enforcement',
    explanation: 'Protected endpoints must enforce role and permission checks before executing controller logic, preventing privilege escalation.',
    severity: 'critical',
    weight: 9,
    cwe_id: 'CWE-285',
    remediation: 'Apply explicit authorizeRole([\'admin\']) middleware on sensitive administrative routes.',
    code_example_vulnerable: 'app.post("/api/admin/settings", (req, res) => { updateSystemSettings(req.body); });',
    code_example_safe: 'app.post("/api/admin/settings", authenticateToken, requireRole("admin"), (req, res) => { updateSystemSettings(req.body); });'
  },
  {
    category: 'Authentication & Authorization',
    control_id: 'AUTH-03',
    requirement: 'Multi-Factor Authentication (MFA) & Step-up Checks',
    explanation: 'High-risk operations (password changes, payment methods, email updates) require re-authentication or second-factor challenge.',
    severity: 'high',
    weight: 8,
    cwe_id: 'CWE-308',
    remediation: 'Implement TOTP or step-up verification challenges for critical actions and administrative accounts.',
    code_example_vulnerable: 'app.post("/account/change-email", (req, res) => { user.email = req.body.newEmail; });',
    code_example_safe: 'app.post("/account/change-email", requireRecentAuth, verifyMfaCode, (req, res) => { user.email = req.body.newEmail; });'
  },

  // 4. Input Validation & Sanitization
  {
    category: 'Input Validation & Sanitization',
    control_id: 'INP-01',
    requirement: 'Strict Allow-List Schema Validation',
    explanation: 'Validate all incoming request bodies, query params, and headers against strict typed schemas (e.g. Zod, Joi) before processing.',
    severity: 'high',
    weight: 8,
    cwe_id: 'CWE-20',
    remediation: 'Reject unknown properties (strip/abort) and validate datatypes, ranges, patterns, and string lengths.',
    code_example_vulnerable: 'app.post("/register", (req, res) => { createUser(req.body); });',
    code_example_safe: 'app.post("/register", validate(registrationSchema), (req, res) => { createUser(req.validatedBody); });'
  },
  {
    category: 'Input Validation & Sanitization',
    control_id: 'INP-02',
    requirement: 'Secure File Upload Validation',
    explanation: 'Uploaded files must have verified MIME types (via magic bytes inspection, not user-supplied header), extension allow-lists, and size limits.',
    severity: 'critical',
    weight: 9,
    cwe_id: 'CWE-434',
    remediation: 'Validate file signatures, store files outside web root or on object storage (S3), and rename uploaded files to random UUIDs.',
    code_example_vulnerable: 'fs.renameSync(req.file.path, "/var/www/uploads/" + req.file.originalname);',
    code_example_safe: 'const cleanExt = validateFileMagicBytes(req.file.buffer);\nawait s3.upload({ Key: crypto.randomUUID() + "." + cleanExt, Body: req.file.buffer });'
  },
  {
    category: 'Input Validation & Sanitization',
    control_id: 'INP-03',
    requirement: 'Mass Assignment & Parameter Tampering Prevention',
    explanation: 'Ensure attackers cannot inject unauthorized object attributes (such as isAdmin, role, balance, verified) during database inserts or updates.',
    severity: 'high',
    weight: 8,
    cwe_id: 'CWE-915',
    remediation: 'Use explicit DTO object destructuring instead of spreading req.body directly into database models.',
    code_example_vulnerable: 'await User.update(req.body, { where: { id: req.user.id } });',
    code_example_safe: 'const { bio, website, displayName } = req.body;\nawait User.update({ bio, website, displayName }, { where: { id: req.user.id } });'
  },

  // 5. Session Management
  {
    category: 'Session Management',
    control_id: 'SESS-01',
    requirement: 'Secure Cookie Flags (HttpOnly, Secure, SameSite)',
    explanation: 'Session tokens stored in cookies must have HttpOnly enabled to block JavaScript access, Secure flag for HTTPS only, and appropriate SameSite setting.',
    severity: 'high',
    weight: 8,
    cwe_id: 'CWE-1004',
    remediation: 'Set cookie flags: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" }.',
    code_example_vulnerable: 'document.cookie = "authToken=" + token;',
    code_example_safe: 'res.cookie("authToken", token, { httpOnly: true, secure: true, sameSite: "strict" });'
  },
  {
    category: 'Session Management',
    control_id: 'SESS-02',
    requirement: 'Session Regeneration on Privilege Change',
    explanation: 'Regenerate session identifiers upon user login, logout, and role privilege modification to eliminate Session Fixation attacks.',
    severity: 'high',
    weight: 7,
    cwe_id: 'CWE-384',
    remediation: 'Call req.session.regenerate() or issue a freshly signed JWT with new token identifier (jti) upon authentication changes.',
    code_example_vulnerable: 'app.post("/login", (req, res) => { req.session.userId = user.id; res.json({ ok: true }); });',
    code_example_safe: 'app.post("/login", (req, res) => { req.session.regenerate(() => { req.session.userId = user.id; res.json({ ok: true }); }); });'
  },
  {
    category: 'Session Management',
    control_id: 'SESS-03',
    requirement: 'Session Expiration and Invalidation',
    explanation: 'Enforce absolute and idle session timeouts, and ensure server-side token revocation upon user sign-out.',
    severity: 'medium',
    weight: 6,
    cwe_id: 'CWE-613',
    remediation: 'Set token expiration (e.g. 15m access token, 7d refresh token) and maintain a revocation blocklist or token family version counter.',
    code_example_vulnerable: 'jwt.sign({ id: user.id }, SECRET); // No expiration specified!',
    code_example_safe: 'jwt.sign({ id: user.id }, SECRET, { expiresIn: "1h", jwtid: crypto.randomUUID() });'
  },

  // 6. Password Security
  {
    category: 'Password Security',
    control_id: 'PWD-01',
    requirement: 'Robust Cryptographic Password Hashing',
    explanation: 'Passwords must never be stored in plaintext or with deprecated algorithms (MD5, SHA1, unsalted SHA256). Use Argon2id or bcrypt with high work factor.',
    severity: 'critical',
    weight: 10,
    cwe_id: 'CWE-916',
    remediation: 'Use bcrypt with cost >= 12 or Argon2id with memory >= 64MB and time cost >= 3.',
    code_example_vulnerable: 'const hash = crypto.createHash("md5").update(password).digest("hex");',
    code_example_safe: 'const hash = await bcrypt.hash(password, 12);'
  },
  {
    category: 'Password Security',
    control_id: 'PWD-02',
    requirement: 'Password Strength Policy & Breach Checking',
    explanation: 'Enforce minimum length (>= 10 chars), complexity requirements, and reject commonly compromised passwords.',
    severity: 'medium',
    weight: 6,
    cwe_id: 'CWE-521',
    remediation: 'Check passwords against HaveIBeenPwned k-anonymity API and enforce length and character variety.',
    code_example_vulnerable: 'if (password.length > 4) { register(); }',
    code_example_safe: 'if (!isStrongPassword(password)) { throw new Error("Password does not meet complexity requirements"); }'
  },
  {
    category: 'Password Security',
    control_id: 'PWD-03',
    requirement: 'Credential Stuffing & Brute-Force Rate Limiting',
    explanation: 'Login and password reset endpoints must enforce strict IP and account-level rate limits and account lockout policies.',
    severity: 'high',
    weight: 8,
    cwe_id: 'CWE-307',
    remediation: 'Use express-rate-limit or token bucket to limit login attempts to max 5 failed tries per 15 minutes per IP/user.',
    code_example_vulnerable: 'app.post("/api/login", authHandler); // Unmetered login endpoint',
    code_example_safe: 'app.post("/api/login", loginRateLimiter, trackFailedAttempts, authHandler);'
  },

  // 7. Secure API Handling
  {
    category: 'Secure API Handling',
    control_id: 'API-01',
    requirement: 'JWT Signature Verification & Algorithm Pinning',
    explanation: 'Verify JWT tokens using strict asymmetric/symmetric verification and pin algorithm to HS256/RS256, rejecting algorithm "none".',
    severity: 'critical',
    weight: 10,
    cwe_id: 'CWE-347',
    remediation: 'Specify algorithms: ["HS256"] or ["RS256"] in jwt.verify to avoid algorithm confusion attacks.',
    code_example_vulnerable: 'const decoded = jwt.decode(token); // Decodes without signature verification!',
    code_example_safe: 'const verified = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });'
  },
  {
    category: 'Secure API Handling',
    control_id: 'API-02',
    requirement: 'Strict CORS Whitelist Configuration',
    explanation: 'Cross-Origin Resource Sharing (CORS) must not reflect the Origin header or use wildcard Access-Control-Allow-Origin: * with credentials.',
    severity: 'high',
    weight: 8,
    cwe_id: 'CWE-942',
    remediation: 'Define an explicit array of allowed origins and disable Access-Control-Allow-Credentials if wildcard is used.',
    code_example_vulnerable: 'app.use(cors({ origin: true, credentials: true }));',
    code_example_safe: 'const allowed = ["https://app.secureshield.io"];\napp.use(cors({ origin: allowed, credentials: true }));'
  },
  {
    category: 'Secure API Handling',
    control_id: 'API-03',
    requirement: 'Global API Rate Limiting & Resource Quotas',
    explanation: 'Protect all public and authenticated API routes against denial-of-service, resource exhaustion, and scraping with rate limits.',
    severity: 'medium',
    weight: 6,
    cwe_id: 'CWE-770',
    remediation: 'Deploy rate limiting (e.g. 100 requests per minute per authenticated client/IP) and payload size limits.',
    code_example_vulnerable: 'app.use(express.json({ limit: "500mb" }));',
    code_example_safe: 'app.use(express.json({ limit: "1mb" }));\napp.use(apiLimiter);'
  },

  // 8. SQL Injection Prevention
  {
    category: 'SQL Injection Prevention',
    control_id: 'SQLI-01',
    requirement: 'Parameterized Queries & Prepared Statements',
    explanation: 'All database queries with dynamic values must use parameterized placeholders ($1, ?, :name). Never concatenate user input into SQL strings.',
    severity: 'critical',
    weight: 10,
    cwe_id: 'CWE-89',
    remediation: 'Use db.query("SELECT * FROM users WHERE email = $1", [email]). For ORMs, use parameterized methods.',
    code_example_vulnerable: 'db.query("SELECT * FROM users WHERE email = \'" + req.body.email + "\'");',
    code_example_safe: 'db.query("SELECT * FROM users WHERE email = $1", [req.body.email]);'
  },
  {
    category: 'SQL Injection Prevention',
    control_id: 'SQLI-02',
    requirement: 'Safe Dynamic Sorting and Column Whitelisting',
    explanation: 'When query identifiers like ORDER BY column or table names cannot be parameterized, validate them against a strict in-code whitelist.',
    severity: 'high',
    weight: 8,
    cwe_id: 'CWE-89',
    remediation: 'Validate sort column against allowed array: const allowed = ["created_at", "score"]; if (!allowed.includes(sort)) sort = "created_at";',
    code_example_vulnerable: 'db.query(`SELECT * FROM items ORDER BY ${req.query.sort} ASC`);',
    code_example_safe: 'const sortCol = ["name", "created_at"].includes(req.query.sort) ? req.query.sort : "created_at";\ndb.query(`SELECT * FROM items ORDER BY ${sortCol} ASC`);'
  },
  {
    category: 'SQL Injection Prevention',
    control_id: 'SQLI-03',
    requirement: 'Least Privilege Database Connection Account',
    explanation: 'The application database connection role should possess only the minimum required CRUD privileges and must not be a database superuser.',
    severity: 'medium',
    weight: 5,
    cwe_id: 'CWE-250',
    remediation: 'Grant only SELECT, INSERT, UPDATE, DELETE to the application user; revoke DROP, ALTER, and SUPERUSER permissions.',
    code_example_vulnerable: 'DATABASE_URL=postgres://postgres:root@localhost:5432/app_db // Using superuser!',
    code_example_safe: 'DATABASE_URL=postgres://app_worker:vault_pwd@localhost:5432/app_db // Dedicated non-admin role'
  },

  // 9. Sensitive Data Protection
  {
    category: 'Sensitive Data Protection',
    control_id: 'DATA-01',
    requirement: 'No Hardcoded Secrets, API Keys, or Tokens',
    explanation: 'Source code repositories must never contain hardcoded passwords, database credentials, cryptographic private keys, or API tokens.',
    severity: 'critical',
    weight: 10,
    cwe_id: 'CWE-798',
    remediation: 'Load secrets strictly from environment variables or a secure secret manager (HashiCorp Vault, AWS Secrets Manager). Add .env to .gitignore.',
    code_example_vulnerable: 'const STRIPE_SECRET = "sk_live_9482710384710293810293";',
    code_example_safe: 'const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;\nif (!STRIPE_SECRET) throw new Error("Missing STRIPE_SECRET_KEY");'
  },
  {
    category: 'Sensitive Data Protection',
    control_id: 'DATA-02',
    requirement: 'Encryption in Transit (Enforced TLS 1.2+)',
    explanation: 'All data transmitted over public and internal networks must be encrypted using modern TLS cipher suites with automatic HTTPS redirection.',
    severity: 'high',
    weight: 8,
    cwe_id: 'CWE-319',
    remediation: 'Redirect HTTP to HTTPS and enable HSTS with max-age=31536000.',
    code_example_vulnerable: 'http.createServer(app).listen(80); // Unencrypted HTTP only',
    code_example_safe: 'app.use((req, res, next) => { if (req.headers["x-forwarded-proto"] !== "https" && process.env.NODE_ENV === "production") return res.redirect("https://" + req.headers.host + req.url); next(); });'
  },
  {
    category: 'Sensitive Data Protection',
    control_id: 'DATA-03',
    requirement: 'PII & Sensitive Field Masking in Logs',
    explanation: 'Personally Identifiable Information (PII), credit card numbers, passwords, and authorization tokens must be masked before writing to log files.',
    severity: 'medium',
    weight: 6,
    cwe_id: 'CWE-532',
    remediation: 'Configure log sanitizers to redact fields matching password, token, authorization, ssn, cardNumber.',
    code_example_vulnerable: 'logger.info("User login request:", req.body); // Leaks password in plain logs!',
    code_example_safe: 'const sanitized = redactSensitive(req.body, ["password", "pin"]);\nlogger.info("User login request:", sanitized);'
  },

  // 10. Security Headers
  {
    category: 'Security Headers',
    control_id: 'HDR-01',
    requirement: 'Strict HTTP Strict Transport Security (HSTS)',
    explanation: 'Enforce HSTS to ensure web browsers communicate exclusively over secure HTTPS channels and prevent SSL stripping attacks.',
    severity: 'high',
    weight: 7,
    cwe_id: 'CWE-523',
    remediation: 'Set header: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload.',
    code_example_vulnerable: '// Missing HSTS header allows HTTP downgrade man-in-the-middle attacks',
    code_example_safe: 'res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");'
  },
  {
    category: 'Security Headers',
    control_id: 'HDR-02',
    requirement: 'Clickjacking Defense (X-Frame-Options / frame-ancestors)',
    explanation: 'Prevent UI redressing and clickjacking attacks by forbidding the application from being loaded inside iframes.',
    severity: 'medium',
    weight: 6,
    cwe_id: 'CWE-1021',
    remediation: 'Set X-Frame-Options: DENY (or SAMEORIGIN) and CSP frame-ancestors: \'none\'.',
    code_example_vulnerable: '// Allows any attacker to embed application in <iframe src="https://victim.com">',
    code_example_safe: 'res.setHeader("X-Frame-Options", "DENY");'
  },
  {
    category: 'Security Headers',
    control_id: 'HDR-03',
    requirement: 'MIME Type Sniffing & Referrer Policy Headers',
    explanation: 'Set X-Content-Type-Options: nosniff and restrictive Referrer-Policy to prevent MIME confusion exploits and referrer leakage.',
    severity: 'low',
    weight: 4,
    cwe_id: 'CWE-16',
    remediation: 'Configure Helmet with nosniff and referrerPolicy: { policy: "strict-origin-when-cross-origin" }.',
    code_example_vulnerable: 'res.removeHeader("X-Content-Type-Options");',
    code_example_safe: 'app.use(helmet.noSniff());\napp.use(helmet.referrerPolicy({ policy: "strict-origin-when-cross-origin" }));'
  },

  // 11. Error Handling & Logging
  {
    category: 'Error Handling & Logging',
    control_id: 'ERR-01',
    requirement: 'Safe Generic Error Responses (No Stack Trace Leakage)',
    explanation: 'Production API responses must return sanitized, generic error descriptions without leaking server stack traces, database schemas, or filesystem paths.',
    severity: 'high',
    weight: 8,
    cwe_id: 'CWE-209',
    remediation: 'Catch exceptions in global error middleware; log details internally with error correlation ID and return { message: "An unexpected error occurred", traceId } to client.',
    code_example_vulnerable: 'app.use((err, req, res, next) => { res.status(500).send(err.stack); });',
    code_example_safe: 'app.use((err, req, res, next) => { logger.error(err); res.status(500).json({ error: "Internal Server Error", code: "ERR_INTERNAL" }); });'
  },
  {
    category: 'Error Handling & Logging',
    control_id: 'ERR-02',
    requirement: 'Comprehensive Security Audit Logging',
    explanation: 'Log security-relevant events including login attempts, privilege changes, access control denials, and sensitive data modifications with timestamps and user context.',
    severity: 'medium',
    weight: 6,
    cwe_id: 'CWE-778',
    remediation: 'Write immutable audit logs with timestamp, actor_id, IP address, action, resource, and success/failure status.',
    code_example_vulnerable: '// No logging when unauthorized access or password changes occur',
    code_example_safe: 'await auditLog.create({ actorId: user.id, event: "USER_ROLE_ELEVATED", targetId: target.id, ip: req.ip, time: new Date() });'
  },

  // 12. Dependency/Library Security
  {
    category: 'Dependency/Library Security',
    control_id: 'DEP-01',
    requirement: 'Software Composition Analysis (SCA) & Vulnerability Scanning',
    explanation: 'All third-party libraries and direct/transitive dependencies must be routinely audited against known CVE vulnerability databases (e.g. npm audit, Snyk, Dependabot).',
    severity: 'high',
    weight: 8,
    cwe_id: 'CWE-1395',
    remediation: 'Enforce zero critical/high vulnerabilities in CI/CD pipelines and configure automated dependency patch updates.',
    code_example_vulnerable: '"dependencies": { "lodash": "4.17.15" } // Vulnerable to Prototype Pollution CVE-2020-8203',
    code_example_safe: '"dependencies": { "lodash": "^4.17.21" } // Patched version'
  },
  {
    category: 'Dependency/Library Security',
    control_id: 'DEP-02',
    requirement: 'Package Lockfile & Checksum Integrity Verification',
    explanation: 'Commit package-lock.json or yarn.lock to version control and run npm ci to guarantee reproducible builds and verify cryptographic integrity hashes.',
    severity: 'medium',
    weight: 6,
    cwe_id: 'CWE-494',
    remediation: 'Use `npm ci --ignore-scripts` in CI/CD pipelines to prevent malicious pre/postinstall script execution.',
    code_example_vulnerable: '// Dockerfile: RUN npm install (without lockfile or integrity checks)',
    code_example_safe: '// Dockerfile: COPY package*.json ./ \\n RUN npm ci --ignore-scripts'
  }
];

module.exports = checklist;
