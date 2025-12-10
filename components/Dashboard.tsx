import React from 'react';
import { AppView, StatsData } from '../types';
import { Button } from './Button';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Mic, Keyboard, Clock, Activity, ArrowRight } from 'lucide-react';

interface DashboardProps {
  onChangeView: (view: AppView) => void;
}

const data: StatsData[] = [
  { name: 'Mon', transcriptions: 2, fixes: 45 },
  { name: 'Tue', transcriptions: 4, fixes: 80 },
  { name: 'Wed', transcriptions: 1, fixes: 30 },
  { name: 'Thu', transcriptions: 5, fixes: 95 },
  { name: 'Fri', transcriptions: 3, fixes: 60 },
  { name: 'Sat', transcriptions: 0, fixes: 12 },
  { name: 'Sun', transcriptions: 1, fixes: 20 },
];

export const Dashboard: React.FC<DashboardProps> = ({ onChangeView }) => {
  return (
    <div className="p-8 space-y-8 animate-fade-in text-grey">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-black">Good Morning, Guest 👋</h1>
          <p className="text-grey/70 mt-2">Here's your productivity overview for today.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => onChangeView(AppView.TOOLS)}>
            <Keyboard className="w-4 h-4 mr-2" />
            Quick Fix
          </Button>
          <Button onClick={() => onChangeView(AppView.TRANSCRIPTION)}>
            <Mic className="w-4 h-4 mr-2" />
            New Transcription
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-grey/10 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-coral/10 rounded-lg">
              <Keyboard className="w-6 h-6 text-coral" />
            </div>
            <span className="text-teal text-sm font-medium">+12%</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-black">1,240</h3>
            <p className="text-grey/60 text-sm">Keystrokes Saved</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-grey/10 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-teal/10 rounded-lg">
              <Clock className="w-6 h-6 text-teal" />
            </div>
            <span className="text-teal text-sm font-medium">+5%</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-black">4.5 hrs</h3>
            <p className="text-grey/60 text-sm">Transcription Time</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-grey/10 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-bronze/10 rounded-lg">
              <Activity className="w-6 h-6 text-bronze" />
            </div>
            <span className="text-grey/40 text-sm font-medium">--</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-black">92%</h3>
            <p className="text-grey/60 text-sm">Accuracy Rate</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-grey/10 shadow-sm">
          <h3 className="text-lg font-semibold text-black mb-6">Weekly Activity</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7ECEF" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" tick={{fontSize: 12}} />
                <YAxis stroke="#9ca3af" tick={{fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E7ECEF', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#272932' }}
                />
                <Bar dataKey="fixes" fill="#F05D5E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="transcriptions" fill="#0F7173" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl border border-grey/10 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-black">Recent Files</h3>
            <button className="text-teal text-sm font-medium hover:text-teal-hover">View All</button>
          </div>
          <div className="space-y-4">
            {[
              { title: 'Client Call - ABC Tech', date: 'Today, 10:30 AM', type: 'Sales' },
              { title: 'Weekly Sync', date: 'Yesterday, 4:00 PM', type: 'Meeting' },
              { title: 'Interview Candidate A', date: 'Dec 12, 2:00 PM', type: 'HR' },
            ].map((item, i) => (
              <div key={i} className="group flex items-center justify-between p-3 rounded-lg hover:bg-platinum transition-colors cursor-pointer border border-transparent">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-platinum flex items-center justify-center">
                     <Mic className="w-5 h-5 text-grey/60 group-hover:text-coral" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-grey group-hover:text-black">{item.title}</h4>
                    <p className="text-xs text-grey/50">{item.date}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-grey/30 group-hover:text-coral" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};