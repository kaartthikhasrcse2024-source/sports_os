import { Navigate, Route, Routes, BrowserRouter as Router, useNavigate, useLocation } from 'react-router-dom';
import AuthAppLaunch from './components/AuthAppLaunch';
import PlayerAuth from './pages/PlayerAuth';
import OwnerAuth from './pages/OwnerAuth';
import OrganizerAuth from './pages/OrganizerAuth';
import DashboardSwitch from './pages/DashboardSwitch';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import MapSearch from './pages/MapSearch';
import TournamentBracket from './pages/TournamentBracket';
import RefereeScorecard from './pages/RefereeScorecard';
import PlayerProfile from './pages/PlayerProfile';
import FreeAgents from './pages/FreeAgents';
import SlotGrid from './pages/SlotGrid';
import VerifyPhone from './components/VerifyPhone';
import VerificationUpload from './components/VerificationUpload';
import AdminApproval from './components/AdminApproval';
import VenueMapDiscovery from './components/VenueMapDiscovery';
import PlayerDiscovery from './pages/player/PlayerDiscovery';
import PlayerRegistration from './pages/PlayerRegistration';
import TurfOwnerRegistration from './pages/TurfOwnerRegistration';
import OrganizerRegistration from './pages/OrganizerRegistration';
import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';
import NotificationCenter from './components/NotificationCenter';

/** Root paths where Back should prompt exit rather than navigate back. */
const ROOT_PATHS = new Set(['/', '/player/login', '/owner/login', '/organizer/login']);

/**
 * BackButtonHandler — must render inside <Router> so it can access
 * useNavigate and useLocation.
 */
function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handler = (_event: unknown) => {
      const isRoot = ROOT_PATHS.has(location.pathname);
      if (isRoot) {
        // At a root screen — show exit confirmation
        if (window.confirm('Exit Sports OS?')) {
          CapApp.exitApp();
        }
      } else {
        // Navigate back through browser history
        navigate(-1);
      }
    };

    // Capacitor App.addListener returns a promise<PluginListenerHandle>
    let listenerHandle: Awaited<ReturnType<typeof CapApp.addListener>> | null = null;
    CapApp.addListener('backButton', handler).then(h => { listenerHandle = h; }).catch(console.error);

    return () => {
      listenerHandle?.remove();
    };
  }, [navigate, location.pathname]);

  return null;
}

function App() {
  // ── Push Notifications (native only) ──────────────────────────────────────
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      PushNotifications.requestPermissions().then(result => {
        if (result.receive === 'granted') {
          PushNotifications.register();
        }
      }).catch(console.error);

      PushNotifications.addListener('registration', (token) => {
        console.log('Push notification mapping successful. Device token:', token.value);
      }).catch(console.error);
    }
  }, []);

  return (
    // pt accounts for status-bar height (via safe-area-inset-top).
    // pb accounts for Android navigation bar height.
    // On web browsers safe-area-inset values are 0, so layout is unchanged.
    <div className="pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] min-h-screen bg-gray-50 relative">
      <AuthProvider>
        <Router>
          {/* Android hardware back-button listener — must be inside Router */}
          <BackButtonHandler />

          {/* Notification bell — pinned top-right, clears status bar area */}
          <div className="fixed top-[env(safe-area-inset-top)] right-4 mt-3 z-[60]">
            <NotificationCenter />
          </div>

          <Routes>
            {/* PUBLIC DOORS */}
            <Route path="/" element={<AuthAppLaunch />} />
            <Route path="/player/login" element={<PlayerAuth mode="login" />} />
            <Route path="/player/signup" element={<PlayerAuth mode="signup" />} />
            <Route path="/owner/login" element={<OwnerAuth mode="login" />} />
            <Route path="/owner/signup" element={<OwnerAuth mode="signup" />} />
            <Route path="/organizer/login" element={<OrganizerAuth mode="login" />} />
            <Route path="/organizer/signup" element={<OrganizerAuth mode="signup" />} />

            {/* VERIFICATION SANDBOX */}
            <Route path="/verify-phone" element={<VerifyPhone />} />
            <Route path="/verify-owner" element={<VerificationUpload role="TURF_OWNER" />} />
            <Route path="/verify-organizer" element={<VerificationUpload role="TOURNAMENT_ORGANIZER" />} />
            <Route path="/admin-verify" element={<AdminApproval />} />
            <Route path="/map" element={<VenueMapDiscovery />} />

            {/* SECURE GATED ROUTES (NOW ENFORCED) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/player-registration" element={<PlayerRegistration />} />
              <Route path="/owner-registration" element={<TurfOwnerRegistration />} />
              <Route path="/organizer-registration" element={<OrganizerRegistration />} />
              <Route path="/dashboard" element={<DashboardSwitch />} />
              <Route path="/map-search" element={<MapSearch />} />
              <Route path="/discovery" element={<PlayerDiscovery />} />
              <Route path="/bracket" element={<TournamentBracket />} />
              <Route path="/slots" element={<SlotGrid />} />
              <Route path="/referee" element={<RefereeScorecard />} />
              <Route path="/profile/:id" element={<PlayerProfile />} />
              <Route path="/free-agents" element={<FreeAgents />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;
