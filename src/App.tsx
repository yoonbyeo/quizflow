import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useCardSets } from './hooks/useCardSets';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import LibraryPage from './pages/LibraryPage';
import FoldersPage from './pages/FoldersPage';
import CreateSetPage from './pages/CreateSetPage';
import EditSetPage from './pages/EditSetPage';
import SetDetailPage from './pages/SetDetailPage';
import FlashcardPage from './pages/FlashcardPage';
import TestPage from './pages/TestPage';
import MatchPage from './pages/MatchPage';
import WritePage from './pages/WritePage';
import LearnPage from './pages/LearnPage';
import StatsPage from './pages/StatsPage';
import WrongNotePage from './pages/WrongNotePage';
import ProfilePage from './pages/ProfilePage';
import ReviewPage from './pages/ReviewPage';
import PrivacyPage from './pages/PrivacyPage';
import HelpPage from './pages/HelpPage';
import StudyRoomsPage from './pages/StudyRoomsPage';
import RoomDetailPage from './pages/RoomDetailPage';

function Spinner() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div className="spinner" />
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const {
    cardSets, folders, loading: setsLoading,
    createCardSet, updateCardSet, deleteCardSet, duplicateCardSet,
    addCard, updateCard, deleteCard, uploadCardImage, saveCardsForSet,
    upsertCardStat, resetStats,
    createFolder, updateFolder, deleteFolder,
  } = useCardSets(user?.id);

  if (authLoading) return <Spinner />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/*"
        element={
          <AuthGuard>
            <Layout user={user} cardSets={cardSets} folders={folders}>
              <Routes>
                <Route path="/" element={<HomePage cardSets={cardSets} folders={folders} loading={setsLoading} />} />
                <Route path="/library" element={<LibraryPage cardSets={cardSets} folders={folders} onDelete={deleteCardSet} onDuplicate={duplicateCardSet} />} />
                <Route path="/folders" element={<FoldersPage cardSets={cardSets} folders={folders} onCreate={createFolder} onUpdate={updateFolder} onDelete={deleteFolder} onMoveSet={updateCardSet} />} />
                <Route path="/create" element={<CreateSetPage onCreate={createCardSet} folders={folders} onUploadImage={uploadCardImage} />} />
                <Route path="/edit/:id" element={<EditSetPage cardSets={cardSets} folders={folders} onUpdateSet={updateCardSet} onAddCard={addCard} onUpdateCard={updateCard} onDeleteCard={deleteCard} onSaveCards={saveCardsForSet} onUploadImage={uploadCardImage} />} />
                <Route path="/set/:id" element={<SetDetailPage cardSets={cardSets} onResetStats={resetStats} />} />
                <Route path="/flashcard/:id" element={<FlashcardPage cardSets={cardSets} onUpdateStat={upsertCardStat} />} />
                <Route path="/test/:id" element={<TestPage cardSets={cardSets} onUpdateStat={upsertCardStat} />} />
                <Route path="/match/:id" element={<MatchPage cardSets={cardSets} onUpdateStat={upsertCardStat} />} />
                <Route path="/write/:id" element={<WritePage cardSets={cardSets} onUpdateStat={upsertCardStat} />} />
                <Route path="/learn/:id" element={<LearnPage cardSets={cardSets} onUpdateStat={upsertCardStat} />} />
                <Route path="/stats" element={<StatsPage cardSets={cardSets} />} />
                <Route path="/wrong-note" element={<WrongNotePage cardSets={cardSets} />} />
                <Route path="/review" element={<ReviewPage cardSets={cardSets} onUpdateStat={upsertCardStat} />} />
                <Route path="/profile" element={<ProfilePage user={user} />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="/rooms" element={<StudyRoomsPage user={user} />} />
                <Route path="/rooms/:roomId" element={<RoomDetailPage user={user} cardSets={cardSets} />} />
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
