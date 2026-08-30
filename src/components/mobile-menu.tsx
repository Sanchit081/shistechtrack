"use client";

import { useState } from "react";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (sidebar) {
      sidebar.classList.toggle('active');
    }
    if (overlay) {
      overlay.classList.toggle('active');
    }
  };

  const closeMenu = () => {
    setIsOpen(false);
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (sidebar) {
      sidebar.classList.remove('active');
    }
    if (overlay) {
      overlay.classList.remove('active');
    }
  };

  return (
    <>
      <button 
        className="mobile-menu-btn" 
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        ☰
      </button>
      <div 
        className="sidebar-overlay" 
        onClick={closeMenu}
      />
    </>
  );
}
