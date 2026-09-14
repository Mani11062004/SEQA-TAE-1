const { query } = require('../config/db');

// Admin Analytics & Metrics
async function getAdminMetrics(req, res) {
  try {
    // Review counts & metrics
    const reviewStatsRes = await query(`
      SELECT 
        COUNT(*) as total_reviews,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reviews,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_reviews,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_reviews,
        SUM(critical_risks) as total_critical_risks,
        SUM(high_risks) as total_high_risks,
        SUM(medium_risks) as total_medium_risks,
        SUM(low_risks) as total_low_risks,
        AVG(CASE WHEN status = 'completed' THEN overall_score END) as avg_security_score
      FROM reviews
    `);

    const stats = reviewStatsRes.rows[0];

    // Projects count
    const projectStatsRes = await query('SELECT COUNT(*) as total_projects FROM projects');
    const totalProjects = parseInt(projectStatsRes.rows[0].total_projects, 10);

    // Recent reviews
    const recentReviewsRes = await query(`
      SELECT 
        r.*,
        p.name as project_name,
        u.full_name as reviewer_name,
        u.avatar_color as reviewer_avatar
      FROM reviews r
      LEFT JOIN projects p ON r.project_id = p.id
      LEFT JOIN users u ON r.reviewer_id = u.id
      ORDER BY r.updated_at DESC
      LIMIT 5
    `);

    // Top Failed Categories across all reviews
    const failedCategoriesRes = await query(`
      SELECT 
        cm.category,
        COUNT(*) as failed_count,
        COUNT(CASE WHEN cm.severity = 'critical' THEN 1 END) as critical_count,
        COUNT(CASE WHEN cm.severity = 'high' THEN 1 END) as high_count
      FROM review_items ri
      JOIN checklist_master cm ON ri.master_control_id = cm.id
      WHERE ri.status = 'fail'
      GROUP BY cm.category
      ORDER BY failed_count DESC
      LIMIT 6
    `);

    // Recent Audit Logs
    const recentAuditRes = await query(`
      SELECT a.*, r.title as review_title
      FROM audit_logs a
      LEFT JOIN reviews r ON a.review_id = r.id
      ORDER BY a.created_at DESC
      LIMIT 8
    `);

    return res.json({
      metrics: {
        total_reviews: parseInt(stats.total_reviews, 10) || 0,
        pending_reviews: parseInt(stats.pending_reviews, 10) || 0,
        in_progress_reviews: parseInt(stats.in_progress_reviews, 10) || 0,
        completed_reviews: parseInt(stats.completed_reviews, 10) || 0,
        critical_risks: parseInt(stats.total_critical_risks, 10) || 0,
        high_risks: parseInt(stats.total_high_risks, 10) || 0,
        medium_risks: parseInt(stats.total_medium_risks, 10) || 0,
        low_risks: parseInt(stats.total_low_risks, 10) || 0,
        avg_security_score: stats.avg_security_score !== null ? parseFloat(Number(stats.avg_security_score).toFixed(1)) : 0,
        total_projects: totalProjects
      },
      recent_reviews: recentReviewsRes.rows,
      failed_categories: failedCategoriesRes.rows,
      recent_activity: recentAuditRes.rows
    });
  } catch (err) {
    console.error('[Dashboard Error] getAdminMetrics:', err);
    return res.status(500).json({ error: 'Failed to generate admin metrics.' });
  }
}

// Developer & Reviewer Personal Dashboard
async function getReviewerMetrics(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const userName = req.user.full_name;

    // Assigned or involved reviews
    let userFilter = `WHERE reviewer_id = $1`;
    let userParams = [userId];

    if (userRole === 'developer') {
      userFilter = `WHERE lead_developer ILIKE $1 OR reviewer_id = $2`;
      userParams = [`%${userName}%`, userId];
    }

    const reviewsRes = await query(`
      SELECT 
        r.*,
        p.name as project_name,
        p.repository_url,
        u.full_name as reviewer_name
      FROM reviews r
      LEFT JOIN projects p ON r.project_id = p.id
      LEFT JOIN users u ON r.reviewer_id = u.id
      ${userFilter}
      ORDER BY r.updated_at DESC
    `, userParams);

    const userReviews = reviewsRes.rows;

    const totalAssigned = userReviews.length;
    const pendingCount = userReviews.filter(r => r.status === 'pending').length;
    const inProgressCount = userReviews.filter(r => r.status === 'in_progress').length;
    const completedCount = userReviews.filter(r => r.status === 'completed').length;

    let totalCritical = 0;
    let totalHigh = 0;
    let scoreSum = 0;
    let scoreCount = 0;

    for (const r of userReviews) {
      totalCritical += parseInt(r.critical_risks, 10) || 0;
      totalHigh += parseInt(r.high_risks, 10) || 0;
      if (r.status === 'completed' || r.status === 'in_progress') {
        scoreSum += parseFloat(r.overall_score) || 0;
        scoreCount++;
      }
    }

    const avgScore = scoreCount > 0 ? parseFloat((scoreSum / scoreCount).toFixed(1)) : 0;

    // Outstanding critical & high findings assigned to this user's reviews
    const outstandingIssuesRes = await query(`
      SELECT 
        ri.id,
        ri.review_id,
        ri.reviewer_notes,
        ri.evidence,
        ri.file_path,
        ri.line_number,
        ri.remediation,
        cm.control_id,
        cm.requirement,
        cm.category,
        cm.severity,
        cm.cwe_id,
        r.title as review_title,
        p.name as project_name
      FROM review_items ri
      JOIN reviews r ON ri.review_id = r.id
      JOIN checklist_master cm ON ri.master_control_id = cm.id
      JOIN projects p ON r.project_id = p.id
      WHERE (r.reviewer_id = $1 OR r.lead_developer ILIKE $2)
        AND ri.status = 'fail'
        AND cm.severity IN ('critical', 'high')
      ORDER BY 
        CASE WHEN cm.severity = 'critical' THEN 1 ELSE 2 END,
        ri.updated_at DESC
      LIMIT 10
    `, [userId, `%${userName}%`]);

    return res.json({
      metrics: {
        total_assigned: totalAssigned,
        pending_reviews: pendingCount,
        in_progress_reviews: inProgressCount,
        completed_reviews: completedCount,
        critical_risks: totalCritical,
        high_risks: totalHigh,
        avg_security_score: avgScore
      },
      assigned_reviews: userReviews,
      outstanding_issues: outstandingIssuesRes.rows
    });
  } catch (err) {
    console.error('[Dashboard Error] getReviewerMetrics:', err);
    return res.status(500).json({ error: 'Failed to generate reviewer metrics.' });
  }
}

module.exports = {
  getAdminMetrics,
  getReviewerMetrics
};
