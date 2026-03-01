import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useCardSets } from './hooks/useCardSets';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import LibraryPage from './pages/LibraryPage';
import CreateSetPage from './pages/CreateSetPage';
import EditSetPage from './pages/EditSetPage';
import SetDetailPage from './pages/SetDetailPage';
import FlashcardPage from './pages/FlashcardPage';
import TestPage from './pages/TestPage';
import MatchPage from './pages/MatchPage';
import WritePage from './pages/WritePage';
import StatsPage from './pages/StatsPage';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const {
    cardSets,
    loading: setsLoading,
    createCardSet,
    updateCardSet,
    deleteCardSet,
    duplicateCardSet,
    addCard,
    updateCard,
    deleteCard,
    upsertCardStat,
    resetStats,
    saveCardsForSet,
  } = useCardSets(user?.id);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />

      <Route
        path="/*"
        element={
          <AuthGuard>
            <Layout user={user} cardSets={cardSets}>
              <Routes>
                <Route path="/" element={<HomePage cardSets={cardSets} loading={setsLoading} />} />
                <Route
                  path="/library"
                  element={
                    <LibraryPage
                      cardSets={cardSets}
                      onDelete={deleteCardSet}
                      onDuplicate={duplicateCardSet}
                    />
                  }
                />
                <Route
                  path="/create"
                  element={<CreateSetPage onCreate={createCardSet} />}
                />
                <Route
                  path="/edit/:id"
                  element={
                    <EditSetPage
                      cardSets={cardSets}
                      onUpdateSet={updateCardSet}
                      onAddCard={addCard}
                      onUpdateCard={updateCard}
                      onDeleteCard={deleteCard}
                      onSaveCards={saveCardsForSet}
                    />
                  }
                />
                <Route
                  path="/set/:id"
                  element={
                    <SetDetailPage
                      cardSets={cardSets}
                      onResetStats={resetStats}
                    />
                  }
                />
                <Route
                  path="/study/:id/flashcard"
                  element={<FlashcardPage cardSets={cardSets} onUpdateStat={upsertCardStat} />}
                />
                <Route
                  path="/study/:id/test"
                  element={<TestPage cardSets={cardSets} onUpdateStat={upsertCardStat} />}
                />
                <Route
                  path="/study/:id/match"
                  element={<MatchPage cardSets={cardSets} onUpdateStat={upsertCardStat} />}
                />
                <Route
                  path="/study/:id/write"
                  element={<WritePage cardSets={cardSets} onUpdateStat={upsertCardStat} />}
                />
                <Route path="/stats" element={<StatsPage cardSets={cardSets} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </AuthGuard>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
