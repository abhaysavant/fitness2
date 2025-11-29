


import React, { useState, useEffect, createContext, useContext } from "react";

const API_BASE = "http://localhost:4000/api";

async function apiFetch(url, options = {}) {
  try {
    const res = await fetch(API_BASE + url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) throw new Error("API Error: " + res.status);
    return await res.json();
  } catch (err) {
    console.warn("API failed → using local fallback:", url);
    throw err;
  }
}

const apiClient = {
  get: (resource) => apiFetch("/" + resource),
  put: (resource, data) =>
    apiFetch("/" + resource, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

function bmiFrom(heightCm, weightKg) {
  if (!heightCm || !weightKg) return null;
  const h = heightCm / 100;
  return +(weightKg / (h * h)).toFixed(1);
}

function caloriesBurned(workout) {
  if (!workout || !workout.minutes || !workout.weightKg) return 0;
  const mets = { Running: 9.8, Walking: 3.8, Cycling: 7.5, Strength: 6.0, Yoga: 3.0 };
  const met = mets[workout.type] || 5;
  return Math.round(met * workout.weightKg * (workout.minutes / 60));
}

function projectedDaysToTarget(currentWeight, targetWeight, avgCalDeficit) {
  if (currentWeight <= targetWeight || avgCalDeficit <= 0) return 0;
  const kcalNeeded = (currentWeight - targetWeight) * 7700;
  return Math.ceil(kcalNeeded / avgCalDeficit);
}

const AppContext = createContext();
function useApp() {
  return useContext(AppContext);
}

export default function Appp() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [apiOnline, setApiOnline] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [u, us, w, m, c] = await Promise.all([
          apiClient.get("user"),
          apiClient.get("users"),
          apiClient.get("workouts"),
          apiClient.get("messages"),
          apiClient.get("challenges"),
        ]);
        setUser(u);
        setUsers(us);
        setWorkouts(w);
        setMessages(m);
        setChallenges(c);
        setApiOnline(true);
      } catch (err) {
        setApiOnline(false);
        console.log("API offline, using empty fallback data.");
      }
    }
    load();
  }, []);

  const sync = (key, value) => {
    apiClient.put(key.replace("fb_", ""), value)
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));
  };

  useEffect(() => { if (user !== null) sync("fb_user", user); }, [user]);
  useEffect(() => sync("fb_users", users), [users]);
  useEffect(() => sync("fb_workouts", workouts), [workouts]);
  useEffect(() => sync("fb_messages", messages), [messages]);
  useEffect(() => sync("fb_challenges", challenges), [challenges]);

  const value = {
    user, setUser,
    users, setUsers,
    workouts, setWorkouts,
    messages, setMessages,
    challenges, setChallenges,
    apiOnline,
  };

  return (
    <AppContext.Provider value={value}>
      <div className="fitness-app min-h-screen bg-gray-50 text-gray-800">
        <header className="bg-white shadow">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">FitnessBuddy</h1>
            <Nav />
          </div>
        </header>

        <main className="max-w-6xl mx-auto p-4">
          {!user ? <Auth /> : <Dashboard />}
          <div className="text-xs mt-3 text-right text-gray-500">
            API: {apiOnline ? "Online" : "Offline (empty cache)"}
          </div>
        </main>
      </div>
    </AppContext.Provider>
  );
}

