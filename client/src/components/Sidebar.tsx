import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Database,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { ModuleAccess } from "@/erp/features/auth/type";
import { allMenuItems } from "@/constants/menuItems";
import { getMenusByRole } from "@/config/roleAccess";

type MenuItem = {
  path: string;
  icon: any;
  label: string;
  exact?: boolean;
  badge?: number;
  children?: MenuItem[];
};



export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const isRestoringScrollRef = useRef<boolean>(false);
  const lastSavedScrollRef = useRef<number>(0);
  const scrollThrottleRef = useRef<NodeJS.Timeout | null>(null);
  const modules: ModuleAccess[] = JSON.parse(localStorage.getItem("modules") || "[]");

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-expand menus based on current route (includes add/edit sub-paths)
  useEffect(() => {
    const currentPath = location.pathname;
    const isUnderPath = (base: string) =>
      currentPath === base || currentPath.startsWith(base + '/');

    setOpenMenus(prev => {
      const newOpenMenus: Record<string, boolean> = { ...prev };

      allMenuItems.forEach((item) => {
        if (item.children) {
          const hasActiveChild = item.children.some(child =>
            isUnderPath(child.path) ||
            (child.children?.some(subChild => isUnderPath(subChild.path)))
          );

          if (hasActiveChild) {
            newOpenMenus[item.path] = true;

            item.children.forEach((child, idx) => {
              if (child.children) {
                const childKey = `${child.path}-1-${idx}`;
                const hasActiveSubChild = child.children.some(subChild => isUnderPath(subChild.path));
                if (hasActiveSubChild) {
                  newOpenMenus[childKey] = true;
                }
              }
            });
          }
        }
      });

      return newOpenMenus;
    });
  }, [location.pathname]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when route changes
  useEffect(() => {
    if (isMobileMenuOpen && isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [location.pathname, isMobile]);

  type Role = "master_admin" | "super_admin" | "manager" | "custom_role";

  const currentRole: Role =
    (user as any)?.role === "platformOwner"
      ? "master_admin"
      : (user as any)?.role === "super_admin"
      ? "super_admin"
      : (user as any)?.role === "manager"
      ? "manager"
      : "custom_role";


  const handleScroll = () => {
    if (!navRef.current || isRestoringScrollRef.current) return;
    
    const scrollTop = navRef.current.scrollTop;
    scrollPositionRef.current = scrollTop;
    
    if (scrollThrottleRef.current) {
      clearTimeout(scrollThrottleRef.current);
    }
    
    scrollThrottleRef.current = setTimeout(() => {
      if (Math.abs(scrollTop - lastSavedScrollRef.current) > 5) {
        sessionStorage.setItem('sidebarScrollPosition', scrollTop.toString());
        lastSavedScrollRef.current = scrollTop;
      }
    }, 150);
  };

  const saveScrollImmediate = () => {
    if (navRef.current) {
      const scrollTop = navRef.current.scrollTop;
      scrollPositionRef.current = scrollTop;
      sessionStorage.setItem('sidebarScrollPosition', scrollTop.toString());
      lastSavedScrollRef.current = scrollTop;
    }
  };

  const handleNavLinkClick = saveScrollImmediate;

  const toggleMenu = (key: string) => {
    saveScrollImmediate();
    setOpenMenus((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  useLayoutEffect(() => {
    if (!navRef.current) return;
    
    const savedScroll = sessionStorage.getItem('sidebarScrollPosition');
    if (!savedScroll) return;
    
    const scrollValue = parseFloat(savedScroll);
    const currentScroll = navRef.current.scrollTop;
    
    if (scrollValue > 0 && Math.abs(currentScroll - scrollValue) > 1) {
      isRestoringScrollRef.current = true;
      navRef.current.scrollTop = scrollValue;
      
      const timer = setTimeout(() => {
        isRestoringScrollRef.current = false;
      }, 50);
      
      return () => clearTimeout(timer);
    }
  });

  useEffect(() => {
    return () => {
      if (scrollThrottleRef.current) {
        clearTimeout(scrollThrottleRef.current);
      }
    };
  }, []);

  const menuItems: MenuItem[] = getMenusByRole(currentRole, modules);


  // Generate a unique ID for each menu item
  const generateMenuId = (item: MenuItem, level: number, index?: number | string) => {
    const baseId = `${item.path}-${item.label}-${level}`;
    return index !== undefined ? `${baseId}-${index}` : baseId;
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const Icon = item.icon;
    const isParent = item.children && item.children.length > 0;
    const isOpen = openMenus[item.path];

    const getItemClasses = (isActive: boolean) =>
      `group flex items-center justify-between px-3 py-3 text-ui-button font-medium rounded-xl transition-all duration-200 cursor-pointer border ${isActive
        ? "!text-sidebar-primary-foreground bg-gradient-to-r from-sidebar-primary to-sidebar-primary/80 shadow-lg border-sidebar-primary/30 shadow-sidebar-primary/20"
        : "text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent border-transparent hover:border-sidebar-accent-foreground/20"
      }`;

    const handleDropdownToggle = (e: React.MouseEvent, key: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isCollapsed) toggleMenu(key);
    };

    if (isParent) {
      return (
        <div key={generateMenuId(item, level)}>
          <div
            onClick={(e) => handleDropdownToggle(e, item.path)}
            className={getItemClasses(false)}
            style={{ paddingLeft: `${12 + level * 16}px` }}
            title={isCollapsed ? item.label : undefined}
          >
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 flex items-center justify-center">
                <Icon size={18} className="group-hover:scale-110 transition-transform duration-200" />
              </div>
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </div>

            {!isCollapsed && (
              <div className="flex items-center space-x-2">
                {item.badge && item.badge > 0 && (
                  <Badge className="bg-gradient-to-r from-warning to-warning/90 text-warning-foreground text-ui-caption px-2 py-0.5 shadow-sm">
                    {item.badge}
                  </Badge>
                )}
                <span className="group-hover:scale-110 transition-transform duration-200">
                  {isOpen ? <ChevronDown size={16} className="text-sidebar-foreground/50" /> : <ChevronRight size={16} className="text-sidebar-foreground/50" />}
                </span>
              </div>
            )}
          </div>
          {isOpen && !isCollapsed && (
            <div className="space-y-1 mt-1">
              {item.children?.map((child, idx) => {
                const childKey = `${child.path}-${level + 1}-${idx}`;
                const childOpen = openMenus[childKey];

                return (
                  <div key={generateMenuId(child, level + 1, idx)}>
                    {/* First-level child */}
                    {child.children ? (
                      <div
                        onClick={(e) => handleDropdownToggle(e, childKey)}
                        className={`group flex items-center justify-between px-3 py-2.5 text-ui-button rounded-lg cursor-pointer transition-all duration-200 border ${location.pathname === child.path
                          ? "!text-sidebar-primary-foreground bg-gradient-to-r from-sidebar-primary/60 to-sidebar-primary/40 border-sidebar-primary/40"
                          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 border-transparent hover:border-sidebar-accent-foreground/20"
                          }`}
                        style={{ paddingLeft: `${24 + level * 16}px` }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 flex items-center justify-center">
                            <child.icon size={14} className="group-hover:scale-110 transition-transform duration-200" />
                          </div>
                          <span>{child.label}</span>
                        </div>
                        <span className="group-hover:scale-110 transition-transform duration-200">
                          {childOpen ? <ChevronDown size={12} className="text-sidebar-foreground/50" /> : <ChevronRight size={12} className="text-sidebar-foreground/50" />}
                        </span>
                      </div>
                    ) : (
                      <NavLink
                        to={child.path}
                        end={child.exact}
                        onClick={handleNavLinkClick}
                        className={({ isActive }) =>
                          `group flex items-center space-x-3 px-3 py-2.5 text-ui-button rounded-lg transition-all duration-200 border ${isActive
                            ? "!text-sidebar-primary-foreground bg-gradient-to-r from-sidebar-primary/60 to-sidebar-primary/40 border-sidebar-primary/40"
                            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent border-transparent hover:border-sidebar-accent-foreground/20"
                          }`
                        }
                        style={{ paddingLeft: `${24 + level * 16}px` }}
                      >
                        <div className="w-4 h-4 flex items-center justify-center">
                          <child.icon size={14} className="group-hover:scale-110 transition-transform duration-200" />
                        </div>
                        <span>{child.label}</span>
                      </NavLink>
                    )}

                    {/* Second-level child (sub-actions) */}
                    {child.children && childOpen && (
                      <div className="space-y-1 mt-1">
                        {child.children.map((sub, subIdx) => (
                          <NavLink
                            key={generateMenuId(sub, level + 2, subIdx)}
                            to={sub.path}
                            onClick={handleNavLinkClick}
                            className={({ isActive }) =>
                              `group flex items-center space-x-3 px-3 py-2 text-ui-caption rounded-lg transition-all duration-200 border ${isActive
                                ? "!text-sidebar-primary-foreground bg-gradient-to-r from-sidebar-primary/50 to-sidebar-primary/30 border-sidebar-primary/30"
                                : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent border-transparent hover:border-sidebar-accent-foreground/20"
                              }`
                            }
                            style={{ paddingLeft: `${36 + level * 16}px` }}
                          >
                            <div className="w-3 h-3 flex items-center justify-center">
                              <sub.icon size={12} className="group-hover:scale-110 transition-transform duration-200" />
                            </div>
                            <span>{sub.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.exact}
        onClick={handleNavLinkClick}
        className={({ isActive }) => getItemClasses(isActive)}
        style={{ paddingLeft: `${12 + level * 16}px` }}
        title={isCollapsed ? item.label : undefined}
      >
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 flex items-center justify-center">
            <Icon width={18} height={18} className="group-hover:scale-110 transition-transform duration-200" />
          </div>
          {!isCollapsed && <span className="font-medium">{item.label}</span>}
        </div>

        {!isCollapsed && item.badge && item.badge > 0 && (
          <Badge className="bg-gradient-to-r from-warning to-warning/90 text-warning-foreground text-ui-caption px-2 py-0.5 shadow-sm">
            {item.badge}
          </Badge>
        )}
      </NavLink>
    );
  };
  
  const userName = (user as any)?.firstName && (user as any)?.lastName
    ? `${(user as any).firstName} ${(user as any).lastName}`
    : (user as any)?.email || "User";

  // Mobile Hamburger Button (always visible on mobile)
  const MobileHamburger = () => (
    <div className="md:hidden fixed top-4 left-4 z-50">
      <Button
        variant="default"
        size="sm"
        onClick={toggleMobileMenu}
        className="bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>
    </div>
  );

  // Sidebar Content Component
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Logo */}
      <div className={`p-6 border-b border-sidebar-border ${isCollapsed ? 'px-4' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-sidebar-primary/20 to-sidebar-primary/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-sidebar-primary/20 shadow-lg">
              <Database className="text-sidebar-primary" size={22} />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-heading-3 font-bold text-sidebar-foreground">ERP System</h1>
                <p className="text-ui-caption text-sidebar-foreground/70">Admin Dashboard</p>
              </div>
            )}
          </div>
          {!isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg transition-all duration-200"
              style={{padding: `${0}px`}}
              > 
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav 
        ref={navRef} 
        className="flex-1 p-4 space-y-3 overflow-y-auto sidebar-scrollbar"
        style={{ 
          scrollBehavior: 'auto',
          overscrollBehavior: 'contain'
        }}
        onScroll={handleScroll}
      >
        <div className="space-y-2">
          {menuItems.map((item) => renderMenuItem(item))}
        </div>

        <div className="pt-6">
          <div className="flex items-center space-x-2 px-3 mb-4">
            <div className="h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent flex-1"></div>
            {!isCollapsed && (
              <h3 className="text-ui-overline text-sidebar-foreground/70 font-medium">
                System
              </h3>
            )}
            <div className="h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent flex-1"></div>
          </div>

          {/* System Section */}
          <div className="space-y-1">
            <a
              href="#"
              className="group flex items-center space-x-3 px-3 py-3 text-ui-button text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-xl transition-all duration-200 border border-transparent hover:border-sidebar-accent-foreground/20"
              title={isCollapsed ? "Settings" : undefined}
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <Settings size={18} className="group-hover:scale-110 transition-transform duration-200" />
              </div>
              {!isCollapsed && <span>Settings</span>}
            </a>
            <a
              href="#"
              className="group flex items-center space-x-3 px-3 py-3 text-ui-button text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-xl transition-all duration-200 border border-transparent hover:border-sidebar-accent-foreground/20"
              title={isCollapsed ? "Help & Support" : undefined}
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <HelpCircle size={18} className="group-hover:scale-110 transition-transform duration-200" />
              </div>
              {!isCollapsed && <span>Help & Support</span>}
            </a>
          </div>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border bg-gradient-to-r from-sidebar/50 to-sidebar-accent/30">
        <div className="flex items-center space-x-3 p-3 rounded-xl bg-sidebar-accent/30 border border-sidebar-border backdrop-blur-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-sidebar-primary/20 to-sidebar-primary/10 rounded-full flex items-center justify-center border border-sidebar-primary/20">
            <User size={20} />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-ui-label text-sidebar-foreground truncate">{userName}</p>
              <p className="text-ui-caption text-sidebar-foreground/70 capitalize">
                {(user as any)?.role?.replace("_", " ") || "User"}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logout();
            }}
            className="h-9 w-9 p-0 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg transition-all duration-200 border border-transparent hover:border-sidebar-accent-foreground/20"
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      {isMobile && <MobileHamburger />}

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex ${isCollapsed ? 'w-20' : 'w-82'} flex-col h-screen overflow-y-auto scrollbar-hide shadow-2xl transition-all duration-300`}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobile && (
        <>
          {/* Backdrop */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
              onClick={toggleMobileMenu}
            />
          )}

          {/* Mobile Sidebar */}
          <aside
            className={`overflow-y-auto scrollbar-hide fixed top-0 left-0 h-screen w-82 z-40 transform transition-transform duration-300 ease-in-out md:hidden shadow-2xl ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
          >
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
