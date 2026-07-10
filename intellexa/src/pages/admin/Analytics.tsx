import { BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import Card from "../../components/ui/Card";
import { weeklyActivity } from "../../data/mockData";

const categoryPerf = [
  { category: "WebDev", avgScore: 78 },
  { category: "DSA", avgScore: 64 },
  { category: "Frontend", avgScore: 82 },
  { category: "Algorithms", avgScore: 59 },
];

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-neon-cyan" /> Analytics
        </h1>
        <p className="text-ink-dim text-sm">Engagement and performance across the platform.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-5">
          <h3 className="font-display font-semibold text-ink mb-4">Active Users vs Submissions</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232B47" />
                <XAxis dataKey="day" stroke="#5B6488" fontSize={12} />
                <YAxis stroke="#5B6488" fontSize={12} />
                <Tooltip contentStyle={{ background: "#12172A", border: "1px solid #232B47", borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="users" stroke="#4F7CFF" strokeWidth={2} name="Active Users" />
                <Line type="monotone" dataKey="submissions" stroke="#22D3EE" strokeWidth={2} name="Submissions" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-semibold text-ink mb-4">Average Score by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryPerf}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232B47" />
                <XAxis dataKey="category" stroke="#5B6488" fontSize={12} />
                <YAxis stroke="#5B6488" fontSize={12} />
                <Tooltip contentStyle={{ background: "#12172A", border: "1px solid #232B47", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="avgScore" fill="#A855F7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-display font-semibold text-ink mb-4">Key Insights</h3>
        <ul className="space-y-2 text-sm text-ink-dim list-disc list-inside">
          <li>DSA quizzes have 14% lower average scores than WebDev quizzes — consider adding hint tiers.</li>
          <li>Friday sees peak engagement with 705 active users.</li>
          <li>Weekend activity drops ~45% — a weekend mission could re-engage students.</li>
        </ul>
      </Card>
    </div>
  );
}
