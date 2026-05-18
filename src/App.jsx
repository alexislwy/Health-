import { useState, useEffect } from "react";

const STORAGE_KEY = "health_tracker_data";

const defaultEntry = () => ({
  date: new Date().toISOString().split("T")[0],
  weight: "",
  sleepHours: "",
  sleepMinutes: "",
  sleepQuality: "",
  water: "",
  bowel: "",
  bowelNotes: "",
  exercise: [],
  exerciseCalories: {},
  meals: { breakfast: "", lunch: "", dinner: "", snack: "" },
  mealCalories: { breakfast: "", lunch: "", dinner: "", snack: "" },
  mood: "",
  notes: "",
});

const MOOD_OPTIONS = [
  { value: "great", label: "超棒", emoji: "😄" },
  { value: "good", label: "不錯", emoji: "🙂" },
  { value: "okay", label: "普通", emoji: "😐" },
  { value: "tired", label: "疲憊", emoji: "😩" },
  { value: "bad", label: "很差", emoji: "😞" },
];

const EXERCISE_OPTIONS = [
  { value: "walk", label: "散步", icon: "🚶" },
  { value: "run", label: "跑步", icon: "🏃" },
  { value: "bike", label: "騎車", icon: "🚴" },
  { value: "swim", label: "游泳", icon: "🏊" },
  { value: "yoga", label: "瑜珈", icon: "🧘" },
  { value: "gym", label: "健身房", icon: "🏋️" },
  { value: "dance", label: "舞蹈", icon: "💃" },
  { value: "other", label: "其他", icon: "⚡" },
];

const SLEEP_QUALITY = [
  { value: "deep", label: "熟睡" },
  { value: "okay", label: "還好" },
  { value: "light", label: "淺眠" },
  { value: "poor", label: "難入眠" },
];

const BOWEL_OPTIONS = [
  { value: "0", label: "無" },
  { value: "1", label: "1次" },
  { value: "2", label: "2次" },
  { value: "3+", label: "3次以上" },
];

const MEAL_LABELS = { breakfast: "早餐", lunch: "午餐", dinner: "晚餐", snack: "點心" };
const MEAL_COLORS = {
  breakfast: "#f59e0b",
  lunch: "#10b981",
  dinner: "#6366f1",
  snack: "#ec4899",
};

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("zh-TW", { month: "long", day: "numeric", weekday: "short" });
}

function getTotalIntake(entry) {
  return Object.values(entry.mealCalories || {}).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
}

function getTotalBurn(entry) {
  return Object.values(entry.exerciseCalories || {}).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
}

function getNetCalories(entry) {
  return getTotalIntake(entry) - getTotalBurn(entry);
}

