import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { MenuIcon } from './icons/MenuIcon';
import { CloseIcon } from './icons/CloseIcon';
import type { Page } from '../App';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { BarChartIcon } from './icons/BarChartIcon';
import { UsersIcon } from './icons/UsersIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { TableIcon } from './icons/TableIcon';
import { FootballIcon } from './icons/FootballIcon';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { currentPage, setCurrentPage, isShareMode } = useData();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    if (isMenuOpen && !isDesktop) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen, isDesktop]);

  const navLinks: { page: Page; label: string; icon: React.ReactNode }[] = [
    { page: 'recorder', label: 'Registro', icon: <ClipboardIcon /> },
    { page: 'stats', label: 'Estadísticas', icon: <BarChartIcon /> },
    { page: 'table', label: 'Tabla', icon: <TableIcon /> },
    { page: 'squad', label: 'Plantel', icon: <UsersIcon /> },
    { page: 'coach', label: 'Entrenador IA', icon: <ChatBubbleIcon /> },
    { page: 'settings', label: 'Configuración', icon: <SettingsIcon /> },
  ];

  const filteredNavLinks = isShareMode ? navLinks.filter(link => link.page !== 'settings' && link.page !== 'recorder') : navLinks;
  
  const handleOpenMenu = useCallback(() => {
    setIsAnimatingOut(false);
    setIsMenuOpen(true);
  }, []);
  
  const handleCloseMenu = useCallback(() => {
    setIsAnimatingOut(true);
    // Use a timer that matches the CSS animation duration
    setTimeout(() => {
        setIsMenuOpen(false);
    }, 300); // 0.3s animation
  }, []);

  const handleNavClick = useCallback((page: Page) => {
    setCurrentPage(page);
    handleCloseMenu();
  }, [setCurrentPage, handleCloseMenu]);
  
  const styles: { [key: string]: React.CSSProperties } = {
    header: {
      backgroundColor: theme.colors.surface,
      padding: '0.5rem 2rem',
      borderBottom: `1px solid ${theme.colors.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      boxSizing: 'border-box',
      zIndex: 1000,
      boxShadow: theme.shadows.medium,
      height: '65px',
    },
    logoContainer: { display: 'flex', alignItems: 'center', gap: '1rem' },
    title: { fontSize: '1.25rem', fontWeight: 700, color: theme.colors.primaryText, margin: 0, whiteSpace: 'nowrap' },
    aiText: { 
        display: 'inline-block',
        color: theme.colors.accent1,
        background: `linear-gradient(90deg, ${theme.colors.accent1}, ${theme.colors.accent2})`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontWeight: 900 
    },
    rightSection: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
    desktopNav: {
      display: 'flex',
      borderRadius: theme.borderRadius.medium,
      border: `1px solid ${theme.colors.borderStrong}`,
      overflow: 'hidden',
    },
    navButton: {
      background: 'none',
      border: 'none',
      borderRight: `1px solid ${theme.colors.borderStrong}`,
      color: theme.colors.secondaryText,
      padding: '0.5rem 1rem',
      cursor: 'pointer',
      fontWeight: 600,
      fontSize: '0.8rem',
      transition: 'background-color 0.2s, color 0.2s',
    },
    navButtonLast: {
      borderRight: 'none',
    },
    navButtonActive: {
      backgroundColor: theme.colors.borderStrong,
      color: theme.colors.primaryText,
    },
    iconButton: { background: 'none', border: 'none', color: theme.colors.secondaryText, cursor: 'pointer', padding: theme.spacing.small, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' },
    menuBackdrop: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1998 },
    sidePanelMenu: { position: 'fixed', top: 0, right: 0, width: 'clamp(250px, 75vw, 320px)', height: '100%', background: theme.colors.surface, zIndex: 1999, display: 'flex', flexDirection: 'column', boxShadow: theme.shadows.large },
    menuHeader: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '0.5rem 1rem', borderBottom: `1px solid ${theme.colors.border}`, height: '65px' },
    mobileNav: { display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem', padding: '1rem', flex: 1 },
    mobileNavButton: {
        background: 'none', border: 'none', color: theme.colors.secondaryText,
        cursor: 'pointer', fontWeight: 600, fontSize: '1.1rem', padding: '1rem',
        borderRadius: theme.borderRadius.medium, transition: 'color 0.2s, background-color 0.2s',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
        gap: '1rem',
    },
    mobileNavButtonActive: { color: theme.colors.primaryText, backgroundColor: theme.colors.borderStrong, fontWeight: 700 },
  };

  return (
    <>
      <style>{`
          @keyframes menuSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
          @keyframes menuSlideOut { from { transform: translateX(0); } to { transform: translateX(100%); } }
          @keyframes backdropFadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes backdropFadeOut { from { opacity: 1; } to { opacity: 0; } }
          @keyframes navLinkFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

          .backdrop-anim-in { animation: backdropFadeIn 0.3s ease-out forwards; }
          .backdrop-anim-out { animation: backdropFadeOut 0.3s ease-out forwards; }
          .menu-anim-in { animation: menuSlideIn 0.3s ease-out forwards; }
          .menu-anim-out { animation: menuSlideOut 0.3s ease-out forwards; }
          .nav-link-anim { 
            animation: navLinkFadeIn 0.4s ease-out forwards;
            opacity: 0;
          }
        `}</style>
      <header style={styles.header}>
        <div style={styles.logoContainer}>
          <FootballIcon size={32} color={theme.colors.accent1} />
          <h1 style={styles.title}>MyTeam<span style={styles.aiText}>Stats</span></h1>
        </div>
        <div style={styles.rightSection}>
          {isDesktop && (
            <nav style={styles.desktopNav}>
              {filteredNavLinks.map(({ page, label }, index) => {
                  let buttonStyle = {...styles.navButton};
                  if (index === filteredNavLinks.length - 1) {
                    buttonStyle = {...buttonStyle, ...styles.navButtonLast};
                  }
                  if (currentPage === page) {
                    buttonStyle = {...buttonStyle, ...styles.navButtonActive};
                  }
                  
                  return (
                    <button key={page} style={buttonStyle} onClick={() => handleNavClick(page)} aria-current={currentPage === page}>{label}</button>
                  )
              })}
            </nav>
          )}
          <button onClick={toggleTheme} style={styles.iconButton} aria-label="Cambiar tema">{theme.name === 'dark' ? <SunIcon /> : <MoonIcon />}</button>
          
          {!isDesktop && (
            <button onClick={handleOpenMenu} style={styles.iconButton} aria-label="Abrir menú"><MenuIcon color={theme.colors.primaryText} /></button>
          )}
        </div>
      </header>
      {!isDesktop && isMenuOpen && (
        <>
          <div style={styles.menuBackdrop} className={isAnimatingOut ? 'backdrop-anim-out' : 'backdrop-anim-in'} onClick={handleCloseMenu} />
          <div style={styles.sidePanelMenu} className={isAnimatingOut ? 'menu-anim-out' : 'menu-anim-in'}>
            <div style={styles.menuHeader}><button onClick={handleCloseMenu} style={styles.iconButton} aria-label="Cerrar menú"><CloseIcon color={theme.colors.primaryText} size={28} /></button></div>
            <nav style={styles.mobileNav}>
              {filteredNavLinks.map(({ page, label, icon }, index) => {
                const isActive = currentPage === page;
                const buttonStyle = isActive ? { ...styles.mobileNavButton, ...styles.mobileNavButtonActive } : styles.mobileNavButton;
                return (
                    <button 
                        key={page} 
                        className="nav-link-anim"
                        style={{ ...buttonStyle, animationDelay: `${index * 0.07}s` }} 
                        onClick={() => handleNavClick(page)} 
                        aria-current={isActive}
                    >
                        <span>{icon}</span>
                        <span>{label}</span>
                    </button>
                )
              })}
            </nav>
          </div>
        </>
      )}
    </>
  );
};

export default Header;