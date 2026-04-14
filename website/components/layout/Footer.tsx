export default function Footer() {
  return (
    <footer className="border-t border-surface-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <img
                src="/logo/Intake logo-black full.svg"
                alt="Intake"
                className="h-7"
              />
            </div>
            <div className="flex items-center h-4">
              <div className="w-px h-full bg-surface-200"></div>
            </div>
            <a
              href="https://www.plurio.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-surface-600 transition-colors"
            >
              <span>by</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 76 26" className="h-[14px] w-auto" aria-label="Plurio">
                <path d="M 4.716 8.656 C 6.92 6.412 10.615 6.734 12.458 8.815 C 14.896 11.572 14.797 17.998 11.821 20.364 C 10.233 21.629 7.738 21.925 5.917 21.057 C 5.563 20.889 5.072 20.548 4.716 20.295 L 4.716 26 L 0 26 L 0 7.237 L 4.716 7.237 Z M 4.716 16.972 L 9.503 16.972 L 9.503 11.65 L 4.716 11.65 Z M 68.331 6.774 C 72.501 6.558 75.551 8.898 75.948 13.094 C 76.447 18.385 73.345 21.936 67.889 21.462 C 59.418 20.728 59.38 7.239 68.33 6.774 Z M 66.283 16.784 L 71.323 16.784 L 71.323 11.503 L 66.283 11.503 Z M 31.692 16.198 L 35.517 16.198 L 35.517 7.351 L 40.537 7.351 L 40.537 20.832 L 35.517 20.832 L 35.517 17.998 C 34.988 19.446 33.77 21.241 30.989 21.241 C 27.629 21.241 26.538 18.205 26.538 17.001 C 26.538 15.706 26.493 7.351 26.493 7.351 L 31.692 7.351 Z M 52.225 7.103 C 52.509 7.103 52.88 7.15 53.166 7.228 L 53.166 12.06 L 47.947 12.06 L 47.947 20.832 L 42.927 20.832 L 42.927 7.351 L 47.947 7.351 L 47.947 9.483 C 48.746 8.046 50.355 7.103 52.225 7.103 Z M 59.859 20.832 L 54.839 20.832 L 54.839 7.351 L 59.859 7.351 Z M 20.89 16.114 L 24.997 16.114 L 24.997 20.831 L 20.188 20.831 C 16.827 20.831 15.736 18.122 15.736 16.918 C 15.736 15.626 15.692 3.009 15.691 2.941 L 20.89 2.941 Z M 57.359 0 C 58.964 0 60.266 1.291 60.266 2.884 C 60.266 4.478 58.964 5.769 57.359 5.769 C 55.753 5.769 54.526 4.478 54.526 2.884 C 54.526 1.291 55.753 0 57.359 0 Z" fill="currentColor" />
              </svg>
            </a>
          </div>
          <div className="flex items-center gap-6 text-sm text-surface-500">
            <a href="https://github.com/plurio/Intake" target="_blank" rel="noopener noreferrer" className="hover:text-surface-700 transition-colors">
              GitHub
            </a>
            <a href="https://www.npmjs.com/package/@plurio/intake" target="_blank" rel="noopener noreferrer" className="hover:text-surface-700 transition-colors">
              npm
            </a>
            <a href="https://github.com/plurio/Intake#readme" target="_blank" rel="noopener noreferrer" className="hover:text-surface-700 transition-colors">
              Docs
            </a>
            <a href="https://www.plurio.ai/" target="_blank" rel="noopener noreferrer" className="hover:text-surface-700 transition-colors">
              Plurio
            </a>
          </div>
          <p className="text-sm text-surface-400">
            MIT License &middot; &copy; {new Date().getFullYear()} Intake
          </p>
        </div>
      </div>
    </footer>
  );
}