function Auth() {
  const { setUser } = useApp();
  const [form, setForm] = useState({ password: "" });
  const [mode, setMode] = useState("login");
  function login() {
    setUser({
      id: 1,
      name: "Demo User",
      location: "City",
      gender: "Other",
      heightCm: 170,
      weightKg: 70,
      preferredWorkouts: ["Running", "Yoga"],
      targetBMI: 22,
    });
  }
  function register() {
    setUser({
      id: Date.now(),
      name: "New User",
      location: form.location || "City",
      gender: "Other",
      heightCm: form.heightCm || 170,
      weightKg: form.weightKg || 70,
      preferredWorkouts: form.preferredWorkouts || ["Running"],
      targetBMI: form.targetBMI || 22,
    });
  }
  return (
    <div>
      <input
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        className="w-full px-3 py-2 border rounded"
      />
      {mode === "register" && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Height (cm)"
              type="number"
              onChange={(e) => setForm({ ...form, heightCm: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded"
            />
            <input
              placeholder="Weight (kg)"
              type="number"
              onChange={(e) => setForm({ ...form, weightKg: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <input
            placeholder="Location (city)"
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full px-3 py-2 border rounded"
          />
          <input
            placeholder="Preferred workouts (comma separated)"
            onChange={(e) => setForm({ ...form, preferredWorkouts: e.target.value.split(",") })}
            className="w-full px-3 py-2 border rounded"
          />
          <input
            placeholder="Target BMI (optional)"
            type="number"
            onChange={(e) => setForm({ ...form, targetBMI: Number(e.target.value) })}
            className="w-full px-3 py-2 border rounded"
          />
        </>
      )}
      <div className="flex gap-2 mt-3">
        {mode === "login" ? (
          <>
            <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={login}>
              Login
            </button>
            <button
              className="px-3 py-2 bg-gray-200 rounded"
              onClick={() => setMode("register")}
            >
              Create account
            </button>
          </>
        ) : (
          <>
            <button className="px-3 py-2 bg-green-600 text-white rounded" onClick={register}>
              Register & Continue
            </button>
            <button className="px-3 py-2 bg-gray-200 rounded" onClick={() => setMode("login")}>Cancel</button>
          </>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-lg font-medium mb-2">Why FitnessBuddy?</h3>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
          <li>Find local workout partners with similar goals.</li>
          <li>Log workouts, track calories and BMI progress.</li>
          <li>Create small challenges to stay motivated.</li>
        </ul>
        <div className="mt-6 bg-white p-4 rounded shadow">
          <h4 className="font-semibold">Demo users</h4>
          <p className="text-sm text-gray-600">Create an account or click a demo user to try features.</p>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { user, users } = useApp();
  const [tab, setTab] = useState("home");
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Hello, {user.name}</h2>
            <div className="space-x-2">
              <button onClick={() => setTab("workout")} className="px-3 py-1 bg-blue-50 rounded">Log workout</button>
              <button onClick={() => setTab("match")} className="px-3 py-1 bg-blue-50 rounded">Find buddy</button>
              <button onClick={() => setTab("messages")} className="px-3 py-1 bg-blue-50 rounded">Messages</button>
            </div>
          </div>
          <div className="mt-4">
            {tab === "home" && <HomePanel />}
            {tab === "workout" && <WorkoutLogger />}
            {tab === "match" && <BuddyMatch />}
            {tab === "messages" && <MessagesUI />}
            {tab === "challenges" && <ChallengesUI />}
          </div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Community</h3>
          <p className="text-sm text-gray-600">Nearby users (demo):</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {users.slice(0, 6).map((u) => (
              <div key={u.id} className="p-2 border rounded text-sm">
                <div className="font-medium">{u.name}</div>
                <div className="text-xs text-gray-600">{u.location}</div>
                <div className="text-xs text-gray-600">{u.preferredWorkouts?.join(", ")}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <aside className="space-y-4">
        <ProfileCard />
        <ChallengeSummary />
      </aside>
    </div>
  );
}

function HomePanel() {
  const { workouts } = useApp();
  const latest = workouts.slice(-5).reverse();
  return (
    <div>
      <h3 className="font-semibold">Recent workouts</h3>
      <ul className="mt-2 space-y-2">
        {latest.length === 0 && <li className="text-sm text-gray-500">No workouts yet.</li>}
        {latest.map((w) => (
          <li key={w.id} className="p-2 border rounded bg-gray-50 text-sm">
            <div className="flex justify-between">
              <div>
                <div className="font-medium">{w.type} — {w.minutes} min</div>
                <div className="text-xs text-gray-600">Calories: {caloriesBurned(w)}</div>
              </div>
              <div className="text-xs text-gray-500">{new Date(w.date).toLocaleDateString()}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProfileCard() {
  const { user, setUser, workouts } = useApp();
  if (!user) return null;

  const currentBMI = bmiFrom(user.heightCm, user.weightKg);
  const targetBMI = user.targetBMI || null;

  const recent = workouts.filter((w) => w.userId === user.id && (Date.now() - new Date(w.date).getTime()) < 1000 * 60 * 60 * 24 * 14);
  const totalCals = recent.reduce((s, r) => s + caloriesBurned(r), 0);
  const avgPerDay = Math.round(totalCals / 14) || 0;

  const avgWeightLossPerDayKg = (avgPerDay / 7700).toFixed(4);

  let projectedDays = 0;
  if (user.weightKg && user.targetBMI && user.heightCm) {
    const h = user.heightCm / 100;
    const targetWeight = +(user.targetBMI * h * h).toFixed(1);
    projectedDays = projectedDaysToTarget(user.weightKg, targetWeight, avgPerDay);
  }

  function quickEdit() {
    const newName = prompt("Change display name", user.name);
    if (newName) setUser({ ...user, name: newName });
  }

  return (
    <div className="bg-white p-4 rounded shadow text-sm">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold">{user.name}</div>
          <div className="text-xs text-gray-600">{user.location} • {user.gender}</div>
        </div>
        <div>
          <button onClick={quickEdit} className="text-xs px-2 py-1 border rounded">Edit</button>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div>Height: {user.heightCm} cm</div>
        <div>Weight: {user.weightKg} kg</div>
        <div>Current BMI: <strong>{currentBMI ?? "—"}</strong></div>
        <div>Target BMI: <strong>{targetBMI ?? "—"}</strong></div>
        <div>Avg cal/day (last 14d): {avgPerDay} kcal</div>
        <div>Projected days to target: {projectedDays || "—"}</div>
      </div>
    </div>
  );
}

function WorkoutLogger() {
  const { user, workouts, setWorkouts } = useApp();
  const [form, setForm] = useState({ type: "Running", minutes: 30 });

  function add() {
    const id = Date.now();
    const w = { id, userId: user.id, date: new Date().toISOString(), weightKg: user.weightKg, ...form };
    setWorkouts([...workouts, w]);
    alert(`Logged ${form.type} — ${form.minutes} min — approx ${caloriesBurned({ ...w })} kcal`);
  }

  return (
    <div className="p-4 bg-gray-50 rounded">
      <h4 className="font-semibold mb-2">Log a workout</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="px-3 py-2 border rounded">
          <option>Running</option>
          <option>Walking</option>
          <option>Cycling</option>
          <option>Strength</option>
          <option>Yoga</option>
        </select>
        <input type="number" value={form.minutes} onChange={(e) => setForm({ ...form, minutes: Number(e.target.value) })} className="px-3 py-2 border rounded" />
      </div>

      <div className="mt-3">
        <button onClick={add} className="px-3 py-2 bg-blue-600 text-white rounded">Add workout</button>
      </div>
    </div>
  );
}

function BuddyMatch() {
  const { user, users } = useApp();

  const matches = users.filter((u) => u.id !== user.id && (u.location === user.location || true)).filter((u) => {
    const common = (u.preferredWorkouts || []).filter((t) => (user.preferredWorkouts || []).includes(t));
    return common.length > 0;
  });

  return (
    <div>
      <h4 className="font-semibold">Potential buddies</h4>
      {matches.length === 0 && <div className="text-sm text-gray-500 mt-2">No matches yet. Invite friends!</div>}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
        {matches.map((m) => (
          <div key={m.id} className="p-3 border rounded bg-white">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{m.name}</div>
                <div className="text-xs text-gray-600">{m.location}</div>
                <div className="text-xs text-gray-600">{m.preferredWorkouts?.join(", ")}</div>
              </div>
              <div>
                <button
                  className="px-2 py-1 bg-green-500 text-white rounded text-xs"
                  onClick={() => alert(`Request sent to ${m.name} (demo)`)}
                >
                  Connect
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MessagesUI() {
  const { user, messages, setMessages, users } = useApp();
  const [peerId, setPeerId] = useState(null);
  const [text, setText] = useState("");

  const conversation = messages.filter((m) => (m.from === user.id && m.to === peerId) || (m.to === user.id && m.from === peerId));

  function send() {
    if (!peerId) return alert("Select a buddy to message");
    const m = { id: Date.now(), from: user.id, to: peerId, text, date: new Date().toISOString() };
    setMessages([...messages, m]);
    setText("");
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-1">
        <h5 className="font-semibold">Buddies</h5>
        <div className="mt-2 space-y-2">
          {users.filter((u) => u.id !== user.id).map((u) => (
            <div key={u.id} className={`p-2 rounded border cursor-pointer ${peerId === u.id ? "bg-blue-50" : "bg-white"}`} onClick={() => setPeerId(u.id)}>
              <div className="font-medium">{u.name}</div>
              <div className="text-xs text-gray-600">{u.location}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="md:col-span-2 bg-white p-3 rounded shadow">
        {!peerId ? (
          <div className="text-sm text-gray-500">Select a buddy to start chat.</div>
        ) : (
          <>
            <div className="h-64 overflow-auto p-2 border rounded bg-gray-50">
              {conversation.map((m) => (
                <div key={m.id} className={`mb-2 p-2 rounded ${m.from === user.id ? "bg-blue-100 self-end" : "bg-white"}`}>
                  <div className="text-sm">{m.text}</div>
                  <div className="text-xs text-gray-500">{new Date(m.date).toLocaleString()}</div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)} className="flex-1 px-3 py-2 border rounded" />
              <button onClick={send} className="px-3 py-2 bg-blue-600 text-white rounded">Send</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ChallengesUI() {
  const { user, challenges, setChallenges } = useApp();
  const [title, setTitle] = useState("");

  function create() {
    const c = { id: Date.now(), title, author: user.id, participants: [user.id], progress: {} };
    setChallenges([...challenges, c]);
    setTitle("");
  }

  return (
    <div>
      <h4 className="font-semibold">Challenges</h4>
      <div className="mt-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Run 10 miles this week" className="px-3 py-2 border rounded w-full" />
        <div className="mt-2">
          <button className="px-3 py-2 bg-green-600 text-white rounded" onClick={create}>Create</button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {challenges.length === 0 && <div className="text-sm text-gray-500">No challenges yet.</div>}
        {challenges.map((c) => (
          <div key={c.id} className="p-3 border rounded bg-white">
            <div className="flex justify-between items-center">
              <div className="font-medium">{c.title}</div>
              <div className="text-xs">By {c.author === user.id ? "You" : "Community"}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChallengeSummary() {
  const { challenges } = useApp();
  return (
    <div className="bg-white p-4 rounded shadow text-sm">
      <div className="font-semibold">Challenges</div>
      <div className="mt-2 text-xs text-gray-600">Active: {challenges.length}</div>
    </div>
  );
}

function randomId() {
  return Math.random().toString(36).slice(2, 9);
}

function Auth() {
  const { setUser } = useApp();
  const [form, setForm] = useState({ password: "" });
  const [mode, setMode] = useState("login");
  function login() {
    // Demo: set a dummy user
    setUser({
      id: 1,
      name: "Demo User",
      location: "City",
      gender: "Other",
      heightCm: 170,
      weightKg: 70,
      preferredWorkouts: ["Running", "Yoga"],
      targetBMI: 22,
    });
  }
  function register() {
    setUser({
      id: Date.now(),
      name: "New User",
      location: form.location || "City",
      gender: "Other",
      heightCm: form.heightCm || 170,
      weightKg: form.weightKg || 70,
      preferredWorkouts: form.preferredWorkouts || ["Running"],
      targetBMI: form.targetBMI || 22,
    });
  }
  return (
    <div>
      <input
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        className="w-full px-3 py-2 border rounded"
      />
      {mode === "register" && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Height (cm)"
              type="number"
              onChange={(e) => setForm({ ...form, heightCm: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded"
            />
            <input
              placeholder="Weight (kg)"
              type="number"
              onChange={(e) => setForm({ ...form, weightKg: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <input
            placeholder="Location (city)"
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full px-3 py-2 border rounded"
          />
          <input
            placeholder="Preferred workouts (comma separated)"
            onChange={(e) => setForm({ ...form, preferredWorkouts: e.target.value.split(",") })}
            className="w-full px-3 py-2 border rounded"
          />
          <input
            placeholder="Target BMI (optional)"
            type="number"
            onChange={(e) => setForm({ ...form, targetBMI: Number(e.target.value) })}
            className="w-full px-3 py-2 border rounded"
          />
        </>
      )}
      <div className="flex gap-2 mt-3">
        {mode === "login" ? (
          <>
            <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={login}>
              Login
            </button>
            <button
              className="px-3 py-2 bg-gray-200 rounded"
              onClick={() => setMode("register")}
            >
              Create account
            </button>
          </>
        ) : (
          <>
            <button className="px-3 py-2 bg-green-600 text-white rounded" onClick={register}>
              Register & Continue
            </button>
            <button className="px-3 py-2 bg-gray-200 rounded" onClick={() => setMode("login")}>Cancel</button>
          </>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-lg font-medium mb-2">Why FitnessBuddy?</h3>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
          <li>Find local workout partners with similar goals.</li>
          <li>Log workouts, track calories and BMI progress.</li>
          <li>Create small challenges to stay motivated.</li>
        </ul>
        <div className="mt-6 bg-white p-4 rounded shadow">
          <h4 className="font-semibold">Demo users</h4>
          <p className="text-sm text-gray-600">Create an account or click a demo user to try features.</p>
        </div>
      </div>
    </div>
  );
}

/***********************
 * Dashboard
 ***********************/
function Dashboard() {
  const { user, users } = useApp();
  const [tab, setTab] = useState("home");
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Hello, {user.name}</h2>
            <div className="space-x-2">
              <button onClick={() => setTab("workout")} className="px-3 py-1 bg-blue-50 rounded">Log workout</button>
              <button onClick={() => setTab("match")} className="px-3 py-1 bg-blue-50 rounded">Find buddy</button>
              <button onClick={() => setTab("messages")} className="px-3 py-1 bg-blue-50 rounded">Messages</button>
            </div>
          </div>
          <div className="mt-4">
            {tab === "home" && <HomePanel />}
            {tab === "workout" && <WorkoutLogger />}
            {tab === "match" && <BuddyMatch />}
            {tab === "messages" && <MessagesUI />}
            {tab === "challenges" && <ChallengesUI />}
          </div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Community</h3>
          <p className="text-sm text-gray-600">Nearby users (demo):</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {users.slice(0, 6).map((u) => (
              <div key={u.id} className="p-2 border rounded text-sm">
                <div className="font-medium">{u.name}</div>
                <div className="text-xs text-gray-600">{u.location}</div>
                <div className="text-xs text-gray-600">{u.preferredWorkouts?.join(", ")}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <aside className="space-y-4">
        <ProfileCard />
        <ChallengeSummary />
      </aside>
    </div>
  );
}

function HomePanel() {
  const { workouts } = useApp();
  const latest = workouts.slice(-5).reverse();
  return (
    <div>
      <h3 className="font-semibold">Recent workouts</h3>
      <ul className="mt-2 space-y-2">
        {latest.length === 0 && <li className="text-sm text-gray-500">No workouts yet.</li>}
        {latest.map((w) => (
          <li key={w.id} className="p-2 border rounded bg-gray-50 text-sm">
            <div className="flex justify-between">
              <div>
                <div className="font-medium">{w.type} — {w.minutes} min</div>
                <div className="text-xs text-gray-600">Calories: {caloriesBurned(w)}</div>
              </div>
              <div className="text-xs text-gray-500">{new Date(w.date).toLocaleDateString()}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/***********************
 * Profile / BMI Card
 ***********************/
function ProfileCard() {
  const { user, setUser, workouts } = useApp();
  if (!user) return null;

  const currentBMI = bmiFrom(user.heightCm, user.weightKg);
  const targetBMI = user.targetBMI || null;

  // estimate avg calorie deficit per day from last 14 days workouts
  const recent = workouts.filter((w) => w.userId === user.id && (Date.now() - new Date(w.date).getTime()) < 1000 * 60 * 60 * 24 * 14);
  const totalCals = recent.reduce((s, r) => s + caloriesBurned(r), 0);
  const avgPerDay = Math.round(totalCals / 14) || 0;

  const avgWeightLossPerDayKg = (avgPerDay / 7700).toFixed(4);

  let projectedDays = 0;
  if (user.weightKg && user.targetBMI && user.heightCm) {
    const h = user.heightCm / 100;
    const targetWeight = +(user.targetBMI * h * h).toFixed(1);
    projectedDays = projectedDaysToTarget(user.weightKg, targetWeight, avgPerDay);
  }

  function quickEdit() {
    const newName = prompt("Change display name", user.name);
    if (newName) setUser({ ...user, name: newName });
  }

  return (
    <div className="bg-white p-4 rounded shadow text-sm">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold">{user.name}</div>
          <div className="text-xs text-gray-600">{user.location} • {user.gender}</div>
        </div>
        <div>
          <button onClick={quickEdit} className="text-xs px-2 py-1 border rounded">Edit</button>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div>Height: {user.heightCm} cm</div>
        <div>Weight: {user.weightKg} kg</div>
        <div>Current BMI: <strong>{currentBMI ?? "—"}</strong></div>
        <div>Target BMI: <strong>{targetBMI ?? "—"}</strong></div>
        <div>Avg cal/day (last 14d): {avgPerDay} kcal</div>
        <div>Projected days to target: {projectedDays || "—"}</div>
      </div>
    </div>
  );
}

/***********************
 * Workout logger
 ***********************/
function WorkoutLogger() {
  const { user, workouts, setWorkouts } = useApp();
  const [form, setForm] = useState({ type: "Running", minutes: 30 });

  function add() {
    const id = Date.now();
    const w = { id, userId: user.id, date: new Date().toISOString(), weightKg: user.weightKg, ...form };
    setWorkouts([...workouts, w]);
    alert(`Logged ${form.type} — ${form.minutes} min — approx ${caloriesBurned({ ...w })} kcal`);
  }

  return (
    <div className="p-4 bg-gray-50 rounded">
      <h4 className="font-semibold mb-2">Log a workout</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="px-3 py-2 border rounded">
          <option>Running</option>
          <option>Walking</option>
          <option>Cycling</option>
          <option>Strength</option>
          <option>Yoga</option>
        </select>
        <input type="number" value={form.minutes} onChange={(e) => setForm({ ...form, minutes: Number(e.target.value) })} className="px-3 py-2 border rounded" />
      </div>

      <div className="mt-3">
        <button onClick={add} className="px-3 py-2 bg-blue-600 text-white rounded">Add workout</button>
      </div>
    </div>
  );
}

/***********************
 * Buddy matching (basic)
 ***********************/
function BuddyMatch() {
  const { user, users } = useApp();

  // naive matching: share at least one workout type and location
  const matches = users.filter((u) => u.id !== user.id && (u.location === user.location || true)).filter((u) => {
    const common = (u.preferredWorkouts || []).filter((t) => (user.preferredWorkouts || []).includes(t));
    return common.length > 0;
  });

  return (
    <div>
      <h4 className="font-semibold">Potential buddies</h4>
      {matches.length === 0 && <div className="text-sm text-gray-500 mt-2">No matches yet. Invite friends!</div>}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
        {matches.map((m) => (
          <div key={m.id} className="p-3 border rounded bg-white">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{m.name}</div>
                <div className="text-xs text-gray-600">{m.location}</div>
                <div className="text-xs text-gray-600">{m.preferredWorkouts?.join(", ")}</div>
              </div>
              <div>
                <button
                  className="px-2 py-1 bg-green-500 text-white rounded text-xs"
                  onClick={() => alert(`Request sent to ${m.name} (demo)`)}
                >
                  Connect
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/***********************
 * Simple messaging UI (local-only demo)
 ***********************/
function MessagesUI() {
  const { user, messages, setMessages, users } = useApp();
  const [peerId, setPeerId] = useState(null);
  const [text, setText] = useState("");

  const conversation = messages.filter((m) => (m.from === user.id && m.to === peerId) || (m.to === user.id && m.from === peerId));

  function send() {
    if (!peerId) return alert("Select a buddy to message");
    const m = { id: Date.now(), from: user.id, to: peerId, text, date: new Date().toISOString() };
    setMessages([...messages, m]);
    setText("");
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-1">
        <h5 className="font-semibold">Buddies</h5>
        <div className="mt-2 space-y-2">
          {users.filter((u) => u.id !== user.id).map((u) => (
            <div key={u.id} className={`p-2 rounded border cursor-pointer ${peerId === u.id ? "bg-blue-50" : "bg-white"}`} onClick={() => setPeerId(u.id)}>
              <div className="font-medium">{u.name}</div>
              <div className="text-xs text-gray-600">{u.location}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="md:col-span-2 bg-white p-3 rounded shadow">
        {!peerId ? (
          <div className="text-sm text-gray-500">Select a buddy to start chat.</div>
        ) : (
          <>
            <div className="h-64 overflow-auto p-2 border rounded bg-gray-50">
              {conversation.map((m) => (
                <div key={m.id} className={`mb-2 p-2 rounded ${m.from === user.id ? "bg-blue-100 self-end" : "bg-white"}`}>
                  <div className="text-sm">{m.text}</div>
                  <div className="text-xs text-gray-500">{new Date(m.date).toLocaleString()}</div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)} className="flex-1 px-3 py-2 border rounded" />
              <button onClick={send} className="px-3 py-2 bg-blue-600 text-white rounded">Send</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/***********************
 * Challenges
 ***********************/
function ChallengesUI() {
  const { user, challenges, setChallenges } = useApp();
  const [title, setTitle] = useState("");

  function create() {
    const c = { id: Date.now(), title, author: user.id, participants: [user.id], progress: {} };
    setChallenges([...challenges, c]);
    setTitle("");
  }

  return (
    <div>
      <h4 className="font-semibold">Challenges</h4>
      <div className="mt-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Run 10 miles this week" className="px-3 py-2 border rounded w-full" />
        <div className="mt-2">
          <button className="px-3 py-2 bg-green-600 text-white rounded" onClick={create}>Create</button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {challenges.length === 0 && <div className="text-sm text-gray-500">No challenges yet.</div>}
        {challenges.map((c) => (
          <div key={c.id} className="p-3 border rounded bg-white">
            <div className="flex justify-between items-center">
              <div className="font-medium">{c.title}</div>
              <div className="text-xs">By {c.author === user.id ? "You" : "Community"}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChallengeSummary() {
  const { challenges } = useApp();
  return (
    <div className="bg-white p-4 rounded shadow text-sm">
      <div className="font-semibold">Challenges</div>
      <div className="mt-2 text-xs text-gray-600">Active: {challenges.length}</div>
    </div>
  );
}

/***********************
 * Small utilities
 ***********************/
function randomId() {
  return Math.random().toString(36).slice(2, 9);
}
