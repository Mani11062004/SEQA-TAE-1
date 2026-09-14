const { query } = require('../config/db');

// Get all projects with count of reviews
async function getAllProjects(req, res) {
  try {
    const result = await query(`
      SELECT 
        p.*,
        u.full_name as created_by_name,
        COUNT(r.id) as review_count,
        COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as completed_reviews,
        COUNT(CASE WHEN r.status = 'in_progress' THEN 1 END) as active_reviews,
        AVG(CASE WHEN r.status = 'completed' THEN r.overall_score END) as avg_score
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN reviews r ON p.id = r.project_id
      GROUP BY p.id, u.full_name
      ORDER BY p.created_at DESC
    `);

    const projects = result.rows.map(p => ({
      ...p,
      review_count: parseInt(p.review_count, 10),
      completed_reviews: parseInt(p.completed_reviews, 10),
      active_reviews: parseInt(p.active_reviews, 10),
      avg_score: p.avg_score !== null ? parseFloat(Number(p.avg_score).toFixed(1)) : null
    }));

    return res.json({ projects });
  } catch (err) {
    console.error('[Project Error] getAllProjects:', err);
    return res.status(500).json({ error: 'Failed to fetch projects.' });
  }
}

// Get single project by ID with its review history
async function getProjectById(req, res) {
  try {
    const { id } = req.params;
    const projectRes = await query(`
      SELECT p.*, u.full_name as created_by_name
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = $1
    `, [id]);

    if (projectRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const reviewsRes = await query(`
      SELECT r.*, u.full_name as reviewer_name
      FROM reviews r
      LEFT JOIN users u ON r.reviewer_id = u.id
      WHERE r.project_id = $1
      ORDER BY r.created_at DESC
    `, [id]);

    return res.json({
      project: projectRes.rows[0],
      reviews: reviewsRes.rows
    });
  } catch (err) {
    console.error('[Project Error] getProjectById:', err);
    return res.status(500).json({ error: 'Failed to fetch project details.' });
  }
}

// Create new project (Admin or Reviewer)
async function createProject(req, res) {
  try {
    const { name, repository_url, description, technologies, lead_developer } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required.' });
    }

    const result = await query(`
      INSERT INTO projects (name, repository_url, description, technologies, lead_developer, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      name.trim(),
      repository_url ? repository_url.trim() : '',
      description ? description.trim() : '',
      technologies ? technologies.trim() : '',
      lead_developer ? lead_developer.trim() : '',
      req.user.id
    ]);

    return res.status(201).json({
      message: 'Project registered successfully.',
      project: result.rows[0]
    });
  } catch (err) {
    console.error('[Project Error] createProject:', err);
    return res.status(500).json({ error: 'Failed to create project.' });
  }
}

// Update project details
async function updateProject(req, res) {
  try {
    const { id } = req.params;
    const { name, repository_url, description, technologies, lead_developer } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required.' });
    }

    const result = await query(`
      UPDATE projects
      SET name = $1, repository_url = $2, description = $3, technologies = $4, lead_developer = $5
      WHERE id = $6
      RETURNING *
    `, [
      name.trim(),
      repository_url ? repository_url.trim() : '',
      description ? description.trim() : '',
      technologies ? technologies.trim() : '',
      lead_developer ? lead_developer.trim() : '',
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    return res.json({
      message: 'Project updated successfully.',
      project: result.rows[0]
    });
  } catch (err) {
    console.error('[Project Error] updateProject:', err);
    return res.status(500).json({ error: 'Failed to update project.' });
  }
}

// Delete project
async function deleteProject(req, res) {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    return res.json({ message: 'Project and all associated reviews deleted.' });
  } catch (err) {
    console.error('[Project Error] deleteProject:', err);
    return res.status(500).json({ error: 'Failed to delete project.' });
  }
}

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
};
