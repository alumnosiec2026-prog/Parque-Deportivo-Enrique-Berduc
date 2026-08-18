/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MainSite } from './components/MainSite';
import { AdminDashboard } from './components/AdminDashboard';
import { ChatBot } from './components/ChatBot';

export default function App() {
  const [currentSection, setCurrentSection] = useState<'portal' | 'admin'>('portal');

  // Monitorero simple de Hash para enrutamiento exacto solicitado
  useEffect(() => {
    const handleHashPath = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/admin')) {
        setCurrentSection('admin');
      } else {
        setCurrentSection('portal');
      }
    };

    window.addEventListener('hashchange', handleHashPath);
    // Verificar estado inicial al cargar
    handleHashPath();

    return () => {
      window.removeEventListener('hashchange', handleHashPath);
    };
  }, []);

  const handleGoToAdmin = () => {
    window.location.hash = '#/admin';
    setCurrentSection('admin');
  };

  const handleGoToPortal = () => {
    window.location.hash = '#/';
    setCurrentSection('portal');
  };

  return (
    <div className="relative min-h-screen bg-[#f6f9fc]">
      {currentSection === 'admin' ? (
        <AdminDashboard onBackToSite={handleGoToPortal} />
      ) : (
        <MainSite onGoToAdmin={handleGoToAdmin} />
      )}

      {/* Burbuja de Chat flotante asistencial con webhook integrado */}
      <ChatBot />
    </div>
  );
}
