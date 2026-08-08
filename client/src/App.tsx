import { Navigate, Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import GroupBooking from './pages/GroupBooking';
import MapSearch from './pages/MapSearch';
import TournamentBracket from './pages/TournamentBracket';
import RefereeScorecard from './pages/RefereeScorecard';
import PlayerProfile from './pages/PlayerProfile';
import FreeAgents from './pages/FreeAgents';
import SlotGrid from './pages/SlotGrid';
import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';

function App() {
  useEffect(() => {
    PushNotifications.requestPermissions().then(result => {
      if (result.receive === 'granted') {
        PushNotifications.register();
      }
    }).catch(console.error);

    PushNotifications.addListener('registration', (token) => {
      console.log('Push notification mapping successful. Device token:', token.value);
    }).catch(console.error);
  }, []);

  return (
    <div className="pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] min-h-screen bg-dark-900">
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/group-booking" element={<GroupBooking />} />
          <Route path="/map-search" element={<MapSearch />} />
          <Route path="/bracket" element={<TournamentBracket />} />
          <Route path="/slots" element={<SlotGrid />} />
          <Route path="/referee" element={<RefereeScorecard />} />
          <Route path="/profile/:id" element={<PlayerProfile />} />
          <Route path="/free-agents" element={<FreeAgents />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
