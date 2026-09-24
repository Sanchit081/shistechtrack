"use client";

import { useState, useEffect } from "react";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);

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

  const toggleNavDropdown = () => {
    setIsNavOpen(!isNavOpen);
    const dropdown = document.querySelector('.mobile-nav-dropdown');
    if (dropdown) {
      dropdown.classList.toggle('active');
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

  // Add navigation dropdown functionality
  useEffect(() => {
    const topbarSpan = document.querySelector('.topbar span');
    if (topbarSpan) {
      topbarSpan.addEventListener('click', toggleNavDropdown);
      return () => {
        topbarSpan.removeEventListener('click', toggleNavDropdown);
      };
    }
  }, []);

  // Close nav dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.querySelector('.mobile-nav-dropdown');
      const topbarSpan = document.querySelector('.topbar span');
      if (dropdown && topbarSpan && 
          !dropdown.contains(event.target as Node) && 
          !topbarSpan.contains(event.target as Node)) {
        dropdown.classList.remove('active');
        setIsNavOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      <div className="mobile-nav-dropdown">
        <a href="/dashboard">My Dashboard</a>
        <a href="/dashboard/tasks">My Tasks</a>
        <a href="/chat">Team Chat</a>
        <a href="/notifications">Notifications</a>
      </div>
    </>
  );
}
