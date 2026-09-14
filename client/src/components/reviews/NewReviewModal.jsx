import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';
import { PlusCircle, FolderGit2, User, Calendar, Cpu, ShieldCheck } from 'lucide-react';

export function NewReviewModal({ isOpen, onClose, onReviewCreated }) {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    project_id: '',
    new_project_name: '',
    repository_url: '',
    reviewer_id: '',
    lead_developer: '',
    technologies: '',
    deadline: ''
  });

  const [createNewProject, setCreateNewProject] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPrerequisites();
    }
  }, [isOpen]);

  const loadPrerequisites = async () => {
    try {
      setLoading(true);
      const [projRes, userRes] = await Promise.all([
        api.getProjects(),
        api.getUsers()
      ]);
      setProjects(projRes.projects || []);
      setUsers(userRes.users || []);

      if (projRes.projects && projRes.projects.length > 0) {
        const first = projRes.projects[0];
        setFormData(prev => ({
          ...prev,
          project_id: first.id,
          lead_developer: first.lead_developer || '',
          technologies: first.technologies || '',
          title: `Security Code Review: ${first.name}`
        }));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load projects and users list.');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = (e) => {
    const val = e.target.value;
    if (val === '__new__') {
      setCreateNewProject(true);
      setFormData(prev => ({
        ...prev,
        project_id: '',
        title: 'Security Code Review: New Project'
      }));
    } else {
      setCreateNewProject(false);
      const selected = projects.find(p => p.id === parseInt(val, 10));
      setFormData(prev => ({
        ...prev,
        project_id: val,
        lead_developer: selected ? selected.lead_developer : prev.lead_developer,
        technologies: selected ? selected.technologies : prev.technologies,
        title: selected ? `Security Code Review: ${selected.name}` : prev.title
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      let finalProjectId = formData.project_id;

      // If creating new project first
      if (createNewProject) {
        if (!formData.new_project_name.trim()) {
          throw new Error('Please specify a project name.');
        }
        const newProjRes = await api.createProject({
          name: formData.new_project_name,
          repository_url: formData.repository_url,
          technologies: formData.technologies,
          lead_developer: formData.lead_developer,
          description: `Code review project created on ${new Date().toLocaleDateString()}`
        });
        finalProjectId = newProjRes.project.id;
      }

      if (!formData.title.trim()) {
        throw new Error('Review title is required.');
      }

      const reviewRes = await api.createReview({
        title: formData.title,
        project_id: finalProjectId,
        reviewer_id: formData.reviewer_id ? parseInt(formData.reviewer_id, 10) : null,
        lead_developer: formData.lead_developer,
        technologies: formData.technologies,
        deadline: formData.deadline || null
      });

      onReviewCreated(reviewRes.review);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create security review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Software Security Code Review"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Project Selection */}
        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1 flex items-center justify-between">
            <span>Target Project / Repository *</span>
            <button
              type="button"
              onClick={() => setCreateNewProject(!createNewProject)}
              className="text-cyan-400 hover:text-cyan-300 text-[11px]"
            >
              {createNewProject ? '← Select Existing Project' : '+ Register New Project'}
            </button>
          </label>

          {createNewProject ? (
            <div className="space-y-2 p-3 rounded-lg bg-slate-900 border border-slate-700">
              <input
                type="text"
                required
                placeholder="Project Name (e.g. Microservices Auth Gateway)"
                value={formData.new_project_name}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  new_project_name: e.target.value,
                  title: `Security Code Review: ${e.target.value}`
                })}
                className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
              />
              <input
                type="url"
                placeholder="Repository URL (e.g. https://github.com/org/repo)"
                value={formData.repository_url}
                onChange={(e) => setFormData({ ...formData, repository_url: e.target.value })}
                className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
          ) : (
            <div className="relative">
              <select
                value={formData.project_id}
                onChange={handleProjectChange}
                required
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.lead_developer || 'Dev'})
                  </option>
                ))}
                <option value="__new__">+ Register New Project...</option>
              </select>
              <FolderGit2 className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
          )}
        </div>

        {/* Review Title */}
        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1">
            Review Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Q4 Security Audit & Penetration Baseline"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Reviewer & Lead Dev */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">
              Assign Reviewer
            </label>
            <div className="relative">
              <select
                value={formData.reviewer_id}
                onChange={(e) => setFormData({ ...formData, reviewer_id: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
              >
                <option value="">Select Auditor / Reviewer</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role})
                  </option>
                ))}
              </select>
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">
              Lead Developer
            </label>
            <input
              type="text"
              placeholder="e.g. Developer"
              value={formData.lead_developer}
              onChange={(e) => setFormData({ ...formData, lead_developer: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Tech stack & Deadline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">
              Technologies / Stack
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Node.js, Express, React, PostgreSQL"
                value={formData.technologies}
                onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
              />
              <Cpu className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">
              Audit Deadline
            </label>
            <div className="relative">
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
              />
              <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>

        {/* Security Controls notice */}
        <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-xs text-slate-300 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <p>
            Upon creation, the review will automatically be populated with all <strong>34 master security controls</strong> across 12 OWASP categories (XSS, CSRF, Auth, SQLi, Input Sanitization, Headers, etc.).
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-400 hover:text-white text-xs font-mono transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-medium shadow-lg shadow-cyan-900/30 transition disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" />
            {submitting ? 'Initializing Review...' : 'Create Security Review'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