function CalorieSummary({ entry }) {
  const intake = getTotalIntake(entry);
  const burn = getTotalBurn(entry);
  const net = intake - burn;
  const hasData = intake > 0 || burn > 0;
  if (!hasData) return null;

  const isDeficit = net < 0;
  const isSurplus = net > 0;
  const netColor = isDeficit ? "#6ee7b7" : isSurplus ? "#f87171" : "#fbbf24";
  const netLabel = isDeficit ? "🎉 熱量赤字！減重有望" : isSurplus ? "⚠️ 熱量盈餘，注意攝取" : "✅ 熱量平衡";

  const meals = ["breakfast", "lunch", "dinner", "snack"];
  const mealCals = meals.map(m => parseFloat(entry.mealCalories?.[m]) || 0);
  const totalForBar = intake || 1;

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(59,130,246,0.12))",
      border: "1px solid rgba(110,231,183,0.2)",
      borderRadius: 16,
      padding: "16px 18px",
      marginBottom: 14,
    }}>
      <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: 14, color: "#a8d5c2", marginBottom: 14, letterSpacing: 1 }}>
        🔥 今日卡路里分析
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[
          { label: "攝取", value: intake, color: "#fbbf24", unit: "kcal" },
          { label: "消耗", value: burn, color: "#60a5fa", unit: "kcal" },
          { label: "淨值", value: Math.abs(net), color: netColor, unit: isDeficit ? "kcal ▼" : isSurplus ? "kcal ▲" : "kcal" },
        ].map(({ label, value, color, unit }) => (
          <div key={label} style={{
            background: "rgba(0,0,0,0.2)",
            borderRadius: 12,
            padding: "10px 8px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 11, color: "#7fb3a0", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: "monospace", lineHeight: 1 }}>{value || 0}</div>
            <div style={{ fontSize: 10, color: "#5a8a78", marginTop: 2 }}>{unit}</div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", fontSize: 12, color: netColor, fontWeight: 600, marginBottom: 12, letterSpacing: 0.5 }}>
        {netLabel}
      </div>
      {intake > 0 && (
        <div>
          <div style={{ fontSize: 11, color: "#7fb3a0", marginBottom: 6 }}>各餐佔比</div>
          <div style={{ display: "flex", height: 10, borderRadius: 6, overflow: "hidden", gap: 1 }}>
            {meals.map((m, i) => {
              const pct = (mealCals[i] / totalForBar) * 100;
              if (pct === 0) return null;
              return <div key={m} style={{ width: `${pct}%`, background: MEAL_COLORS[m], opacity: 0.85, transition: "width 0.4s" }} />;
            })}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", marginTop: 7 }}>
            {meals.map((m, i) => mealCals[i] > 0 && (
              <span key={m} style={{ fontSize: 10, color: "#7fb3a0", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: MEAL_COLORS[m] }} />
                {MEAL_LABELS[m]} {mealCals[i]} kcal
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WeightChart({ records }) {
  const withWeight = records.filter((r) => r.weight).slice(-14);
  if (withWeight.length < 2) return null;
  const weights = withWeight.map((r) => parseFloat(r.weight));
  const min = Math.min(...weights) - 1;
  const max = Math.max(...weights) + 1;
  const range = max - min || 1;
  const W = 300, H = 100;
  const points = withWeight.map((r, i) => {
    const x = (i / (withWeight.length - 1)) * (W - 20) + 10;
    const y = H - ((parseFloat(r.weight) - min) / range) * (H - 20) - 10;
    return `${x},${y}`;
  });
  return (
    <div style={{ margin: "12px 0", background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "12px 16px" }}>
      <div style={{ fontSize: 12, color: "#a8d5c2", marginBottom: 8, fontFamily: "'Noto Serif TC', serif" }}>近期體重趨勢（kg）</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 80 }}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <polyline points={points.join(" ")} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {withWeight.map((r, i) => {
          const [x, y] = points[i].split(",").map(Number);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="4" fill="#6ee7b7" />
              <text x={x} y={y - 8} textAnchor="middle" fontSize="9" fill="#a8d5c2">{r.weight}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      borderRadius: 16,
      padding: "16px 18px",
      marginBottom: 14,
      border: "1px solid rgba(255,255,255,0.07)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontFamily: "'Noto Serif TC', serif", fontSize: 15, color: "#e2f0eb", fontWeight: 600, letterSpacing: 1 }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

const inputStyle = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
  color: "#e2f0eb",
  padding: "7px 11px",
  fontSize: 14,
  fontFamily: "sans-serif",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const chipBase = {
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 20,
  padding: "5px 13px",
  fontSize: 12,
  cursor: "pointer",
  fontFamily: "sans-serif",
  transition: "all 0.15s",
  userSelect: "none",
};

export default function App() {
  const [tab, setTab] = useState("today");
  const [entry, setEntry] = useState(defaultEntry());
  const [records, setRecords] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setRecords(JSON.parse(raw));
    } catch {}
  }, []);

  const updateEntry = (field, value) => setEntry((e) => ({ ...e, [field]: value }));
  const updateMeal = (meal, value) => setEntry((e) => ({ ...e, meals: { ...e.meals, [meal]: value } }));
  const updateMealCal = (meal, value) => setEntry((e) => ({ ...e, mealCalories: { ...e.mealCalories, [meal]: value } }));
  const updateExerciseCal = (exVal, calValue) => setEntry((e) => ({ ...e, exerciseCalories: { ...e.exerciseCalories, [exVal]: calValue } }));
  const toggleExercise = (val) =>
    setEntry((e) => ({
      ...e,
      exercise: e.exercise.includes(val)
        ? e.exercise.filter((x) => x !== val)
        : [...e.exercise, val],
    }));

  const saveEntry = () => {
    const updated = records.filter((r) => r.date !== entry.date).concat(entry);
    updated.sort((a, b) => b.date.localeCompare(a.date));
    setRecords(updated);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const loadRecord = (r) => {
    setEntry({ ...defaultEntry(), ...r });
    setTab("today");
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(145deg, #0d1f1a 0%, #0f2336 100%)", fontFamily: "sans-serif", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{
        padding: "28px 20px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(13,31,26,0.92)",
        backdropFilter: "blur(12px)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: 22, color: "#6ee7b7", fontWeight: 700, letterSpacing: 2 }}>健康日誌</div>
            <div style={{ fontSize: 11, color: "#5a8a78", marginTop: 2, letterSpacing: 1 }}>減重追蹤記錄</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["today", "history"].map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{
                ...chipBase,
                background: tab === t ? "rgba(110,231,183,0.18)" : "transparent",
                color: tab === t ? "#6ee7b7" : "#5a8a78",
                border: tab === t ? "1px solid rgba(110,231,183,0.4)" : "1px solid rgba(255,255,255,0.1)",
                fontSize: 13,
              }}>
                {t === "today" ? "📝 記錄" : "📊 歷史"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px 0" }}>
        {tab === "today" && (
          <>
            {/* Date */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ color: "#7fb3a0", fontSize: 12, minWidth: 28 }}>日期</span>
              <input type="date" value={entry.date}
                onChange={(e) => updateEntry("date", e.target.value)}
                style={{ ...inputStyle, width: "auto", flex: 1 }} />
            </div>

            {/* Calorie Summary — live updating */}
            <CalorieSummary entry={entry} />

            {/* Weight */}
            <Section title="體重" icon="⚖️">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: "#7fb3a0", minWidth: 60 }}>體重 (kg)</span>
                <input type="number" placeholder="例：65.5" step="0.1" value={entry.weight}
                  onChange={(e) => updateEntry("weight", e.target.value)}
                  style={inputStyle} />
              </div>
              <WeightChart records={records} />
            </Section>

            {/* Sleep */}
            <Section title="睡眠" icon="🌙">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: "#7fb3a0", minWidth: 60 }}>睡眠時間</span>
                <div style={{ position: "relative", flex: 1 }}>
                  <input type="number" placeholder="0" min="0" max="24" value={entry.sleepHours}
                    onChange={(e) => updateEntry("sleepHours", e.target.value)}
                    style={{ ...inputStyle, paddingRight: 28, textAlign: "right" }} />
                  <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#5a8a78", pointerEvents: "none" }}>時</span>
                </div>
                <div style={{ position: "relative", flex: 1 }}>
                  <input type="number" placeholder="0" min="0" max="59" value={entry.sleepMinutes}
                    onChange={(e) => updateEntry("sleepMinutes", e.target.value)}
                    style={{ ...inputStyle, paddingRight: 28, textAlign: "right" }} />
                  <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#5a8a78", pointerEvents: "none" }}>分</span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#7fb3a0", marginBottom: 7 }}>睡眠品質</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {SLEEP_QUALITY.map((q) => (
                  <button key={q.value} onClick={() => updateEntry("sleepQuality", q.value)} style={{
                    ...chipBase,
                    background: entry.sleepQuality === q.value ? "rgba(110,231,183,0.18)" : "transparent",
                    color: entry.sleepQuality === q.value ? "#6ee7b7" : "#7fb3a0",
                    border: entry.sleepQuality === q.value ? "1px solid rgba(110,231,183,0.5)" : "1px solid rgba(255,255,255,0.1)",
                  }}>{q.label}</button>
                ))}
              </div>
            </Section>

            {/* Meals + Calories */}
            <Section title="飲食與卡路里" icon="🥗">
              <div style={{ fontSize: 11, color: "#5a8a78", marginBottom: 10, lineHeight: 1.5 }}>
                記錄每餐內容，並輸入估算攝取卡路里
              </div>
              {["breakfast", "lunch", "dinner", "snack"].map((meal) => (
                <div key={meal} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: MEAL_COLORS[meal], flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "#a8d5c2", fontWeight: 600 }}>{MEAL_LABELS[meal]}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 8 }}>
                    <input type="text" placeholder="記錄吃了什麼…" value={entry.meals[meal]}
                      onChange={(e) => updateMeal(meal, e.target.value)}
                      style={inputStyle} />
                    <div style={{ position: "relative" }}>
                      <input type="number" placeholder="kcal" min="0" step="1"
                        value={entry.mealCalories?.[meal] || ""}
                        onChange={(e) => updateMealCal(meal, e.target.value)}
                        style={{ ...inputStyle, paddingRight: 36, textAlign: "right" }} />
                      <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "#5a8a78", pointerEvents: "none" }}>kcal</span>
                    </div>
                  </div>
                </div>
              ))}
              {getTotalIntake(entry) > 0 && (
                <div style={{
                  background: "rgba(251,191,36,0.1)", borderRadius: 8, padding: "8px 12px",
                  display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4,
                }}>
                  <span style={{ fontSize: 12, color: "#fbbf24" }}>今日總攝取</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#fbbf24", fontFamily: "monospace" }}>{getTotalIntake(entry)} kcal</span>
                </div>
              )}
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: "#7fb3a0", minWidth: 60 }}>喝水量</span>
                <div style={{ position: "relative", flex: 1 }}>
                  <input type="number" placeholder="例：2000" min="0" step="50" value={entry.water}
                    onChange={(e) => updateEntry("water", e.target.value)}
                    style={{ ...inputStyle, paddingRight: 32, textAlign: "right" }} />
                  <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#5a8a78", pointerEvents: "none" }}>ml</span>
                </div>
              </div>
            </Section>

            {/* Exercise + Calories */}
            <Section title="運動與消耗" icon="🏃">
              <div style={{ fontSize: 11, color: "#5a8a78", marginBottom: 10 }}>選擇運動類型，輸入本次消耗卡路里</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {EXERCISE_OPTIONS.map((ex) => (
                  <button key={ex.value} onClick={() => toggleExercise(ex.value)} style={{
                    ...chipBase,
                    background: entry.exercise.includes(ex.value) ? "rgba(59,130,246,0.2)" : "transparent",
                    color: entry.exercise.includes(ex.value) ? "#93c5fd" : "#7fb3a0",
                    border: entry.exercise.includes(ex.value) ? "1px solid rgba(93,197,253,0.4)" : "1px solid rgba(255,255,255,0.1)",
                    fontSize: 13,
                  }}>
                    {ex.icon} {ex.label}
                  </button>
                ))}
              </div>
              {entry.exercise.length > 0 && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10 }}>
                  {entry.exercise.map((exVal) => {
                    const ex = EXERCISE_OPTIONS.find(x => x.value === exVal);
                    return (
                      <div key={exVal} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 18, minWidth: 24 }}>{ex?.icon}</span>
                        <span style={{ fontSize: 12, color: "#93c5fd", minWidth: 44 }}>{ex?.label}</span>
                        <div style={{ flex: 1, position: "relative" }}>
                          <input type="number" placeholder="消耗 kcal" min="0" step="1"
                            value={entry.exerciseCalories?.[exVal] || ""}
                            onChange={(e) => updateExerciseCal(exVal, e.target.value)}
                            style={{ ...inputStyle, paddingRight: 36, textAlign: "right" }} />
                          <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "#5a8a78", pointerEvents: "none" }}>kcal</span>
                        </div>
                      </div>
                    );
                  })}
                  {getTotalBurn(entry) > 0 && (
                    <div style={{
                      background: "rgba(96,165,250,0.1)", borderRadius: 8, padding: "8px 12px",
                      display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4,
                    }}>
                      <span style={{ fontSize: 12, color: "#60a5fa" }}>今日總消耗</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "#60a5fa", fontFamily: "monospace" }}>-{getTotalBurn(entry)} kcal</span>
                    </div>
                  )}
                </div>
              )}
            </Section>

            {/* Bowel */}
            <Section title="排便代謝" icon="🚽">
              <div style={{ fontSize: 12, color: "#7fb3a0", marginBottom: 8 }}>今日排便次數</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                {BOWEL_OPTIONS.map((b) => (
                  <button key={b.value} onClick={() => updateEntry("bowel", b.value)} style={{
                    ...chipBase, flex: 1, textAlign: "center",
                    background: entry.bowel === b.value ? "rgba(251,191,36,0.18)" : "transparent",
                    color: entry.bowel === b.value ? "#fbbf24" : "#7fb3a0",
                    border: entry.bowel === b.value ? "1px solid rgba(251,191,36,0.4)" : "1px solid rgba(255,255,255,0.1)",
                  }}>{b.label}</button>
                ))}
              </div>
              <input type="text" placeholder="備註（顏色、狀態等）" value={entry.bowelNotes}
                onChange={(e) => updateEntry("bowelNotes", e.target.value)}
                style={inputStyle} />
            </Section>

            {/* Mood */}
            <Section title="今日心情" icon="💭">
              <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
                {MOOD_OPTIONS.map((m) => (
                  <button key={m.value} onClick={() => updateEntry("mood", m.value)} style={{
                    ...chipBase, flex: 1, textAlign: "center", padding: "8px 4px",
                    background: entry.mood === m.value ? "rgba(167,139,250,0.18)" : "transparent",
                    color: entry.mood === m.value ? "#c4b5fd" : "#7fb3a0",
                    border: entry.mood === m.value ? "1px solid rgba(167,139,250,0.45)" : "1px solid rgba(255,255,255,0.1)",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  }}>
                    <span style={{ fontSize: 20 }}>{m.emoji}</span>
                    <span style={{ fontSize: 11 }}>{m.label}</span>
                  </button>
                ))}
              </div>
            </Section>

            {/* Notes */}
            <Section title="日記備注" icon="📓">
              <textarea placeholder="今天有什麼想記下的嗎？" value={entry.notes}
                onChange={(e) => updateEntry("notes", e.target.value)}
                style={{ ...inputStyle, height: 80, resize: "vertical", lineHeight: 1.6 }} />
            </Section>

            {/* Save */}
            <button onClick={saveEntry} style={{
              width: "100%", padding: "14px", borderRadius: 14, border: "none",
              background: saved ? "linear-gradient(135deg, #059669, #0284c7)" : "linear-gradient(135deg, #10b981, #3b82f6)",
              color: "#fff", fontSize: 16, fontFamily: "'Noto Serif TC', serif",
              fontWeight: 700, letterSpacing: 2, cursor: "pointer", transition: "all 0.2s",
              boxShadow: "0 4px 20px rgba(16,185,129,0.3)",
            }}>
              {saved ? "✓ 已儲存！" : "儲存今日記錄"}
            </button>
          </>
        )}

        {tab === "history" && (
          <>
            <div style={{ marginBottom: 16, fontFamily: "'Noto Serif TC', serif", color: "#6ee7b7", fontSize: 15 }}>
              共 {records.length} 筆記錄
            </div>
            <WeightChart records={records} />
            {records.length === 0 && (
              <div style={{ textAlign: "center", color: "#5a8a78", marginTop: 60, fontSize: 15 }}>
                還沒有記錄喔，快去填寫今天的吧！
              </div>
            )}
            {records.map((r) => {
              const intake = getTotalIntake(r);
              const burn = getTotalBurn(r);
              const net = getNetCalories(r);
              const hasCalories = intake > 0 || burn > 0;
              return (
                <div key={r.date} onClick={() => loadRecord(r)} style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 14, padding: "14px 16px", marginBottom: 10,
                  cursor: "pointer", transition: "background 0.15s",
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(110,231,183,0.07)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontFamily: "'Noto Serif TC', serif", color: "#e2f0eb", fontSize: 14 }}>{formatDate(r.date)}</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {r.weight && <span style={{ fontSize: 12, color: "#6ee7b7", background: "rgba(110,231,183,0.12)", padding: "2px 9px", borderRadius: 10 }}>⚖️ {r.weight}kg</span>}
                      {r.mood && <span style={{ fontSize: 16 }}>{MOOD_OPTIONS.find(m => m.value === r.mood)?.emoji}</span>}
                    </div>
                  </div>
                  {hasCalories && (
                    <div style={{
                      display: "flex", gap: 8, marginBottom: 8,
                      background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: "6px 10px", alignItems: "center",
                    }}>
                      {intake > 0 && <span style={{ fontSize: 11, color: "#fbbf24" }}>🍽 {intake} kcal</span>}
                      {burn > 0 && <span style={{ fontSize: 11, color: "#60a5fa" }}>🏃 -{burn} kcal</span>}
                      {intake > 0 && (
                        <span style={{
                          fontSize: 11, marginLeft: "auto", fontWeight: 600,
                          color: net < 0 ? "#6ee7b7" : net > 0 ? "#f87171" : "#fbbf24",
                        }}>
                          淨 {net > 0 ? "+" : ""}{net} kcal
                        </span>
                      )}
                    </div>
                  )}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {(r.sleepHours || r.sleepMinutes || r.sleep) && (
                      <span style={{ fontSize: 11, color: "#7fb3a0" }}>
                        🌙 {r.sleepHours || Math.floor(r.sleep) || 0}時{r.sleepMinutes || Math.round((r.sleep % 1) * 60) || 0}分
                      </span>
                    )}
                    {r.water && <span style={{ fontSize: 11, color: "#7fb3a0" }}>💧 {r.water}ml</span>}
                    {r.bowel && <span style={{ fontSize: 11, color: "#7fb3a0" }}>🚽 {r.bowel}次</span>}
                    {r.exercise?.length > 0 && (
                      <span style={{ fontSize: 11, color: "#7fb3a0" }}>
                        {r.exercise.map(e => EXERCISE_OPTIONS.find(x => x.value === e)?.icon).join("")}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: "#3d6658", marginTop: 6 }}>點擊載入此記錄</div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
