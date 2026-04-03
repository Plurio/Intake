'use client';

import { useEffect, useState } from 'react';
import Button from '../ui/Button';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Code', href: '#code-examples' },
  { label: 'Attribution', href: '#attribution' },
  { label: 'Privacy', href: '#privacy' },
  { label: 'Integrations', href: '#integrations' },
  { label: 'FAQ', href: '#faq' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-lg shadow-nav'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="#" className="flex items-center">
              <img
                src="/logo/Intake logo-black full.svg"
                alt="Intake"
                className="h-8"
              />
            </a>
            <div className="hidden sm:flex items-center self-center h-5 mx-0.5">
              <div className="w-px h-full bg-surface-200"></div>
            </div>
            <a
              href="https://www.plurio.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-surface-400 hover:text-surface-600 transition-colors"
            >
              <span>by</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 76 26" className="h-[16px] w-auto" aria-label="Plurio">
                <path d="M 4.716 8.656 C 6.92 6.412 10.615 6.734 12.458 8.815 C 14.896 11.572 14.797 17.998 11.821 20.364 C 10.233 21.629 7.738 21.925 5.917 21.057 C 5.563 20.889 5.072 20.548 4.716 20.295 L 4.716 26 L 0 26 L 0 7.237 L 4.716 7.237 Z M 4.716 16.972 L 9.503 16.972 L 9.503 11.65 L 4.716 11.65 Z M 68.331 6.774 C 72.501 6.558 75.551 8.898 75.948 13.094 C 76.447 18.385 73.345 21.936 67.889 21.462 C 59.418 20.728 59.38 7.239 68.33 6.774 Z M 66.283 16.784 L 71.323 16.784 L 71.323 11.503 L 66.283 11.503 Z M 31.692 16.198 L 35.517 16.198 L 35.517 7.351 L 40.537 7.351 L 40.537 20.832 L 35.517 20.832 L 35.517 17.998 C 34.988 19.446 33.77 21.241 30.989 21.241 C 27.629 21.241 26.538 18.205 26.538 17.001 C 26.538 15.706 26.493 7.351 26.493 7.351 L 31.692 7.351 Z M 52.225 7.103 C 52.509 7.103 52.88 7.15 53.166 7.228 L 53.166 12.06 L 47.947 12.06 L 47.947 20.832 L 42.927 20.832 L 42.927 7.351 L 47.947 7.351 L 47.947 9.483 C 48.746 8.046 50.355 7.103 52.225 7.103 Z M 59.859 20.832 L 54.839 20.832 L 54.839 7.351 L 59.859 7.351 Z M 20.89 16.114 L 24.997 16.114 L 24.997 20.831 L 20.188 20.831 C 16.827 20.831 15.736 18.122 15.736 16.918 C 15.736 15.626 15.692 3.009 15.691 2.941 L 20.89 2.941 Z M 57.359 0 C 58.964 0 60.266 1.291 60.266 2.884 C 60.266 4.478 58.964 5.769 57.359 5.769 C 55.753 5.769 54.526 4.478 54.526 2.884 C 54.526 1.291 55.753 0 57.359 0 Z" fill="currentColor" />
              </svg>
            </a>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm text-surface-600 hover:text-surface-900 transition-colors rounded-lg hover:bg-surface-50"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <a
              href="https://github.com/elly-analytics/Intake"
              target="_blank"
              rel="noopener noreferrer"
              className="text-surface-500 hover:text-surface-700 transition-colors"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
            <Button href="#getting-started" size="sm">
              Get Started
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-surface-600"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-surface-100 shadow-lg">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 text-sm text-surface-600 hover:text-surface-900 rounded-lg hover:bg-surface-50"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-surface-100">
              <Button href="#getting-started" size="sm" className="w-full">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
