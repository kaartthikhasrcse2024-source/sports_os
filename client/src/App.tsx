import { Navigate, Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import Landing from './pages/Landing';
import PlayerAuth from './pages/PlayerAuth';
import OwnerAuth from './pages/OwnerAuth';
import OrganizerAuth from './pages/OrganizerAuth';
import DashboardSwitch from './pages/DashboardSwitch';
import GroupBooking from './pages/GroupBooking';
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
import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

function App() {
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
    <div className="pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] min-h-screen bg-dark-900">
      <Router>
        <Routes>
          {/* PUBLIC DOORS */}
          <Route path="/" element={<Landing />} />
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

          {/* SECURE GATED ROUTES (TEMPORARILY UNGATED) */}
          <Route path="/dashboard" element={<DashboardSwitch />} />
          <Route path="/group-booking" element={<GroupBooking />} />
          <Route path="/map-search" element={<MapSearch />} />
          <Route path="/bracket" element={<TournamentBracket />} />
          <Route path="/slots" element={<SlotGrid />} />
          <Route path="/referee" element={<RefereeScorecard />} />
          <Route path="/profile/:id" element={<PlayerProfile />} />
          <Route path="/free-agents" element={<FreeAgents />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
