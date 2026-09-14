const { query, calculateScoreFromItems } = require('../config/db');

// Get all reviews with rich filtering
async function getAllReviews(req, res) {
  try {
    const { status, project_id, reviewer_id, search, severity } = req.query;

    let sql = `
      SELECT 
        r.*,
        p.name as project_name,
        p.repository_url,
        u.full_name as reviewer_name,
        u.email as reviewer_email,
        u.avatar_color as reviewer_avatar
      FROM reviews r
      LEFT JOIN projects p ON r.project_id = p.id
      LEFT JOIN users u ON r.reviewer_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by role if developer
    if (req.user && req.user.role === 'developer') {
      params.push(`%${req.user.full_name}%`);
      sql += ` AND (r.lead_developer ILIKE $${params.length} OR r.reviewer_id = ${req.user.id})`;
    }

    if (status && status !== 'all') {
      params.push(status);
      sql += ` AND r.status = $${params.length}`;
    }

    if (project_id && project_id !== 'all') {
      params.push(project_id);
      sql += ` AND r.project_id = $${params.length}`;
    }

    if (reviewer_id && reviewer_id !== 'all') {
      params.push(reviewer_id);
      sql += ` AND r.reviewer_id = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (r.title ILIKE $${params.length} OR p.name ILIKE $${params.length} OR r.lead_developer ILIKE $${params.length})`;
    }

    if (severity) {
      if (severity === 'critical') {
        sql += ` AND r.critical_risks > 0`;
      } else if (severity === 'high') {
        sql += ` AND r.high_risks > 0`;
      }
    }

    sql += ` ORDER BY r.updated_at DESC, r.created_at DESC`;

    const result = await query(sql, params);
    return res.json({ reviews: result.rows });
  } catch (err) {
    console.error('[Review Error] getAllReviews:', err);
    return res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
}

// Get single review with all checklist items
async function getReviewById(req, res) {
  try {
    const { id } = req.params;

    const reviewRes = await query(`
      SELECT 
        r.*,
        p.name as project_name,
        p.repository_url,
        p.description as project_description,
        u.full_name as reviewer_name,
        u.email as reviewer_email,
        u.role as reviewer_role
      FROM reviews r
      LEFT JOIN projects p ON r.project_id = p.id
      LEFT JOIN users u ON r.reviewer_id = u.id
      WHERE r.id = $1
    `, [id]);

    if (reviewRes.rows.length === 0) {
      return res.status(404).json({ error: 'Security review not found.' });
    }

    const review = reviewRes.rows[0];

    // Fetch review items with master checklist metadata
    const itemsRes = await query(`
      SELECT 
        ri.*,
        cm.category,
        cm.control_id,
        cm.requirement,
        cm.explanation,
        cm.severity,
        cm.weight,
        cm.cwe_id,
        cm.code_example_vulnerable,
        cm.code_example_safe
      FROM review_items ri
      JOIN checklist_master cm ON ri.master_control_id = cm.id
      WHERE ri.review_id = $1
      ORDER BY cm.id ASC
    `, [id]);

    // Group items by category for UI ease
    const categoriesMap = {};
    for (const item of itemsRes.rows) {
      if (!categoriesMap[item.category]) {
        categoriesMap[item.category] = [];
      }
      categoriesMap[item.category].push(item);
    }

    const categories = Object.keys(categoriesMap).map(categoryName => ({
      category: categoryName,
      items: categoriesMap[categoryName],
      total: categoriesMap[categoryName].length,
      passed: categoriesMap[categoryName].filter(i => i.status === 'pass').length,
      failed: categoriesMap[categoryName].filter(i => i.status === 'fail').length,
      not_reviewed: categoriesMap[categoryName].filter(i => i.status === 'not_reviewed').length,
      critical_risks: categoriesMap[categoryName].filter(i => i.status === 'fail' && i.severity === 'critical').length,
      high_risks: categoriesMap[categoryName].filter(i => i.status === 'fail' && i.severity === 'high').length
    }));

    return res.json({
      review,
      categories,
      items: itemsRes.rows
    });
  } catch (err) {
    console.error('[Review Error] getReviewById:', err);
    return res.status(500).json({ error: 'Failed to fetch review details.' });
  }
}

// Create new review and initialize its checklist controls
async function createReview(req, res) {
  try {
    const { title, project_id, reviewer_id, lead_developer, technologies, deadline } = req.body;

    if (!title || !project_id) {
      return res.status(400).json({ error: 'Title and Project are required.' });
    }

    // Get project details if lead_developer or technologies not provided
    const projectRes = await query('SELECT * FROM projects WHERE id = $1', [project_id]);
    if (projectRes.rows.length === 0) {
      return res.status(404).json({ error: 'Selected project does not exist.' });
    }
    const project = projectRes.rows[0];

    const leadDev = lead_developer && lead_developer.trim() ? lead_developer.trim() : (project.lead_developer || 'Unassigned');
    const techs = technologies && technologies.trim() ? technologies.trim() : (project.technologies || '');
    const assignedReviewer = reviewer_id || req.user.id;

    // Fetch all master checklist items
    const masterRes = await query('SELECT * FROM checklist_master ORDER BY id ASC');
    const masterControls = masterRes.rows;

    const totalControls = masterControls.length;

    // Insert Review
    const reviewInsert = await query(`
      INSERT INTO reviews (
        title, project_id, reviewer_id, lead_developer, technologies, deadline,
        status, overall_score, security_rating, total_controls, passed_controls,
        failed_controls, not_reviewed_controls
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', 0, 'Not Reviewed', $7, 0, 0, $7)
      RETURNING *
    `, [
      title.trim(),
      project_id,
      assignedReviewer,
      leadDev,
      techs,
      deadline || null,
      totalControls
    ]);

    const newReview = reviewInsert.rows[0];

    // Seed review items for each master control
    for (const ctrl of masterControls) {
      await query(`
        INSERT INTO review_items (review_id, master_control_id, status, remediation)
        VALUES ($1, $2, 'not_reviewed', $3)
      `, [newReview.id, ctrl.id, ctrl.remediation]);
    }

    // Record Audit Log
    await query(`
      INSERT INTO audit_logs (review_id, user_id, user_name, action, details)
      VALUES ($1, $2, $3, 'REVIEW_CREATED', $4)
    `, [
      newReview.id,
      req.user.id,
      req.user.full_name,
      `Created security review "${newReview.title}" with ${totalControls} controls.`
    ]);

    return res.status(201).json({
      message: 'Security review created successfully.',
      review: newReview
    });
  } catch (err) {
    console.error('[Review Error] createReview:', err);
    return res.status(500).json({ error: 'Failed to create review.' });
  }
}

// Update single checklist item (Pass/Fail/Notes/Evidence/Line numbers)
async function updateReviewItem(req, res) {
  try {
    const { reviewId, itemId } = req.params;
    const { status, reviewer_notes, evidence, remediation, file_path, line_number } = req.body;

    const itemCheck = await query(`
      SELECT ri.*, cm.control_id, cm.requirement, cm.severity, cm.weight
      FROM review_items ri
      JOIN checklist_master cm ON ri.master_control_id = cm.id
      WHERE ri.id = $1 AND ri.review_id = $2
    `, [itemId, reviewId]);

    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Checklist item not found.' });
    }

    const currentItem = itemCheck.rows[0];

    await query(`
      UPDATE review_items
      SET 
        status = COALESCE($1, status),
        reviewer_notes = COALESCE($2, reviewer_notes),
        evidence = COALESCE($3, evidence),
        remediation = COALESCE($4, remediation),
        file_path = COALESCE($5, file_path),
        line_number = COALESCE($6, line_number),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 AND review_id = $8
    `, [
      status,
      reviewer_notes,
      evidence,
      remediation,
      file_path,
      line_number,
      itemId,
      reviewId
    ]);

    const updatedItemRes = await query(`
      SELECT ri.*, cm.category, cm.control_id, cm.requirement, cm.explanation, cm.severity, cm.weight, cm.cwe_id, cm.code_example_vulnerable, cm.code_example_safe
      FROM review_items ri
      JOIN checklist_master cm ON ri.master_control_id = cm.id
      WHERE ri.id = $1 AND ri.review_id = $2
    `, [itemId, reviewId]);
    const updatedItem = updatedItemRes.rows[0] || null;

    // Recalculate metrics for the entire review
    const allItems = (await query(`
      SELECT ri.status, cm.severity, cm.weight
      FROM review_items ri
      JOIN checklist_master cm ON ri.master_control_id = cm.id
      WHERE ri.review_id = $1
    `, [reviewId])).rows;

    const metrics = calculateScoreFromItems(allItems);

    // If review was pending and reviewer started auditing, change to 'in_progress'
    const reviewRes = await query('SELECT status FROM reviews WHERE id = $1', [reviewId]);
    let nextStatus = reviewRes.rows[0]?.status || 'in_progress';
    if (nextStatus === 'pending') {
      nextStatus = 'in_progress';
    }

    await query(`
      UPDATE reviews
      SET 
        status = $1,
        overall_score = $2,
        security_rating = $3,
        total_controls = $4,
        passed_controls = $5,
        failed_controls = $6,
        not_reviewed_controls = $7,
        critical_risks = $8,
        high_risks = $9,
        medium_risks = $10,
        low_risks = $11,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
    `, [
      nextStatus,
      metrics.overall_score,
      metrics.security_rating,
      metrics.total_controls,
      metrics.passed_controls,
      metrics.failed_controls,
      metrics.not_reviewed_controls,
      metrics.critical_risks,
      metrics.high_risks,
      metrics.medium_risks,
      metrics.low_risks,
      reviewId
    ]);

    const updatedReviewRes = await query(`
      SELECT r.*, p.name as project_name, p.repository_url, p.description as project_description,
             u.full_name as reviewer_name, u.email as reviewer_email, u.role as reviewer_role
      FROM reviews r
      LEFT JOIN projects p ON r.project_id = p.id
      LEFT JOIN users u ON r.reviewer_id = u.id
      WHERE r.id = $1
    `, [reviewId]);
    const updatedReview = updatedReviewRes.rows[0] || null;

    // Audit log if failure or significant finding recorded
    if (status === 'fail' && currentItem.status !== 'fail') {
      await query(`
        INSERT INTO audit_logs (review_id, user_id, user_name, action, details)
        VALUES ($1, $2, $3, 'VULNERABILITY_FLAGGED', $4)
      `, [
        reviewId,
        req.user.id,
        req.user.full_name,
        `Flagged ${currentItem.severity.toUpperCase()} finding on control [${currentItem.control_id}]: ${currentItem.requirement}`
      ]);
    }

    return res.json({
      message: 'Control updated successfully.',
      item: updatedItem,
      review: updatedReview,
      metrics
    });
  } catch (err) {
    console.error('[Review Error] updateReviewItem:', err);
    return res.status(500).json({ error: 'Failed to update checklist control.' });
  }
}

// Bulk update (e.g. mark category or low severity items as pass)
async function bulkUpdateReviewItems(req, res) {
  try {
    const { reviewId } = req.params;
    const { category, targetStatus, onlyNotReviewed } = req.body;

    let filterSql = `WHERE ri.review_id = $1`;
    const params = [reviewId, targetStatus || 'pass'];

    if (category && category !== 'all') {
      params.push(category);
      filterSql += ` AND cm.category = $${params.length}`;
    }

    if (onlyNotReviewed) {
      filterSql += ` AND ri.status = 'not_reviewed'`;
    }

    await query(`
      UPDATE review_items ri
      SET status = $2, updated_at = CURRENT_TIMESTAMP
      FROM checklist_master cm
      ${filterSql} AND ri.master_control_id = cm.id
    `, params);

    // Recalculate
    const allItems = (await query(`
      SELECT ri.status, cm.severity, cm.weight
      FROM review_items ri
      JOIN checklist_master cm ON ri.master_control_id = cm.id
      WHERE ri.review_id = $1
    `, [reviewId])).rows;

    const metrics = calculateScoreFromItems(allItems);

    await query(`
      UPDATE reviews
      SET 
        status = CASE WHEN status = 'pending' THEN 'in_progress' ELSE status END,
        overall_score = $1,
        security_rating = $2,
        total_controls = $3,
        passed_controls = $4,
        failed_controls = $5,
        not_reviewed_controls = $6,
        critical_risks = $7,
        high_risks = $8,
        medium_risks = $9,
        low_risks = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
    `, [
      metrics.overall_score,
      metrics.security_rating,
      metrics.total_controls,
      metrics.passed_controls,
      metrics.failed_controls,
      metrics.not_reviewed_controls,
      metrics.critical_risks,
      metrics.high_risks,
      metrics.medium_risks,
      metrics.low_risks,
      reviewId
    ]);

    const updatedReviewRes = await query(`
      SELECT r.*, p.name as project_name, p.repository_url, p.description as project_description,
             u.full_name as reviewer_name, u.email as reviewer_email, u.role as reviewer_role
      FROM reviews r
      LEFT JOIN projects p ON r.project_id = p.id
      LEFT JOIN users u ON r.reviewer_id = u.id
      WHERE r.id = $1
    `, [reviewId]);

    return res.json({
      message: 'Bulk update applied.',
      review: updatedReviewRes.rows[0] || null,
      metrics
    });
  } catch (err) {
    console.error('[Review Error] bulkUpdateReviewItems:', err);
    return res.status(500).json({ error: 'Failed to perform bulk update.' });
  }
}

// Update review status / Finalize Review / Executive Summary & Recommendations
async function updateReviewStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, executive_summary, recommendations } = req.body;

    const currentReview = await query('SELECT * FROM reviews WHERE id = $1', [id]);
    if (currentReview.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    const isCompleting = status === 'completed';

    await query(`
      UPDATE reviews
      SET 
        status = COALESCE($1, status),
        executive_summary = COALESCE($2, executive_summary),
        recommendations = COALESCE($3, recommendations),
        completed_at = CASE WHEN $1 = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [
      status,
      executive_summary,
      recommendations,
      id
    ]);

    const updatedReviewRes = await query(`
      SELECT r.*, p.name as project_name, p.repository_url, p.description as project_description,
             u.full_name as reviewer_name, u.email as reviewer_email, u.role as reviewer_role
      FROM reviews r
      LEFT JOIN projects p ON r.project_id = p.id
      LEFT JOIN users u ON r.reviewer_id = u.id
      WHERE r.id = $1
    `, [id]);

    const updated = updatedReviewRes.rows[0] || currentReview.rows[0];

    // Audit log
    await query(`
      INSERT INTO audit_logs (review_id, user_id, user_name, action, details)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      id,
      req.user.id,
      req.user.full_name,
      isCompleting ? 'REVIEW_COMPLETED' : 'REVIEW_STATUS_UPDATED',
      `Review status set to "${updated?.status}" with security rating: ${updated?.security_rating} (${updated?.overall_score}%).`
    ]);

    return res.json({
      message: isCompleting ? 'Security review completed successfully.' : 'Review status updated.',
      review: updated
    });
  } catch (err) {
    console.error('[Review Error] updateReviewStatus:', err);
    return res.status(500).json({ error: 'Failed to update review status.' });
  }
}

// Delete review
async function deleteReview(req, res) {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM reviews WHERE id = $1 RETURNING id, title', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    await query(`
      INSERT INTO audit_logs (review_id, user_id, user_name, action, details)
      VALUES ($1, $2, $3, 'REVIEW_DELETED', $4)
    `, [
      id,
      req.user.id,
      req.user.full_name,
      `Deleted security review "${result.rows[0].title}".`
    ]);

    return res.json({ message: 'Security review deleted successfully.' });
  } catch (err) {
    console.error('[Review Error] deleteReview:', err);
    return res.status(500).json({ error: 'Failed to delete review.' });
  }
}

// Audit logs for a review
async function getAuditLogs(req, res) {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT * FROM audit_logs 
      WHERE review_id = $1 
      ORDER BY created_at DESC
    `, [id]);
    return res.json({ auditLogs: result.rows });
  } catch (err) {
    console.error('[Review Error] getAuditLogs:', err);
    return res.status(500).json({ error: 'Failed to retrieve audit trail.' });
  }
}

module.exports = {
  getAllReviews,
  getReviewById,
  createReview,
  updateReviewItem,
  bulkUpdateReviewItems,
  updateReviewStatus,
  deleteReview,
  getAuditLogs
};
