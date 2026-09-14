import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { SeverityBadge } from '../common/Badge';
import { 
  BookOpen, 
  Search, 
  Code2, 
  Copy, 
  Check, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  Info
} from 'lucide-react';

export function MasterChecklistGuide() {
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedKey, setCopiedKey] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());

  useEffect(() => {
    async function loadGuide() {
      try {
        setLoading(true);
        const res = await api.getMasterChecklist();
        setControls(res.controls || []);
      } catch (err) {
        setError(err.message || 'Failed to load master checklist.');
      } finally {
        setLoading(false);
      }
    }
    loadGuide();
  }, []);

  const categories = Array.from(new Set(controls.map(c => c.category)));

  const filteredControls = controls.filter(c => {
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const inReq = c.requirement.toLowerCase().includes(q);
      const inExpl = c.explanation.toLowerCase().includes(q);
      const inCwe = (c.cwe_id || '').toLowerCase().includes(q);
      const inCtrl = c.control_id.toLowerCase().includes(q);
      if (!inReq && !inExpl && !inCwe && !inCtrl) return false;
    }
    return true;
  });

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copySnippet = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
            AppSec Knowledge Base & Verification Reference
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Master Security Controls Catalog
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Comprehensive benchmark of 34 security controls across 12 OWASP categories with CWE mappings, risk weights, and side-by-side vulnerable vs secure code examples.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-xl bg-[#0e1422] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by keyword, requirement, or CWE (e.g. CWE-79, CWE-89, XSS, CSRF)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
        >
          <option value="all">All Categories ({controls.length} controls)</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Controls Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredControls.map(c => {
            const isExpanded = expandedIds.has(c.id);

            return (
              <div 
                key={c.id}
                className="p-5 rounded-2xl bg-[#0e1422] border border-slate-800 hover:border-slate-700 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      {c.control_id}
                    </span>
                    <SeverityBadge severity={c.severity} />
                    {c.cwe_id && (
                      <a 
                        href={`https://cwe.mitre.org/data/definitions/${c.cwe_id.replace('CWE-', '')}.html`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-300 hover:underline border border-slate-800 inline-flex items-center gap-1"
                      >
                        <span>{c.cwe_id}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                    <span className="text-[11px] font-mono text-slate-400">
                      Domain: <strong className="text-slate-300">{c.category}</strong>
                    </span>
                  </div>

                  <div className="text-xs font-mono text-slate-400">
                    Scoring Weight: <strong className="text-white">{c.weight} pts</strong>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    {c.requirement}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {c.explanation}
                  </p>
                </div>

                {c.remediation && (
                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                    <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-cyan-300 font-mono">Remediation Policy: </strong>
                      {c.remediation}
                    </div>
                  </div>
                )}

                {/* Collapsible Code Patterns */}
                {(c.code_example_vulnerable || c.code_example_safe) && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => toggleExpand(c.id)}
                      className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>{isExpanded ? 'Collapse Code Examples' : 'Inspect Vulnerable vs Secure Code Patterns'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
                        {/* Vulnerable Example */}
                        {c.code_example_vulnerable && (
                          <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/50 space-y-1.5">
                            <div className="flex items-center justify-between text-rose-400 text-xs font-bold">
                              <span>✕ Vulnerable Pattern</span>
                              <button
                                type="button"
                                onClick={() => copySnippet(c.code_example_vulnerable, `v_${c.id}`)}
                                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                              >
                                {copiedKey === `v_${c.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedKey === `v_${c.id}` ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>
                            <pre className="p-2.5 rounded bg-black/60 text-rose-200 overflow-x-auto whitespace-pre">
                              {c.code_example_vulnerable}
                            </pre>
                          </div>
                        )}

                        {/* Safe Example */}
                        {c.code_example_safe && (
                          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/50 space-y-1.5">
                            <div className="flex items-center justify-between text-emerald-400 text-xs font-bold">
                              <span>✓ Secure / Remediation Pattern</span>
                              <button
                                type="button"
                                onClick={() => copySnippet(c.code_example_safe, `s_${c.id}`)}
                                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                              >
                                {copiedKey === `s_${c.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedKey === `s_${c.id}` ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>
                            <pre className="p-2.5 rounded bg-black/60 text-emerald-200 overflow-x-auto whitespace-pre">
                              {c.code_example_safe}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
