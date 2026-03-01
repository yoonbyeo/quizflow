import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import HomePage from './pages/HomePage';
import CreateSetPage from './pages/CreateSetPage';
import EditSetPage from './pages/EditSetPage';
import SetDetailPage from './pages/SetDetailPage';
import FlashcardPage from './pages/FlashcardPage';
import TestPage from './pages/TestPage';
import MatchPage from './pages/MatchPage';
import WritePage from './pages/WritePage';
import StatsPage from './pages/StatsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreateSetPage />} />
        <Route path="/edit/:id" element={<EditSetPage />} />
        <Route path="/set/:id" element={<SetDetailPage />} />
        <Route path="/study/:id/flashcard" element={<FlashcardPage />} />
        <Route path="/study/:id/test" element={<TestPage />} />
        <Route path="/study/:id/match" element={<MatchPage />} />
        <Route path="/study/:id/write" element={<WritePage />} />
        <Route path="/stats" element={<StatsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
