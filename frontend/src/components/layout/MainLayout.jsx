import React from 'react'
import LeftSidebar from './LeftSidebar'
import RightSidebar from './RightSidebar'

const MainLayout = ({ children, showRightSidebar = true }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      {/* Left Sidebar - Always render (contains mobile top/bottom nav) */}
      <LeftSidebar />

      {/* Main Content - Responsive margins */}
      <div className={`
        min-h-screen
        lg:ml-72
        ${showRightSidebar ? 'xl:mr-96' : ''}
        pt-16 lg:pt-0
        pb-20 lg:pb-0
      `}>
        <div className="max-w-3xl mx-auto py-4 px-4 sm:py-6 sm:px-6">
          {children}
        </div>
      </div>

      {/* Right Sidebar - Hidden on mobile and tablet, visible on xl screens */}
      {showRightSidebar && (
        <div className="hidden xl:block">
          <RightSidebar />
        </div>
      )}
    </div>
  )
}

export default MainLayout
