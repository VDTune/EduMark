import { useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const NavbarTeacher = () => {
  const { user, logout } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Hàm kiểm tra active link
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const getLinkClass = (path) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
      isActive(path)
        ? "bg-blue-50 text-blue-700"
        : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
    }`;

  return (
    <>
      {/* TOP BAR - Fixed & Glassmorphism */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* LOGO */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:shadow-blue-500/30 transition-all duration-300">
                A
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-bold text-gray-900 text-lg leading-tight">EduMark</span>
                <span className="text-[10px] font-semibold text-blue-600 tracking-wider uppercase">Teacher</span>
              </div>
            </Link>

            {/* DESKTOP MENU */}
            <div className="hidden md:flex items-center gap-2">
              <Link to="/" className={getLinkClass("/")}>Lớp học</Link>
              <Link to="/create-class" className={getLinkClass("/create-class")}>+ Tạo lớp</Link>
              
              <div className="h-6 w-px bg-gray-300 mx-2"></div>

              <Link to="/profile" className="flex items-center gap-3 pl-2 py-1 pr-4 rounded-full hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
                  {user?.name}
                </span>
              </Link>
            </div>

            {/* MOBILE TOGGLE */}
            <button
              className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none"
              onClick={() => setOpen(!open)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {open ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

          </div>
        </div>
      </nav>

      {/* MOBILE MENU OVERLAY */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)}></div>
      )}

      {/* MOBILE DRAWER */}
      <div className={`fixed top-0 right-0 z-50 w-72 h-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-gray-800">Menu</h2>
            <button onClick={() => setOpen(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Giáo viên</p>
            </div>
          </div>

          <nav className="flex flex-col gap-2 space-y-1 flex-1">
            <Link 
              to="/" 
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${isActive('/') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              Lớp học
            </Link>
            <Link 
              to="/create-class" 
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${isActive('/create-class') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              Tạo lớp mới
            </Link>
            <Link 
              to="/profile" 
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${isActive('/profile') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              Hồ sơ cá nhân
            </Link>
          </nav>

          <div className="pt-6 border-t border-gray-100">
            <button
              onClick={() => { logout(); setOpen(false); }}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NavbarTeacher;