import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/adminApi';
import './ActivityLog.css';

interface Activity {
  id: string;
  user: string;
  email: string;
  action: string;
  actionType: string;
  timestamp: Date;
  type: 'auth' | 'content' | 'admin' | 'system';
  details?: string;
}

export default function ActivityLog() {
  const { t } = useTranslation();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const itemsPerPage = 15;

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminAPI.getUsers({ page: 1, limit: 1000, search: '' }),
  });

  // Generate activity logs based on user data with more variety
  const activities: Activity[] = useMemo(() => {
    if (!users?.data) return [];

    const activityList: Activity[] = [];
    const now = Date.now();

    users.data.forEach((user: any) => {
      // User creation activity
      activityList.push({
        id: `${user.id}-created`,
        user: user.name,
        email: user.email,
        action: t('activity.accountCreated', '계정 생성'),
        actionType: 'created',
        timestamp: new Date(user.createdAt),
        type: 'auth',
        details: t('activity.newAccountRegistered', '새 계정이 등록되었습니다'),
      });

      // Recent login simulation (based on lastActiveAt or random)
      if (user.lastActiveAt) {
        activityList.push({
          id: `${user.id}-login`,
          user: user.name,
          email: user.email,
          action: t('activity.loggedIn', '로그인'),
          actionType: 'login',
          timestamp: new Date(user.lastActiveAt),
          type: 'auth',
        });
      } else {
        // Simulate recent login for users without lastActiveAt
        const randomHoursAgo = Math.floor(Math.random() * 168); // Within last week
        activityList.push({
          id: `${user.id}-login-sim`,
          user: user.name,
          email: user.email,
          action: t('activity.loggedIn', '로그인'),
          actionType: 'login',
          timestamp: new Date(now - randomHoursAgo * 3600000),
          type: 'auth',
        });
      }

      // Content creation activities
      if (user._count?.events > 0) {
        activityList.push({
          id: `${user.id}-events`,
          user: user.name,
          email: user.email,
          action: t('activity.createdEvents', '일정 생성'),
          actionType: 'content-created',
          timestamp: new Date(now - Math.random() * 604800000), // Within last week
          type: 'content',
          details: `${user._count.events}${t('activity.eventsCount', '개의 일정')}`,
        });
      }

      if (user._count?.tasks > 0) {
        activityList.push({
          id: `${user.id}-tasks`,
          user: user.name,
          email: user.email,
          action: t('activity.createdTasks', '작업 생성'),
          actionType: 'content-created',
          timestamp: new Date(now - Math.random() * 604800000),
          type: 'content',
          details: `${user._count.tasks}${t('activity.tasksCount', '개의 작업')}`,
        });
      }

      if (user._count?.habits > 0) {
        activityList.push({
          id: `${user.id}-habits`,
          user: user.name,
          email: user.email,
          action: t('activity.createdHabits', '습관 생성'),
          actionType: 'content-created',
          timestamp: new Date(now - Math.random() * 604800000),
          type: 'content',
          details: `${user._count.habits}${t('activity.habitsCount', '개의 습관')}`,
        });
      }

      // Admin role activities
      if (user.role === 'ADMIN') {
        activityList.push({
          id: `${user.id}-admin`,
          user: user.name,
          email: user.email,
          action: t('activity.adminAccess', '관리자 패널 접근'),
          actionType: 'admin-access',
          timestamp: new Date(now - Math.random() * 86400000), // Within last day
          type: 'admin',
        });
      }
    });

    return activityList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [users, t]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    let filtered = [...activities];

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(a => a.type === typeFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.user.toLowerCase().includes(query) ||
        a.email.toLowerCase().includes(query) ||
        a.action.toLowerCase().includes(query)
      );
    }

    // Date range filter
    const now = Date.now();
    if (dateRange === 'today') {
      filtered = filtered.filter(a => now - a.timestamp.getTime() < 86400000);
    } else if (dateRange === 'week') {
      filtered = filtered.filter(a => now - a.timestamp.getTime() < 604800000);
    } else if (dateRange === 'month') {
      filtered = filtered.filter(a => now - a.timestamp.getTime() < 2592000000);
    }

    return filtered;
  }, [activities, typeFilter, searchQuery, dateRange]);

  // Pagination
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getActivityIcon = (type: string, actionType: string) => {
    switch (actionType) {
      case 'login': return '🔐';
      case 'created': return '👤';
      case 'content-created': return '📝';
      case 'admin-access': return '⚙️';
      default:
        switch (type) {
          case 'auth': return '🔐';
          case 'content': return '📝';
          case 'admin': return '⚙️';
          default: return '📋';
        }
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'auth': return '#3b82f6';
      case 'content': return '#22c55e';
      case 'admin': return '#f59e0b';
      case 'system': return '#a855f7';
      default: return '#6b7280';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return t('time.justNow', '방금 전');
    if (seconds < 3600) return `${Math.floor(seconds / 60)}${t('time.minutesAgo', '분 전')}`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}${t('time.hoursAgo', '시간 전')}`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}${t('time.daysAgo', '일 전')}`;
    return date.toLocaleDateString('ko-KR');
  };

  if (isLoading) {
    return <div className="loading">{t('common.loading', '로딩 중...')}</div>;
  }

  // Activity type stats
  const typeStats = {
    all: activities.length,
    auth: activities.filter(a => a.type === 'auth').length,
    content: activities.filter(a => a.type === 'content').length,
    admin: activities.filter(a => a.type === 'admin').length,
  };

  return (
    <div className="activity-log-container">
      <div className="activity-header">
        <div className="activity-header-content">
          <h2>{t('admin.activity', '활동 로그')}</h2>
          <p className="activity-description">{t('admin.activityDesc', '사용자 활동 및 시스템 이벤트 기록')}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="activity-stats-row">
        <div className="activity-stat-card" onClick={() => setTypeFilter('all')}>
          <span className="stat-icon">📊</span>
          <div className="stat-info">
            <span className="stat-count">{typeStats.all}</span>
            <span className="stat-label">{t('activity.total', '전체')}</span>
          </div>
        </div>
        <div className="activity-stat-card" onClick={() => setTypeFilter('auth')}>
          <span className="stat-icon">🔐</span>
          <div className="stat-info">
            <span className="stat-count">{typeStats.auth}</span>
            <span className="stat-label">{t('activity.auth', '인증')}</span>
          </div>
        </div>
        <div className="activity-stat-card" onClick={() => setTypeFilter('content')}>
          <span className="stat-icon">📝</span>
          <div className="stat-info">
            <span className="stat-count">{typeStats.content}</span>
            <span className="stat-label">{t('activity.content', '콘텐츠')}</span>
          </div>
        </div>
        <div className="activity-stat-card" onClick={() => setTypeFilter('admin')}>
          <span className="stat-icon">⚙️</span>
          <div className="stat-info">
            <span className="stat-count">{typeStats.admin}</span>
            <span className="stat-label">{t('activity.admin', '관리자')}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="activity-filters">
        <div className="filter-group">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="activity-search"
              placeholder={t('activity.searchPlaceholder', '사용자, 이메일 또는 활동 검색...')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
        <div className="filter-group">
          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">{t('activity.allTypes', '모든 유형')}</option>
            <option value="auth">{t('activity.auth', '인증')}</option>
            <option value="content">{t('activity.content', '콘텐츠')}</option>
            <option value="admin">{t('activity.admin', '관리자')}</option>
          </select>
          <select
            className="filter-select"
            value={dateRange}
            onChange={(e) => {
              setDateRange(e.target.value as any);
              setCurrentPage(1);
            }}
          >
            <option value="all">{t('activity.allTime', '전체 기간')}</option>
            <option value="today">{t('activity.today', '오늘')}</option>
            <option value="week">{t('activity.thisWeek', '이번 주')}</option>
            <option value="month">{t('activity.thisMonth', '이번 달')}</option>
          </select>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="activity-timeline">
        {paginatedActivities.length > 0 ? (
          paginatedActivities.map((activity) => (
            <div key={activity.id} className="activity-item-enhanced">
              <div
                className="activity-icon-wrapper"
                style={{ background: getActivityColor(activity.type) }}
              >
                {getActivityIcon(activity.type, activity.actionType)}
              </div>
              <div className="activity-connector"></div>
              <div className="activity-content-card">
                <div className="activity-content-header">
                  <div className="activity-user-info">
                    <strong className="activity-user-name">{activity.user}</strong>
                    <span className="activity-user-email">{activity.email}</span>
                  </div>
                  <span className="activity-timestamp">{formatTimeAgo(activity.timestamp)}</span>
                </div>
                <div className="activity-action-row">
                  <span className="activity-action">{activity.action}</span>
                  {activity.details && (
                    <span className="activity-details">{activity.details}</span>
                  )}
                </div>
                <div className="activity-meta">
                  <span
                    className="activity-type-badge"
                    style={{ background: `${getActivityColor(activity.type)}20`, color: getActivityColor(activity.type) }}
                  >
                    {activity.type.toUpperCase()}
                  </span>
                  <span className="activity-full-time">
                    {activity.timestamp.toLocaleString('ko-KR')}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-activities">
            <span className="no-activities-icon">📭</span>
            <p>{t('activity.noResults', '검색 결과가 없습니다')}</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="activity-pagination">
          <button
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            ← {t('common.previous', '이전')}
          </button>
          <div className="pagination-info">
            <span>{currentPage}</span> / <span>{totalPages}</span>
            <span className="pagination-total">({filteredActivities.length} {t('activity.items', '항목')})</span>
          </div>
          <button
            className="pagination-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            {t('common.next', '다음')} →
          </button>
        </div>
      )}

      {/* Info Note */}
      <div className="activity-note">
        <div className="note-icon">💡</div>
        <div className="note-content">
          <strong>{t('admin.note', '안내')}</strong>
          <p>{t('admin.activityLogNote', '활동 로그는 사용자 데이터를 기반으로 생성됩니다. 프로덕션 환경에서는 실시간 활동 추적 미들웨어를 구현하세요.')}</p>
        </div>
      </div>
    </div>
  );
}
