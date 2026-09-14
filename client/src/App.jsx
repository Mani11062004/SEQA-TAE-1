import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { AuthModal } from './components/auth/AuthModal';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { ReviewerDashboard } from './components/dashboard/ReviewerDashboard';
import { ReviewList } from './components/reviews/ReviewList';
import { NewReviewModal } from './components/reviews/NewReviewModal';
import { ReviewWorkspace } from './components/checklist/ReviewWorkspace';
import { SecurityReportView } from './components/reports/SecurityReportView';
import { ProjectsView } from './components/projects/ProjectsView';
import { MasterChecklistGuide } from './components/checklist/MasterChecklistGuide';
import { AuditTrailView } from './components/audits/AuditTrailView';
import { ErrorBoundary } from './components/common/ErrorBoundary';

function AppContent() {
  const { user, isAdmin, isReviewer, isDeveloper, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeReviewId, setActiveReviewId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNewReviewModalOpen, setIsNewReviewModalOpen] = useState(false);

  const handleSelectReview = (id) => {
    setActiveReviewId(id);
    setCurrentView('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectReport = (id) => {
    setActiveReviewId(id);
    setCurrentView('report');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToReviews = () => {
    setActiveReviewId(null);
    setCurrentView('reviews');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReviewCreated = (newReview) => {
    setActiveReviewId(newReview.id);
    setCurrentView('workspace');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-cyan-400">Initializing SecureShield AppSec Platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100 flex flex-col font-sans cyber-grid selection:bg-cyan-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentView={currentView}
          onSelectView={(view) => {
            setCurrentView(view);
            setActiveReviewId(null);
          }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onNewReviewClick={() => setIsNewReviewModalOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-64 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {currentView === 'dashboard' && (
            isAdmin ? (
              <AdminDashboard 
                onSelectReview={handleSelectReview}
                onSelectReport={handleSelectReport}
                onNewReviewClick={() => setIsNewReviewModalOpen(true)}
              />
            ) : (
              <ReviewerDashboard 
                onSelectReview={handleSelectReview}
                onSelectReport={handleSelectReport}
              />
            )
          )}

          {currentView === 'reviews' && (
            <ReviewList
              onSelectReview={handleSelectReview}
              onSelectReport={handleSelectReport}
              onNewReviewClick={() => setIsNewReviewModalOpen(true)}
            />
          )}

          {currentView === 'workspace' && activeReviewId && (
            <ReviewWorkspace
              reviewId={activeReviewId}
              onBack={handleBackToReviews}
              onSelectReport={handleSelectReport}
            />
          )}

          {currentView === 'report' && activeReviewId && (
            <SecurityReportView
              reviewId={activeReviewId}
              onBack={() => setCurrentView('workspace')}
            />
          )}

          {currentView === 'projects' && (
            <ProjectsView
              onSelectReview={handleSelectReview}
            />
          )}

          {currentView === 'checklist_guide' && (
            <MasterChecklistGuide />
          )}

          {currentView === 'audits' && (
            <AuditTrailView />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="w-full bg-[#070b12] border-t border-slate-800/80 py-3 px-4 text-center z-30 lg:pl-64 no-print">
        <p className="text-xs font-mono text-slate-500">
          SecureShield AppSec Platform • Software Security Code Review Checklist
        </p>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <NewReviewModal
        isOpen={isNewReviewModalOpen}
        onClose={() => setIsNewReviewModalOpen(false)}
        onReviewCreated={handleReviewCreated}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
