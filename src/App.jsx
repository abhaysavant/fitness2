// import React from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import Auth from './components/Auth';
// import Profile from './components/Profile';
// import Dashboard from './components/Dashboard';
// import WorkoutTracker from './components/WorkoutTracker';
// import BMICalculator from './components/BMICalculator';
// import './App.css';

// // Placeholder components for now
// const BuddyMatching = () => <div>Buddy Matching</div>;
// const Messaging = () => <div>Messaging</div>;
// const Challenges = () => <div>Challenges</div>;
// const ProgressSharing = () => <div>Progress Sharing</div>;

// function App() {
//   return (
//     <Router>
//       <div className="App">
//         <header>
//           <h1>FitnessBuddy App</h1>
//         </header>
//         <main>
//           <Routes>
//             <Route path="/" element={<Auth isLogin={true} />} />
//             <Route path="/register" element={<Auth isLogin={false} />} />
//             <Route path="/dashboard" element={<Dashboard />} />
//             <Route path="/profile" element={<Profile />} />
//             <Route path="/buddy-matching" element={<BuddyMatching />} />
//             <Route path="/messaging" element={<Messaging />} />
//             <Route path="/workout-tracker" element={<WorkoutTracker />} />
//             <Route path="/bmi-calculator" element={<BMICalculator />} />
//             <Route path="/challenges" element={<Challenges />} />
//             <Route path="/progress-sharing" element={<ProgressSharing />} />
//           </Routes>
//         </main>
//       </div>
//     </Router>
//   );
// }

// export default App;
//   if (!workout || !workout.minutes || !workout.weightKg) return 0;
//   const mets = { Running: 9.8, Walking: 3.8, Cycling: 7.5, Strength: 6.0, Yoga: 3.0 };
//   const met = mets[workout.type] || 5;
//   // calories = MET * weightKg * hours
//   return Math.round(met * workout.weightKg * (workout.minutes / 60));
// }

// function projectedDaysToTarget(currentWeight, targetWeight, avgCalDeficitPerDay) {
//   if (currentWeight <= targetWeight || avgCalDeficitPerDay <= 0) return 0;
//   // 7700 kcal ~ 1kg
// }

import React from 'react';
import Appp from './components/new.jsx';


function App() {
  return(

<>
<Appp />

</>

  );

}

export default App;