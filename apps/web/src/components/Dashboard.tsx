import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../lib/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0'];

export default function Dashboard() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const { data: dashboardData } = useQuery({
    queryKey: ['analytics', 'dashboard', period],
    queryFn: async () => {
      return analyticsAPI.getDashboard(period);
    },
  });

  const { data: habitStats } = useQuery({
    queryKey: ['analytics', 'habits', period],
    queryFn: async () => {
      return analyticsAPI.getHabitStats(period);
    },
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const dailyData = dashboardData?.daily?.map((d: any) => ({
    date: formatDate(d.date),
    focus: d.focusMinutes,
    meeting: d.meetingMinutes,
    tasks: d.tasksCompleted,
    score: d.productivityScore,
  })) || [];

  const timeDistribution = [
    { name: t('dashboard.focus', '집중 시간'), value: dashboardData?.summary?.totalFocusMinutes || 0 },
    { name: t('dashboard.meeting', '회의 시간'), value: dashboardData?.summary?.totalMeetingMinutes || 0 },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>{t('dashboard.title', '생산성 대시보드')}</h1>
        <div className="period-selector">
          <button
            onClick={() => setPeriod('week')}
            className={`btn ${period === 'week' ? 'btn-primary' : 'btn-secondary'}`}
          >
            {t('dashboard.week', '주간')}
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`btn ${period === 'month' ? 'btn-primary' : 'btn-secondary'}`}
          >
            {t('dashboard.month', '월간')}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <h3>{t('dashboard.productivity', '생산성 점수')}</h3>
          <p className="summary-value">{dashboardData?.summary?.avgProductivityScore?.toFixed(1) || 0}</p>
          <span className="summary-label">/ 100</span>
        </div>
        <div className="summary-card">
          <h3>{t('dashboard.tasksCompleted', '완료한 작업')}</h3>
          <p className="summary-value">{dashboardData?.summary?.totalTasksCompleted || 0}</p>
          <span className="summary-label">
            / {dashboardData?.summary?.totalTasksPlanned || 0} {t('dashboard.planned', '계획')}
          </span>
        </div>
        <div className="summary-card">
          <h3>{t('dashboard.focusTime', '집중 시간')}</h3>
          <p className="summary-value">{Math.round((dashboardData?.summary?.totalFocusMinutes || 0) / 60)}</p>
          <span className="summary-label">{t('dashboard.hours', '시간')}</span>
        </div>
        <div className="summary-card">
          <h3>{t('dashboard.completionRate', '완료율')}</h3>
          <p className="summary-value">{dashboardData?.summary?.completionRate?.toFixed(0) || 0}%</p>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Productivity Trend */}
        <div className="chart-card">
          <h3>{t('dashboard.productivityTrend', '생산성 추이')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="score" stroke="#4CAF50" name={t('dashboard.score', '점수')} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Time Distribution */}
        <div className="chart-card">
          <h3>{t('dashboard.timeDistribution', '시간 분배')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={timeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}분`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {timeDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Tasks */}
        <div className="chart-card">
          <h3>{t('dashboard.dailyTasks', '일일 작업 완료')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="tasks" fill="#2196F3" name={t('dashboard.completed', '완료')} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Focus vs Meeting Time */}
        <div className="chart-card">
          <h3>{t('dashboard.timeComparison', '집중 vs 회의 시간')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="focus" fill="#4CAF50" name={t('dashboard.focus', '집중')} />
              <Bar dataKey="meeting" fill="#FF9800" name={t('dashboard.meeting', '회의')} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Habit Statistics */}
      {habitStats && habitStats.length > 0 && (
        <div className="habit-analytics">
          <h2>{t('dashboard.habitStats', '습관 통계')}</h2>
          <div className="habit-stats-grid">
            {habitStats.map((habit: any) => (
              <div key={habit.id} className="habit-stat-card" style={{ borderLeft: `4px solid ${habit.color}` }}>
                <h4>{habit.title}</h4>
                <div className="habit-stat-value">{habit.completionRate.toFixed(0)}%</div>
                <p className="habit-stat-label">
                  {habit.totalLogs} / {period === 'week' ? 7 : 30} {t('dashboard.days', '일')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .dashboard {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .period-selector {
          display: flex;
          gap: 0.5rem;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .summary-card {
          background: var(--bg-secondary);
          padding: 1.5rem;
          border-radius: 12px;
          text-align: center;
        }

        .summary-card h3 {
          margin: 0 0 1rem 0;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .summary-value {
          font-size: 2.5rem;
          font-weight: bold;
          margin: 0;
          color: var(--primary);
        }

        .summary-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .chart-card {
          background: var(--bg-secondary);
          padding: 1.5rem;
          border-radius: 12px;
        }

        .chart-card h3 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
        }

        .habit-analytics {
          margin-top: 2rem;
        }

        .habit-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .habit-stat-card {
          background: var(--bg-secondary);
          padding: 1rem;
          border-radius: 8px;
        }

        .habit-stat-card h4 {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
        }

        .habit-stat-value {
          font-size: 2rem;
          font-weight: bold;
          color: var(--primary);
        }

        .habit-stat-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin: 0.25rem 0 0 0;
        }
      `}</style>
    </div>
  );
}
