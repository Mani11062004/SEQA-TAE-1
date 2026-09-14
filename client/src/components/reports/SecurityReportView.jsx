import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ScoreMeter } from '../common/ScoreMeter';
import { SeverityBadge, StatusBadge, RatingBadge, ControlStatusBadge } from '../common/Badge';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  ShieldCheck, 
  ShieldAlert, 
  Calendar, 
  FolderGit2, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileCode,
  FileCheck2,
  Lock
} from 'lucide-react';

export function SecurityReportView({ reviewId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfGenerating, setPdfGenerating] = useState(false);

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);
        const res = await api.getReviewById(reviewId);
        setData(res);
      } catch (err) {
        setError(err.message || 'Failed to generate report.');
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [reviewId]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    if (!data) return;
    setPdfGenerating(true);

    try {
      const { review, items, categories } = data;
      const doc = new jsPDF();

      // Palette
      const primaryDark = [10, 14, 23];
      const accentCyan = [6, 182, 212];
      const textLight = [240, 240, 240];

      // Document Title Header
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 38, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text('SOFTWARE SECURITY CODE REVIEW AUDIT REPORT', 14, 18);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(6, 182, 212);
      doc.text(`CONFIDENTIAL AUDIT • SECURESHIELD APPSC ENGINE v2.4`, 14, 26);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);

      // Audit Metadata Box
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);

      const metadata = [
        ['Review Title:', review.title],
        ['Target Project:', `${review.project_name} (${review.lead_developer || 'Developer'})`],
        ['Repository:', review.repository_url || 'Internal Enterprise Monorepo'],
        ['Security Auditor:', `${review.reviewer_name || 'Security Reviewer'} (${review.reviewer_email || ''})`],
        ['Audit Status:', `${review.status.toUpperCase()} (${review.completed_at ? new Date(review.completed_at).toLocaleDateString() : 'In Progress'})`],
        ['Overall Security Score:', `${Math.round(review.overall_score)}% - ${review.security_rating}`]
      ];

      autoTable(doc, {
        startY: 44,
        body: metadata,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', width: 45, textColor: [71, 85, 105] },
          1: { width: 145, textColor: [15, 23, 42] }
        }
      });

      let currentY = doc.lastAutoTable.finalY + 8;

      // Executive Summary
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('1. EXECUTIVE SUMMARY & AUDIT FINDINGS', 14, currentY);
      currentY += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);

      const execSummary = review.executive_summary || 'Review completed with security control verification against industry benchmarks.';
      const splitSummary = doc.splitTextToSize(execSummary, 180);
      doc.text(splitSummary, 14, currentY);
      currentY += (splitSummary.length * 4.5) + 6;

      // Recommendations
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('2. STRATEGIC REMEDIATION ROADMAP', 14, currentY);
      currentY += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      const recText = review.recommendations || 'Address flagged critical and high-severity findings prior to deployment.';
      const splitRec = doc.splitTextToSize(recText, 180);
      doc.text(splitRec, 14, currentY);
      currentY += (splitRec.length * 4.5) + 8;

      // Vulnerability Findings Table (Failed controls)
      const failedItems = items.filter(i => i.status === 'fail');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(`3. IDENTIFIED SECURITY VULNERABILITIES (${failedItems.length} Findings)`, 14, currentY);
      currentY += 4;

      if (failedItems.length > 0) {
        const failureRows = failedItems.map(f => [
          f.control_id,
          f.severity.toUpperCase(),
          f.requirement,
          f.file_path ? `${f.file_path}:${f.line_number || ''}` : 'Source repository',
          f.reviewer_notes || f.remediation || 'Requires remediation'
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [['ID', 'SEVERITY', 'SECURITY REQUIREMENT', 'LOCATION', 'EVIDENCE / NOTES']],
          body: failureRows,
          theme: 'striped',
          headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8 },
          styles: { fontSize: 8, cellPadding: 3 },
          columnStyles: {
            0: { width: 18, fontStyle: 'bold' },
            1: { width: 22, fontStyle: 'bold' },
            2: { width: 50 },
            3: { width: 40 },
            4: { width: 50 }
          }
        });
        currentY = doc.lastAutoTable.finalY + 8;
      } else {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.text('No critical, high, or medium security vulnerabilities were detected in this review.', 14, currentY + 4);
        currentY += 12;
      }

      // Check if page break needed
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      // Checklist Compliance Appendix
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('4. FULL SECURITY CHECKLIST APPENDIX (34 Controls)', 14, currentY);
      currentY += 4;

      const appendixRows = items.map(it => [
        it.control_id,
        it.category,
        it.requirement,
        it.severity.toUpperCase(),
        it.status === 'pass' ? 'PASSED' : (it.status === 'fail' ? 'FAILED' : 'NOT REVIEWED')
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['ID', 'CATEGORY', 'CONTROL REQUIREMENT', 'SEVERITY', 'STATUS']],
        body: appendixRows,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8 },
        styles: { fontSize: 7.5, cellPadding: 2 },
        columnStyles: {
          0: { width: 18, fontStyle: 'bold' },
          1: { width: 42 },
          2: { width: 75 },
          3: { width: 20 },
          4: { width: 25, fontStyle: 'bold' }
        }
      });

      // Save PDF
      const cleanTitle = review.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
      doc.save(`Security_Audit_Report_${cleanTitle}.pdf`);
    } catch (err) {
      console.error('PDF Generation failed:', err);
      alert(`PDF Export error: ${err.message}`);
    } finally {
      setPdfGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-slate-400">Compiling executive audit report...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-xl bg-rose-950/30 border border-rose-800 text-rose-300">
        <p className="font-semibold text-sm">Report Error</p>
        <p className="text-xs mt-1">{error || 'Could not load report.'}</p>
        <button onClick={onBack} className="mt-3 px-3 py-1.5 rounded bg-slate-800 text-white text-xs font-mono">
          ← Back to Reviews
        </button>
      </div>
    );
  }

  const { review, items, categories } = data;
  const failedItems = items.filter(i => i.status === 'fail');
  const passedItems = items.filter(i => i.status === 'pass');

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Action Navigation Header (Hidden during Print) */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyan-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Workspace
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition border border-slate-700"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
          <button
            disabled={pdfGenerating}
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white text-xs font-mono font-bold shadow-lg shadow-cyan-900/30 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {pdfGenerating ? 'Compiling PDF...' : 'Download PDF Report'}
          </button>
        </div>
      </div>

      {/* Main Printable Document Card */}
      <div className="bg-[#0e1422] border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 print:bg-white print:text-black print:p-0 print:border-0 print:shadow-none">
        {/* Document Header */}
        <div className="border-b border-slate-800 pb-6 print:border-black">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold tracking-wider uppercase mb-1">
                <Lock className="w-4 h-4" />
                <span>Confidential Security Audit Evaluation</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight print:text-black">
                Software Security Code Review Report
              </h1>
              <p className="text-xs text-slate-400 mt-1 print:text-slate-600">
                Formal security assessment conducted against OWASP Top 10 & CWE secure coding standards
              </p>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <RatingBadge rating={review.security_rating} className="text-sm px-4 py-2" />
            </div>
          </div>
        </div>

        {/* Telemetry & Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 print:bg-slate-50 print:border-slate-300">
          <div className="space-y-1 text-xs font-mono">
            <span className="text-slate-400">Review Title:</span>
            <p className="font-semibold text-white text-sm print:text-black">{review.title}</p>
            <span className="text-slate-400 block pt-1">Target Repository:</span>
            <p className="text-cyan-400 break-all">{review.repository_url || review.project_name}</p>
          </div>

          <div className="space-y-1 text-xs font-mono">
            <span className="text-slate-400">Lead Developer:</span>
            <p className="font-semibold text-slate-200 print:text-black">{review.lead_developer || 'Developer'}</p>
            <span className="text-slate-400 block pt-1">Security Auditor:</span>
            <p className="font-semibold text-slate-200 print:text-black">{review.reviewer_name || 'Security Reviewer'}</p>
            <span className="text-slate-400 block pt-1">Audit Date:</span>
            <p className="text-slate-300 print:text-slate-700">
              {review.completed_at ? new Date(review.completed_at).toLocaleDateString() : new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Score Display */}
          <div className="flex items-center justify-center sm:justify-end">
            <ScoreMeter 
              score={review.overall_score} 
              rating={review.security_rating} 
              size="lg" 
            />
          </div>
        </div>

        {/* Metrics Counters Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 print:border-slate-300">
            <span className="text-[11px] font-mono uppercase text-slate-400">Total Controls</span>
            <div className="text-xl font-bold font-mono text-white print:text-black">{items.length}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40 print:border-slate-300">
            <span className="text-[11px] font-mono uppercase text-emerald-400">Passed Controls</span>
            <div className="text-xl font-bold font-mono text-emerald-400">{passedItems.length}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40 print:border-slate-300">
            <span className="text-[11px] font-mono uppercase text-rose-400">Critical Risks</span>
            <div className="text-xl font-bold font-mono text-rose-400">{review.critical_risks}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-orange-950/20 border border-orange-900/40 print:border-slate-300">
            <span className="text-[11px] font-mono uppercase text-orange-400">High Risks</span>
            <div className="text-xl font-bold font-mono text-orange-400">{review.high_risks}</div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-2">
          <h2 className="text-base font-bold text-white tracking-wide border-b border-slate-800 pb-2 print:text-black">
            1. Executive Audit Summary
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line print:text-slate-800 font-sans">
            {review.executive_summary || 'The software code submission was evaluated across 12 standardized cybersecurity control domains. Compliance score was computed based on severity weights.'}
          </p>
        </div>

        {/* Recommendations */}
        <div className="space-y-2">
          <h2 className="text-base font-bold text-white tracking-wide border-b border-slate-800 pb-2 print:text-black">
            2. Strategic Remediation Roadmap
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line print:text-slate-800 font-sans">
            {review.recommendations || 'Address all flagged critical and high-severity findings immediately. Re-test affected endpoints and verify parameterized inputs prior to production deployment.'}
          </p>
        </div>

        {/* Category Compliance Breakdown */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-white tracking-wide border-b border-slate-800 pb-2 print:text-black">
            3. Category Compliance Distribution (12 OWASP Domains)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map(cat => {
              const pct = cat.total > 0 ? Math.round((cat.passed / cat.total) * 100) : 0;
              return (
                <div key={cat.category} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 print:border-slate-300 space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-semibold text-slate-200 print:text-black">{cat.category}</span>
                    <span className={pct === 100 ? 'text-emerald-400' : (pct < 60 ? 'text-rose-400' : 'text-amber-400')}>
                      {pct}% ({cat.passed}/{cat.total})
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        pct === 100 ? 'bg-emerald-500' : (pct < 60 ? 'bg-rose-500' : 'bg-amber-500')
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Vulnerability Findings (Failed Controls) */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white tracking-wide border-b border-slate-800 pb-2 flex items-center justify-between print:text-black">
            <span>4. Detailed Security Vulnerabilities & Evidence ({failedItems.length} Findings)</span>
            <span className="text-xs font-mono text-rose-400 font-normal">
              {review.critical_risks} Critical • {review.high_risks} High
            </span>
          </h2>

          {failedItems.length > 0 ? (
            <div className="space-y-4">
              {failedItems.map((item, idx) => (
                <div 
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-900 border border-rose-900/50 print:bg-white print:border-slate-300 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 print:text-black">
                        #{idx + 1} [{item.control_id}]
                      </span>
                      <SeverityBadge severity={item.severity} />
                      {item.cwe_id && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 print:text-black">
                          {item.cwe_id}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      {item.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white print:text-black">
                      {item.requirement}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5 print:text-slate-700">
                      {item.explanation}
                    </p>
                  </div>

                  {/* Evidence & File location */}
                  <div className="p-3 rounded-lg bg-black/40 border border-slate-800 font-mono text-xs space-y-1.5 print:bg-slate-100 print:border-slate-300">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Location: <strong className="text-slate-200 print:text-black">{item.file_path || 'Repository Source'}:{item.line_number || 'N/A'}</strong></span>
                      <span className="text-rose-400">FAILED VULNERABILITY</span>
                    </div>
                    {item.evidence && (
                      <pre className="p-2 rounded bg-black/60 text-rose-300 text-[11px] overflow-x-auto whitespace-pre print:bg-slate-200 print:text-black">
                        {item.evidence}
                      </pre>
                    )}
                  </div>

                  {item.reviewer_notes && (
                    <div className="text-xs text-slate-300 pl-3 border-l-2 border-rose-500 print:text-black">
                      <strong className="text-slate-400 font-mono">Reviewer Finding: </strong>
                      {item.reviewer_notes}
                    </div>
                  )}

                  {item.remediation && (
                    <div className="text-xs text-emerald-300 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-900/40 print:bg-slate-50 print:text-black print:border-slate-300">
                      <strong className="text-emerald-400 font-mono">Recommended Fix: </strong>
                      {item.remediation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-center text-xs font-mono text-emerald-400">
              ✓ No security controls failed in this review. All verified controls comply with security policy.
            </div>
          )}
        </div>

        {/* Complete Checklist Appendix */}
        <div className="space-y-3 pt-4 border-t border-slate-800 print:border-black print-page-break">
          <h2 className="text-base font-bold text-white tracking-wide print:text-black">
            5. Complete Checklist Controls Audit Matrix (Appendix)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-mono uppercase text-slate-400 print:bg-slate-100 print:text-black">
                <tr>
                  <th className="py-2.5 px-3">Control ID</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Security Requirement</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3 text-right">Evaluation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans print:divide-slate-300">
                {items.map(it => (
                  <tr key={it.id} className="hover:bg-slate-850/40 transition">
                    <td className="py-2 px-3 font-mono font-bold text-cyan-400 print:text-black">
                      {it.control_id}
                    </td>
                    <td className="py-2 px-3 text-slate-400 print:text-slate-700">
                      {it.category}
                    </td>
                    <td className="py-2 px-3 text-slate-200 print:text-black font-medium">
                      {it.requirement}
                    </td>
                    <td className="py-2 px-3">
                      <SeverityBadge severity={it.severity} />
                    </td>
                    <td className="py-2 px-3 text-right">
                      <ControlStatusBadge status={it.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Sign-off Signature Block */}
        <div className="pt-8 border-t border-slate-800 grid grid-cols-2 gap-8 text-xs font-mono text-slate-400 print:border-black">
          <div>
            <p className="font-semibold text-slate-200 print:text-black">Lead Security Auditor Sign-Off:</p>
            <div className="mt-8 pt-2 border-t border-slate-700 w-48 print:border-black">
              <p className="text-white print:text-black font-bold">{review.reviewer_name || 'Security Reviewer'}</p>
              <p className="text-[10px] text-slate-500">Security Reviewer</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-slate-200 print:text-black">Development Lead Acknowledgment:</p>
            <div className="mt-8 pt-2 border-t border-slate-700 w-48 ml-auto print:border-black">
              <p className="text-white print:text-black font-bold">{review.lead_developer || 'Developer'}</p>
              <p className="text-[10px] text-slate-500">Developer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
