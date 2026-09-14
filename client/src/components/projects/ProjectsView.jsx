import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { 
  FolderGit2, 
  Plus, 
  ExternalLink, 
  ShieldCheck, 
  Cpu, 
  User, 
  FileCode, 
  Trash2,
  Edit2
} from 'lucide-react';

export function ProjectsView({ onSelectReview }) {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    repository_url: '',
    description: '',
    technologies: '',
    lead_developer: ''
  });

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.getProjects();
      setProjects(res.projects || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleOpenAdd = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      repository_url: '',
      description: '',
      technologies: '',
      lead_developer: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProject(p);
    setFormData({
      name: p.name,
      repository_url: p.repository_url || '',
      description: p.description || '',
      technologies: p.technologies || '',
      lead_developer: p.lead_developer || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await api.updateProject(editingProject.id, formData);
      } else {
        await api.createProject(formData);
      }
      setIsModalOpen(false);
      fetchProjects();
    } catch (err) {
      alert(`Error saving project: ${err.message}`);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete project "${name}" and all its security reviews?`)) return;
    try {
      await api.deleteProject(id);
      fetchProjects();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-cyan-400" />
            Monitored Projects & Repositories
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage target software codebases, tech stacks, and repository leads under security oversight.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-medium shadow-lg shadow-cyan-900/30 transition"
          >
            <Plus className="w-4 h-4" />
            Register Codebase
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map(p => (
            <div 
              key={p.id}
              className="p-5 rounded-2xl bg-[#0e1422] border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400">
                    <FolderGit2 className="w-5 h-5" />
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1 rounded text-slate-400 hover:text-white transition"
                        title="Edit Project"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <h2 className="text-base font-bold text-white tracking-wide">
                  {p.name}
                </h2>

                {p.repository_url && (
                  <a 
                    href={p.repository_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-mono text-cyan-400 hover:underline mt-1 truncate max-w-full"
                  >
                    <span>{p.repository_url}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                  {p.description || 'No description provided.'}
                </p>

                {p.technologies && (
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono text-slate-300">
                    <Cpu className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span className="truncate">{p.technologies}</span>
                  </div>
                )}

                <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                  <User className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <span>Lead: <strong className="text-slate-300">{p.lead_developer || 'Unassigned'}</strong></span>
                </div>
              </div>

              {/* Stats Footer */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">
                  {p.review_count} {p.review_count === 1 ? 'Audit' : 'Audits'} ({p.completed_reviews} done)
                </span>
                {p.avg_score !== null ? (
                  <span className="text-emerald-400 font-bold">
                    {p.avg_score}% Avg
                  </span>
                ) : (
                  <span className="text-slate-500">Unscored</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProject ? 'Edit Repository Project' : 'Register Monitored Codebase'}
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">Project Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Identity Management Service"
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">Repository URL</label>
            <input
              type="url"
              value={formData.repository_url}
              onChange={(e) => setFormData({ ...formData, repository_url: e.target.value })}
              placeholder="https://github.com/organization/repository"
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">Technologies & Frameworks</label>
            <input
              type="text"
              value={formData.technologies}
              onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
              placeholder="e.g. React, Node.js, Express, PostgreSQL, JWT"
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">Lead Developer</label>
            <input
              type="text"
              value={formData.lead_developer}
              onChange={(e) => setFormData({ ...formData, lead_developer: e.target.value })}
              placeholder="e.g. Developer"
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">Description & Scope</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide context regarding business critical functionality, compliance requirements, etc."
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-white text-xs font-mono transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-medium shadow-md shadow-cyan-950 transition"
            >
              {editingProject ? 'Save Changes' : 'Register Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
