import React from "react";
import Header from "./Header";
import Footer from "./Footer";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow min-h-[calc(100vh-theme(spacing.32))] py-6 flex items-center justify-center bg-gray-50">
        <div className="container max-w-7xl mx-auto px-4">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
