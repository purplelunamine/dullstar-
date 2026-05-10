/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { AlbumDetail } from './pages/AlbumDetail';
import { Discography } from './pages/Discography';
import { Admin } from './pages/Admin';
import { Search } from './pages/Search';
import { LyricsProvider } from './contexts/LyricsContext';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <LyricsProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="album/:albumId" element={<AlbumDetail />} />
              <Route path="discography" element={<Discography />} />
              <Route path="search" element={<Search />} />
              <Route path="admin" element={<Admin />} />
            </Route>
          </Routes>
        </Router>
      </LyricsProvider>
    </AuthProvider>
  );
}

