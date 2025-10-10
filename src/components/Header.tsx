import React from 'react';
import { Settings, AlertTriangle, Sparkles, Download, LogOut, User } from 'lucide-react';
import { ClassUserSelector } from './ClassUserSelector';
import webxrideLogo from '../assets/webxride-logo.png';
// import { FileUpload } from './FileUpload';

// Try to import auth, but handle if it's not available
let useAuth: any = null;

// Initialize auth module asynchronously
const initializeAuth = async () => {
  try {
    const authModule = await import('../lib/auth');
    useAuth = authModule.useAuth;
  } catch (e) {
    // Auth not available, that's ok
  }
};

// Call the async function
initializeAuth();

interface HeaderProps {
  projectName: string;
  onSaveTemplate?: () => void;
  selectedUser: string | null;
  onUserSelect: (userName: string) => void;
  isAdmin?: boolean;
  showAdminPanel?: boolean;
  setShowAdminPanel?: (show: boolean) => void;
  showStartersPanel?: boolean;
  setShowStartersPanel?: (show: boolean) => void;
  onSaveHtml?: () => void;
  onExportLocalSite?: () => void;
}


// Function to determine if this is a development deployment
const isDevelopmentDeployment = (): boolean => {
  // Debug: Log all available environment variables
  console.log('🔍 Banner Debug: All environment variables:');
  console.log('🔍 DEV:', import.meta.env.DEV);
  console.log('🔍 MODE:', import.meta.env.MODE);
  console.log('🔍 VITE_NETLIFY_CONTEXT:', import.meta.env.VITE_NETLIFY_CONTEXT);
  console.log('🔍 CONTEXT:', import.meta.env.CONTEXT);
  console.log('🔍 VITE_BRANCH:', import.meta.env.VITE_BRANCH);
  console.log('🔍 BRANCH:', import.meta.env.BRANCH);
  console.log('🔍 VITE_IS_DEVELOP_BRANCH:', import.meta.env.VITE_IS_DEVELOP_BRANCH);
  
  // Check if we're in development mode (local development)
  if (import.meta.env.DEV) {
    console.log('🔍 Banner Debug: DEV mode detected, showing banner');
    return true;
  }
  
  // Check Netlify deployment context
  // CONTEXT will be "production" for main branch, "deploy-preview" for other branches
  const netlifyContext = import.meta.env.VITE_NETLIFY_CONTEXT || import.meta.env.CONTEXT;
  console.log('🔍 Banner Debug: Netlify context:', netlifyContext);
  
  // Check for branch name (Netlify sets BRANCH environment variable)
  const branchName = import.meta.env.VITE_BRANCH || import.meta.env.BRANCH;
  console.log('🔍 Banner Debug: Branch name:', branchName);
  
  // If we're on Netlify and not in production context, show development banner
  if (netlifyContext && netlifyContext !== 'production') {
    console.log('🔍 Banner Debug: Non-production context detected, showing banner');
    return true;
  }
  
  // Check for develop branch specifically
  if (branchName === 'develop') {
    console.log('🔍 Banner Debug: Develop branch detected, showing banner');
    return true;
  }
  
  // Check for a custom environment variable that can be set for develop branch
  const isDevelopBranch = import.meta.env.VITE_IS_DEVELOP_BRANCH === 'true';
  console.log('🔍 Banner Debug: Is develop branch env var:', isDevelopBranch);
  if (isDevelopBranch) {
    console.log('🔍 Banner Debug: Develop branch env var detected, showing banner');
    return true;
  }
  
  // Default to false for production/main branch
  console.log('🔍 Banner Debug: Production mode, hiding banner');
  return false;
};

