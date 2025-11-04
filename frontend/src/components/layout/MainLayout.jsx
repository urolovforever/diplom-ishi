import React from 'react'
import LeftSidebar from './LeftSidebar'
import RightSidebar from './RightSidebar'

const MainLayout = ({ children, showRightSidebar = true }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <LeftSidebar />

      {/* Main Content */}
      <div className={`ml-64 ${showRightSidebar ? 'mr-80' : ''} min-h-screen`}>
        <div className="max-w-2xl mx-auto py-6 px-4">
          {children}
        </div>
      </div>

      {/* Right Sidebar */}
      {showRightSidebar && <RightSidebar />}
    </div>
  )
}

export default MainLayout
