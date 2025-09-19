import { NavigationSidebarSection } from "@/pages/sections/NavigationSidebarSection";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="bg-[#f5f6f8] w-full min-h-screen flex" data-testid="layout-container">
      {/* Navigation Sidebar */}
      <div className="flex-shrink-0">
        <NavigationSidebarSection />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
};