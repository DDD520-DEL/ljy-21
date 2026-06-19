import { Link, Outlet, useLocation } from 'react-router-dom';
import { Building2, Home, Plus, Tag, Award, Users } from 'lucide-react';
import NotificationCenter from '@/components/NotificationCenter';

export default function Layout() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isElevatorBrands = location.pathname === '/elevator-brands';
  const isPolicySubsidy = location.pathname === '/policy-subsidy';
  const isResidentDirectory = location.pathname === '/resident-directory';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-lg shadow-primary-200">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-lg font-bold text-slate-800 leading-tight">加装电梯公示平台</h1>
              <p className="text-xs text-slate-500">老旧小区改造 · 透明协作</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            <NotificationCenter />
            <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isHome
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">项目列表</span>
            </Link>
            <Link
              to="/elevator-brands"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isElevatorBrands
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span className="hidden sm:inline">品牌库</span>
            </Link>
            <Link
              to="/policy-subsidy"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isPolicySubsidy
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">政策补贴</span>
            </Link>
            <Link
              to="/resident-directory"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isResidentDirectory
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">居民通讯录</span>
            </Link>
            <Link
              to="/projects/create"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-700 text-white hover:bg-primary-800 hover:shadow-md transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">发起项目</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-slate-500">
          <p>老旧小区加装电梯意愿征询与进度公示平台</p>
          <p className="mt-1 text-xs text-slate-400">透明 · 公开 · 高效</p>
        </div>
      </footer>
    </div>
  );
}
