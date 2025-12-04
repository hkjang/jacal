import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { calendarAPI } from '../lib/calendarApi';
import { Event } from '../lib/api';

interface TimeAnalyticsProps {
  className?: string;
}

interface TimeBreakdown {
  type: string;
  label: string;
  icon: string;
  minutes: number;
  color: string;
}

const TimeAnalytics = ({ className }: TimeAnalyticsProps) => {
  const { t } = useTranslation();
  
  // Get events for current week
  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ['calendar-events'],
    queryFn: () => calendarAPI.getAllEvents(),
  });

  // Calculate time breakdown for current week
  const { breakdown, totalMinutes, focusPercentage } = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    // Filter events for this week
    const weekEvents = events.filter(event => {
      const eventDate = new Date(event.startAt);
      return eventDate >= startOfWeek && eventDate < endOfWeek;
    });

    // Calculate minutes by type
    const typeMinutes: Record<string, number> = {
      WORK: 0,
      MEETING: 0,
      PERSONAL: 0,
      APPOINTMENT: 0,
      OTHER: 0,
      FOCUS: 0,
    };

    weekEvents.forEach(event => {
      const start = new Date(event.startAt);
      const end = new Date(event.endAt);
      const duration = (end.getTime() - start.getTime()) / (1000 * 60);
      
      if ((event as any).isFocusTime) {
        typeMinutes.FOCUS += duration;
      } else {
        typeMinutes[event.eventType || 'OTHER'] += duration;
      }
    });

    const breakdown: TimeBreakdown[] = [
      { type: 'FOCUS', label: t('analytics.focus', '집중 시간'), icon: '🎯', minutes: typeMinutes.FOCUS, color: 'hsl(200, 85%, 55%)' },
      { type: 'MEETING', label: t('analytics.meeting', '회의'), icon: '👥', minutes: typeMinutes.MEETING, color: 'hsl(30, 90%, 56%)' },
      { type: 'WORK', label: t('analytics.work', '업무'), icon: '💼', minutes: typeMinutes.WORK, color: 'hsl(220, 90%, 56%)' },
      { type: 'PERSONAL', label: t('analytics.personal', '개인'), icon: '😊', minutes: typeMinutes.PERSONAL, color: 'hsl(150, 70%, 45%)' },
      { type: 'APPOINTMENT', label: t('analytics.appointment', '약속'), icon: '📅', minutes: typeMinutes.APPOINTMENT, color: 'hsl(280, 70%, 60%)' },
      { type: 'OTHER', label: t('analytics.other', '기타'), icon: '📌', minutes: typeMinutes.OTHER, color: 'hsl(0, 0%, 50%)' },
    ].filter(b => b.minutes > 0);

    const totalMinutes = breakdown.reduce((sum, b) => sum + b.minutes, 0);
    const focusPercentage = totalMinutes > 0 ? Math.round((typeMinutes.FOCUS / totalMinutes) * 100) : 0;

    return { breakdown, totalMinutes, focusPercentage };
  }, [events, t]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours === 0) return `${mins}분`;
    if (mins === 0) return `${hours}시간`;
    return `${hours}시간 ${mins}분`;
  };

  if (events.length === 0) {
    return null;
  }

  return (
    <div className={`time-analytics ${className || ''}`}>
      <div className="analytics-header">
        <h3>📊 {t('analytics.title', '이번 주 시간 분석')}</h3>
        <span className="analytics-total">
          {t('analytics.total', '총')}: {formatDuration(totalMinutes)}
        </span>
      </div>

      {breakdown.length > 0 ? (
        <>
          {/* Progress Bar */}
          <div className="analytics-bar">
            {breakdown.map((item, idx) => (
              <div
                key={item.type}
                className="bar-segment"
                style={{
                  width: `${(item.minutes / totalMinutes) * 100}%`,
                  backgroundColor: item.color,
                }}
                title={`${item.label}: ${formatDuration(item.minutes)}`}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="analytics-legend">
            {breakdown.map(item => (
              <div key={item.type} className="legend-item">
                <span className="legend-color" style={{ backgroundColor: item.color }} />
                <span className="legend-icon">{item.icon}</span>
                <span className="legend-label">{item.label}</span>
                <span className="legend-value">{formatDuration(item.minutes)}</span>
                <span className="legend-percent">
                  ({Math.round((item.minutes / totalMinutes) * 100)}%)
                </span>
              </div>
            ))}
          </div>

          {/* Focus Time Goal */}
          <div className="focus-goal">
            <div className="focus-goal-header">
              <span>🎯 {t('analytics.focusGoal', '집중 시간 비율')}</span>
              <span className={`focus-percent ${focusPercentage >= 40 ? 'good' : focusPercentage >= 20 ? 'ok' : 'low'}`}>
                {focusPercentage}%
              </span>
            </div>
            <div className="focus-goal-bar">
              <div 
                className="focus-goal-progress"
                style={{ width: `${Math.min(focusPercentage, 100)}%` }}
              />
              <div className="focus-goal-target" style={{ left: '40%' }} />
            </div>
            <p className="focus-goal-hint">
              {focusPercentage >= 40 
                ? t('analytics.focusGreat', '🎉 훌륭해요! 집중 시간이 충분합니다.')
                : focusPercentage >= 20
                ? t('analytics.focusOk', '👍 좋아요! 조금 더 집중 시간을 확보해보세요.')
                : t('analytics.focusLow', '💡 팁: 오전에 2-3시간의 집중 시간을 확보해보세요.')}
            </p>
          </div>
        </>
      ) : (
        <p className="analytics-empty">{t('analytics.empty', '이번 주 일정이 없습니다.')}</p>
      )}

      <style>{`
        .time-analytics {
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          padding: 1.25rem;
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--color-border);
        }

        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .analytics-header h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--color-text);
        }

        .analytics-total {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .analytics-bar {
          display: flex;
          height: 12px;
          border-radius: 6px;
          overflow: hidden;
          background: var(--color-bg);
          margin-bottom: 1rem;
        }

        .bar-segment {
          transition: width 0.3s ease;
        }

        .bar-segment:first-child {
          border-top-left-radius: 6px;
          border-bottom-left-radius: 6px;
        }

        .bar-segment:last-child {
          border-top-right-radius: 6px;
          border-bottom-right-radius: 6px;
        }

        .analytics-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
        }

        .legend-color {
          width: 10px;
          height: 10px;
          border-radius: 2px;
        }

        .legend-icon {
          font-size: 0.875rem;
        }

        .legend-label {
          color: var(--color-text);
        }

        .legend-value {
          font-weight: 500;
          color: var(--color-text);
        }

        .legend-percent {
          color: var(--color-text-secondary);
          font-size: 0.75rem;
        }

        .focus-goal {
          background: var(--color-bg);
          border-radius: var(--radius-md);
          padding: 1rem;
        }

        .focus-goal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .focus-percent {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .focus-percent.good { color: hsl(140, 70%, 45%); }
        .focus-percent.ok { color: hsl(40, 90%, 50%); }
        .focus-percent.low { color: hsl(0, 70%, 50%); }

        .focus-goal-bar {
          height: 8px;
          background: var(--color-border);
          border-radius: 4px;
          overflow: visible;
          position: relative;
          margin-bottom: 0.5rem;
        }

        .focus-goal-progress {
          height: 100%;
          background: linear-gradient(90deg, hsl(200, 85%, 55%), hsl(200, 85%, 45%));
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .focus-goal-target {
          position: absolute;
          top: -4px;
          width: 2px;
          height: 16px;
          background: var(--color-text);
          opacity: 0.5;
        }

        .focus-goal-hint {
          margin: 0;
          font-size: 0.8125rem;
          color: var(--color-text-secondary);
        }

        .analytics-empty {
          text-align: center;
          color: var(--color-text-secondary);
          padding: 1rem;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default TimeAnalytics;