export const Header: React.FC<HeaderProps> = ({
  projectName,
  onSaveTemplate,
  selectedUser,
  onUserSelect,
  isAdmin = false,
  showAdminPanel,
  setShowAdminPanel,
  showStartersPanel,
  setShowStartersPanel,
  onSaveHtml,
  onExportLocalSite
}) => {

  const showDevelopmentBanner = isDevelopmentDeployment();
  console.log('🔍 Banner Debug: Final decision - show banner:', showDevelopmentBanner);
  
  // Check if auth is enabled
  const AUTH_ENABLED = import.meta.env.VITE_AUTH_ENABLED === 'true';
  const USE_SIMPLE_AUTH = import.meta.env.VITE_USE_SIMPLE_AUTH === 'true';
  const auth = AUTH_ENABLED && useAuth ? useAuth() : null;
  
  // Check if user is authenticated with simple auth
  const isSimpleAuthUser = USE_SIMPLE_AUTH && localStorage.getItem('authenticatedUser');

  return (
    <>
      {/* Development Notice Banner - Only show for development deployments */}
      {showDevelopmentBanner && (
        <div className="bg-yellow-600 text-black px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
          <AlertTriangle size={16} />
          <span>DEVELOPMENT VERSION - This is the development branch with experimental features</span>
        </div>
      )}
      
      <header className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <img src={webxrideLogo} alt="WebXRide Logo" className="h-10 w-10 mr-2 rounded-full bg-white p-1 shadow" />
          <span className="text-2xl font-extrabold tracking-tight text-green-400 mr-2">WebXRide</span>
          <a 
            href="/about" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-gray-300 hover:text-white transition-colors underline"
          >
            About
          </a>
          <span className="text-xl font-bold tracking-tight text-white">{projectName}</span>
          <div className="flex items-center gap-2">
            {onSaveTemplate && (
              <button
                onClick={onSaveTemplate}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm text-white transition-colors"
              >
                Save as Template
              </button>
            )}
            {onSaveHtml && (
              <button
                onClick={onSaveHtml}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white transition-colors"
              >
                Save
              </button>
            )}
            {onExportLocalSite && (
              <button
                onClick={onExportLocalSite}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-sm text-white transition-colors flex items-center gap-1"
                title="Export as local site (ZIP file)"
              >
                <Download size={14} />
                Export Local Site
              </button>
            )}

          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Show auth user info and sign-out when auth is enabled */}
          {AUTH_ENABLED && auth?.isAuthenticated && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded border border-gray-700">
              <User size={16} className="text-blue-400" />
              <span className="text-sm text-white">{auth.user?.email}</span>
              <button
                onClick={() => auth.signOut()}
                className="ml-2 px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs text-white transition-colors flex items-center gap-1"
                title="Sign out"
              >
                <LogOut size={12} />
                Sign Out
              </button>
            </div>
          )}
          
          {/* Simple Auth User Display - show when using simple auth and user is logged in */}
          {USE_SIMPLE_AUTH && isSimpleAuthUser && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded border border-gray-700">
              <User size={16} className="text-blue-400" />
              <span className="text-sm text-white">{localStorage.getItem('authenticatedUser')}</span>
              <button
                onClick={() => {
                  localStorage.removeItem('authenticatedUser');
                  window.location.reload();
                }}
                className="ml-2 px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs text-white transition-colors flex items-center gap-1"
                title="Logout"
              >
                <LogOut size={12} />
                Logout
              </button>
            </div>
          )}
          
          {/* ClassUserSelector - only show when auth is NOT enabled and NOT using simple auth */}
          {!AUTH_ENABLED && !USE_SIMPLE_AUTH && onUserSelect && (
            <ClassUserSelector 
              selectedUser={selectedUser || null}
              onUserSelect={onUserSelect}
              isAdmin={isAdmin}
            />
          )}
          {isAdmin && (
            <>
              <button 
                onClick={() => {
                  if (setShowStartersPanel) {
                    setShowStartersPanel(!showStartersPanel);
                    // Close admin panel when opening starters panel
                    if (setShowAdminPanel && !showStartersPanel) {
                      setShowAdminPanel(false);
                    }
                  }
                }}
                className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1 text-sm ${
                  showStartersPanel 
                    ? 'bg-orange-700 text-white' 
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}
                title="Open Starter Pages"
              >
                <Sparkles size={16} />
                <span>Starters</span>
              </button>
              {setShowAdminPanel && (
                <button 
                  onClick={() => {
                    if (setShowAdminPanel) {
                      setShowAdminPanel(!showAdminPanel);
                      // Close starters panel when opening admin panel
                      if (setShowStartersPanel && showStartersPanel) {
                        setShowStartersPanel(false);
                      }
                    }
                  }}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded transition-colors flex items-center gap-1 text-sm"
                  title="Manage Settings"
                >
                  <Settings size={16} />
                  <span>Manage Settings</span>
                </button>
              )}
            </>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;