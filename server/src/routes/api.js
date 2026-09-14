const express = require('express');
const router = express.Router();

const { authenticateToken, requireRole } = require('../middleware/auth');
const authController = require('../controllers/authController');
const projectController = require('../controllers/projectController');
const reviewController = require('../controllers/reviewController');
const dashboardController = require('../controllers/dashboardController');
const { query } = require('../config/db');

// --- Auth Routes ---
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/demo/:role', authController.demoLogin);
router.get('/auth/me', authenticateToken, authController.getMe);
router.get('/auth/users', authenticateToken, authController.getUsers);

// --- Projects Routes ---
router.get('/projects', authenticateToken, projectController.getAllProjects);
router.get('/projects/:id', authenticateToken, projectController.getProjectById);
router.post('/projects', authenticateToken, requireRole(['admin', 'reviewer']), projectController.createProject);
router.put('/projects/:id', authenticateToken, requireRole('admin'), projectController.updateProject);
router.delete('/projects/:id', authenticateToken, requireRole('admin'), projectController.deleteProject);

// --- Reviews Routes ---
router.get('/reviews', authenticateToken, reviewController.getAllReviews);
router.get('/reviews/:id', authenticateToken, reviewController.getReviewById);
router.post('/reviews', authenticateToken, requireRole(['admin', 'reviewer']), reviewController.createReview);
router.put('/reviews/:reviewId/items/:itemId', authenticateToken, reviewController.updateReviewItem);
router.post('/reviews/:reviewId/bulk-update', authenticateToken, reviewController.bulkUpdateReviewItems);
router.put('/reviews/:id/status', authenticateToken, reviewController.updateReviewStatus);
router.delete('/reviews/:id', authenticateToken, requireRole('admin'), reviewController.deleteReview);
router.get('/reviews/:id/audit', authenticateToken, reviewController.getAuditLogs);

// --- Dashboard Routes ---
router.get('/dashboard/admin', authenticateToken, requireRole('admin'), dashboardController.getAdminMetrics);
router.get('/dashboard/reviewer', authenticateToken, dashboardController.getReviewerMetrics);

// --- Master Checklist Reference ---
router.get('/checklist/master', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM checklist_master ORDER BY id ASC');
    return res.json({ controls: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch master checklist.' });
  }
});

module.exports = router;
