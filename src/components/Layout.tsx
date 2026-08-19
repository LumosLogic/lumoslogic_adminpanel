import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  Briefcase, Users, LogOut, UserSquare2, Layers, BookOpen,
  Package, FolderKanban, HelpCircle, Settings2,
  Crown, Clock, Heart, Star, ListOrdered, Cloud, Building2,
} from "lucide-react";
import { clearToken } from "../lib/auth";

const navCls = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-all ${
    isActive ? "bg-[#A7F515] text-[#211951]" : "text-white/70 hover:text-white hover:bg-white/10"
  }`;

const Section = ({ label }: { label: string }) => (
  <p className="px-4 pt-5 pb-1 text-[10px] font-bold text-white/30 uppercase tracking-widest">{label}</p>
);

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-[#211951] flex flex-col shrink-0 overflow-y-auto">
        <div className="px-6 py-5 border-b border-white/10 shrink-0">
          <img src="/Logo.webp" alt="Lumos Logic" className="h-7 w-auto mb-3" />
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#A7F515] rounded-full"></div>
            <p className="text-white/50 text-[10px] font-bold tracking-widest">ADMIN DASHBOARD</p>
          </div>
        </div>

        <nav className="flex-1 py-3">
          <Section label="Careers" />
          <NavLink to="/jobs" className={navCls}><Briefcase className="w-4 h-4 shrink-0" />Job Postings</NavLink>
          <NavLink to="/applications" className={navCls}><Users className="w-4 h-4 shrink-0" />Applications</NavLink>

          <Section label="Website" />
          <NavLink to="/team" className={navCls}><UserSquare2 className="w-4 h-4 shrink-0" />Team</NavLink>
          <NavLink to="/team-order" className={navCls}><ListOrdered className="w-4 h-4 shrink-0" />Team Order</NavLink>
          <NavLink to="/services" className={navCls}><Layers className="w-4 h-4 shrink-0" />Services</NavLink>
          <NavLink to="/blog" className={navCls}><BookOpen className="w-4 h-4 shrink-0" />Blog Posts</NavLink>
          <NavLink to="/products" className={navCls}><Package className="w-4 h-4 shrink-0" />Products</NavLink>
          <NavLink to="/case-studies" className={navCls}><FolderKanban className="w-4 h-4 shrink-0" />Case Studies</NavLink>
          <NavLink to="/faq" className={navCls}><HelpCircle className="w-4 h-4 shrink-0" />FAQ</NavLink>
          <NavLink to="/leadership" className={navCls}><Crown className="w-4 h-4 shrink-0" />Leadership</NavLink>
          <NavLink to="/timeline" className={navCls}><Clock className="w-4 h-4 shrink-0" />Timeline</NavLink>
          <NavLink to="/company-values" className={navCls}><Heart className="w-4 h-4 shrink-0" />Company Values</NavLink>
          <NavLink to="/testimonials" className={navCls}><Star className="w-4 h-4 shrink-0" />Testimonials</NavLink>
          <NavLink to="/clients" className={navCls}><Building2 className="w-4 h-4 shrink-0" />Client Logos</NavLink>

          <Section label="Settings" />
          <NavLink to="/company-settings" className={navCls}><Settings2 className="w-4 h-4 shrink-0" />Company Settings</NavLink>
          <NavLink to="/cloudinary-settings" className={navCls}><Cloud className="w-4 h-4 shrink-0" />Cloudinary</NavLink>
        </nav>

        <div className="px-4 py-5 border-t border-white/10 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 w-full text-white/70 hover:text-white hover:bg-white/10 text-sm font-semibold transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
