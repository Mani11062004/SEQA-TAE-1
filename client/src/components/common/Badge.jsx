import React from 'react';

export function SeverityBadge({ severity, className = '' }) {
  const sev = (severity || 'low').toLowerCase();

  const styles = {
    critical: 'bg-rose-950/70 text-rose-300 border-rose-600/50 shadow-sm shadow-rose-900/30',
    high: 'bg-orange-950/70 text-orange-300 border-orange-600/50 shadow-sm shadow-orange-900/30',
    medium: 'bg-amber-950/70 text-amber-300 border-amber-600/50',
    low: 'bg-blue-950/70 text-blue-300 border-blue-600/50'
  };

  const labels = {
    critical: 'CRITICAL',
    high: 'HIGH',
    medium: 'MEDIUM',
    low: 'LOW'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold tracking-wider border ${styles[sev] || styles.low} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        sev === 'critical' ? 'bg-rose-500 animate-pulse' :
        sev === 'high' ? 'bg-orange-500' :
        sev === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
      }`}></span>
      {labels[sev] || severity}
    </span>
  );
}

export function StatusBadge({ status, className = '' }) {
  const stat = (status || 'pending').toLowerCase();

  const styles = {
    completed: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40',
    in_progress: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40',
    pending: 'bg-amber-950/60 text-amber-300 border-amber-500/40'
  };

  const labels = {
    completed: 'Completed',
    in_progress: 'In Progress',
    pending: 'Pending Review'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[stat] || styles.pending} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        stat === 'completed' ? 'bg-emerald-400' :
        stat === 'in_progress' ? 'bg-cyan-400 animate-ping' : 'bg-amber-400'
      }`}></span>
      {labels[stat] || status}
    </span>
  );
}

export function ControlStatusBadge({ status }) {
  const stat = (status || 'not_reviewed').toLowerCase();

  if (stat === 'pass') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded bg-emerald-900/40 text-emerald-400 text-xs font-semibold border border-emerald-700/50">
        ✓ PASSED
      </span>
    );
  }
  if (stat === 'fail') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded bg-rose-900/40 text-rose-400 text-xs font-semibold border border-rose-700/50 animate-pulse">
        ✕ FAILED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded bg-slate-800 text-slate-400 text-xs font-semibold border border-slate-700">
      ○ NOT REVIEWED
    </span>
  );
}

export function RatingBadge({ rating, className = '' }) {
  let color = 'bg-slate-800 text-slate-300 border-slate-700';

  if (!rating || rating === 'Not Rated') {
    color = 'bg-slate-800 text-slate-400 border-slate-700';
  } else if (rating.includes('Compliant') || rating.includes('(A)')) {
    color = 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50 shadow-sm shadow-emerald-900/40';
  } else if (rating.includes('Good') || rating.includes('(B)')) {
    color = 'bg-cyan-950/80 text-cyan-400 border-cyan-500/50';
  } else if (rating.includes('Moderate') || rating.includes('(C)')) {
    color = 'bg-amber-950/80 text-amber-400 border-amber-500/50';
  } else if (rating.includes('High Risk') || rating.includes('(D)')) {
    color = 'bg-orange-950/80 text-orange-400 border-orange-500/50';
  } else if (rating.includes('Critical') || rating.includes('(F)')) {
    color = 'bg-rose-950/80 text-rose-400 border-rose-500/50 shadow-md shadow-rose-900/40';
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-mono font-bold tracking-wide border ${color} ${className}`}>
      {rating || 'Not Rated'}
    </span>
  );
}
