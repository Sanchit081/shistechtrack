"use client";

import { useState, useEffect } from "react";

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

  // Close menu when clicking on navigation links
  useEffect(() => {
    const navLinks = document.querySelectorAll('.sidebar nav a');
    navLinks.forEach(link => {
      link.addEventListener('click', closeMenu);
    });
    return () => {
      navLinks.forEach(link => {
        link.removeEventListener('click', closeMenu);
      });
    };
  }, []);

  return (
    <>
      <button 
        className="mobile-menu-btn" 
        onClick={toggleMenu}
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        ☰
      </button>
      <div 
        className="sidebar-overlay" 
        onClick={closeMenu}
        aria-hidden={!isOpen}
      />
    </>
  );
}
