import prisma from '../src/lib/prisma';
import bcrypt from 'bcrypt';

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // Clear existing data (optional - be careful in production!)
  console.log('🧹 Cleaning existing data...');
  await prisma.comment.deleteMany();
  await prisma.sharedEvent.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.habitLog.deleteMany();
  await prisma.habit.deleteMany();
  await prisma.processedEmail.deleteMany();
  await prisma.webhookConfig.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.analytics.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.recurringRule.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.event.deleteMany();
  await prisma.task.deleteMany();
  await prisma.connectedAccount.deleteMany();
  await prisma.backupRecord.deleteMany();
  await prisma.emailSettings.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.webhook.deleteMany();
  await prisma.appSettings.deleteMany();
  await prisma.user.deleteMany();

  // Create Admin User
  console.log('👤 Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@jacal.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      isAdmin: true,
      role: 'ADMIN',
      timezone: 'Asia/Seoul',
    },
  });
  console.log(`✅ Admin: ${admin.email} / admin123`);

  // Create Regular Users
  console.log('\n👥 Creating regular users...');
  const userPassword = await bcrypt.hash('user123', 10);
  
  const user1 = await prisma.user.create({
    data: {
      email: 'kim@jacal.com',
      name: '김민수',
      passwordHash: userPassword,
      timezone: 'Asia/Seoul',
    },
  });
  console.log(`✅ User: ${user1.email} / user123`);

  const user2 = await prisma.user.create({
    data: {
      email: 'lee@jacal.com',
      name: '이지은',
      passwordHash: userPassword,
      timezone: 'Asia/Seoul',
    },
  });
  console.log(`✅ User: ${user2.email} / user123`);

  const user3 = await prisma.user.create({
    data: {
      email: 'park@jacal.com',
      name: '박준호',
      passwordHash: userPassword,
      timezone: 'Asia/Seoul',
    },
  });
  console.log(`✅ User: ${user3.email} / user123`);

  // Create Tags
  console.log('\n🏷️  Creating tags...');
  const workTag = await prisma.tag.create({
    data: { userId: user1.id, name: '업무', color: '#3B82F6' },
  });
  const personalTag = await prisma.tag.create({
    data: { userId: user1.id, name: '개인', color: '#10B981' },
  });
  const urgentTag = await prisma.tag.create({
    data: { userId: user1.id, name: '긴급', color: '#EF4444' },
  });
  console.log(`✅ Created ${3} tags`);

  // Create Tasks with various states
  console.log('\n✅ Creating tasks...');
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        userId: user1.id,
        title: '프로젝트 제안서 작성',
        description: 'Q4 신규 프로젝트 제안서 작성 및 검토',
        dueAt: tomorrow,
        estimatedMinutes: 120,
        priority: 3,
        status: 'in_progress',
        tags: { connect: [{ id: workTag.id }, { id: urgentTag.id }] },
      },
    }),
    prisma.task.create({
      data: {
        userId: user1.id,
        title: '회의록 정리',
        description: '주간 팀 미팅 회의록 정리 및 공유',
        dueAt: now,
        estimatedMinutes: 30,
        priority: 2,
        status: 'pending',
        tags: { connect: [{ id: workTag.id }] },
      },
    }),
    prisma.task.create({
      data: {
        userId: user1.id,
        title: '운동하기',
        description: '헬스장 가서 1시간 운동',
        dueAt: now,
        estimatedMinutes: 60,
        priority: 1,
        status: 'pending',
        tags: { connect: [{ id: personalTag.id }] },
      },
    }),
    prisma.task.create({
      data: {
        userId: user1.id,
        title: '코드 리뷰 완료',
        description: 'PR #123 코드 리뷰 및 피드백',
        dueAt: yesterday,
        estimatedMinutes: 45,
        priority: 2,
        status: 'completed',
        tags: { connect: [{ id: workTag.id }] },
      },
    }),
    prisma.task.create({
      data: {
        userId: user1.id,
        title: '테스트 코드 작성',
        description: 'API 엔드포인트 테스트 코드 작성',
        dueAt: nextWeek,
        estimatedMinutes: 180,
        priority: 2,
        status: 'pending',
        tags: { connect: [{ id: workTag.id }] },
      },
    }),
    prisma.task.create({
      data: {
        userId: user2.id,
        title: '보고서 제출',
        description: '월간 실적 보고서 제출',
        dueAt: tomorrow,
        estimatedMinutes: 90,
        priority: 3,
        status: 'in_progress',
      },
    }),
  ]);
  console.log(`✅ Created ${tasks.length} tasks`);

  // Create Reminders for tasks
  console.log('\n🔔 Creating reminders...');
  await Promise.all([
    prisma.reminder.create({
      data: {
        entityType: 'task',
        entityId: tasks[0].id,
        notifyAt: new Date(tomorrow.getTime() - 60 * 60 * 1000), // 1 hour before
        channel: 'push',
        sent: false,
      },
    }),
    prisma.reminder.create({
      data: {
        entityType: 'task',
        entityId: tasks[1].id,
        notifyAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 min before
        channel: 'email',
        sent: false,
      },
    }),
  ]);
  console.log(`✅ Created ${2} task reminders`);

  // Create Events with different types
  console.log('\n📅 Creating events...');
  const events = await Promise.all([
    prisma.event.create({
      data: {
        userId: user1.id,
        title: '팀 스탠드업 미팅',
        description: '일일 스탠드업 미팅',
        startAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0),
        endAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 30),
        location: '회의실 A',
        eventType: 'MEETING',
        sourceCalendar: 'manual',
        tags: { connect: [{ id: workTag.id }] },
      },
    }),
    prisma.event.create({
      data: {
        userId: user1.id,
        title: '클라이언트 미팅',
        description: '신규 프로젝트 논의',
        startAt: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 14, 0),
        endAt: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 15, 30),
        location: '온라인 (Zoom)',
        eventType: 'WORK',
        sourceCalendar: 'manual',
        tags: { connect: [{ id: workTag.id }, { id: urgentTag.id }] },
      },
    }),
    prisma.event.create({
      data: {
        userId: user1.id,
        title: '점심 약속',
        description: '친구와 점심',
        startAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0),
        endAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0),
        location: '강남역 근처 레스토랑',
        eventType: 'PERSONAL',
        sourceCalendar: 'manual',
        tags: { connect: [{ id: personalTag.id }] },
      },
    }),
    prisma.event.create({
      data: {
        userId: user1.id,
        title: '치과 예약',
        description: '정기 검진',
        startAt: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 15, 0),
        endAt: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 16, 0),
        location: '강남 치과',
        eventType: 'APPOINTMENT',
        sourceCalendar: 'manual',
      },
    }),
    prisma.event.create({
      data: {
        userId: user2.id,
        title: '프로젝트 킥오프',
        description: '신규 프로젝트 킥오프 미팅',
        startAt: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 9, 0),
        endAt: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 11, 0),
        location: '본사 대회의실',
        eventType: 'MEETING',
        sourceCalendar: 'manual',
      },
    }),
  ]);
  console.log(`✅ Created ${events.length} events with different types`);

  // Create Event Reminder
  await prisma.reminder.create({
    data: {
      entityType: 'event',
      entityId: events[1].id,
      notifyAt: new Date(events[1].startAt.getTime() - 30 * 60 * 1000), // 30 min before
      channel: 'push',
      sent: false,
    },
  });
  console.log(`✅ Created event reminder`);

  // Create Habits
  console.log('\n💪 Creating habits...');
  const habit1 = await prisma.habit.create({
    data: {
      userId: user1.id,
      title: '아침 운동',
      description: '매일 아침 30분 조깅',
      frequency: 'daily',
      targetDays: 7,
      color: '#F59E0B',
      icon: '🏃',
    },
  });

  const habit2 = await prisma.habit.create({
    data: {
      userId: user1.id,
      title: '독서',
      description: '하루 30분 독서',
      frequency: 'daily',
      targetDays: 5,
      color: '#8B5CF6',
      icon: '📚',
    },
  });

  const habit3 = await prisma.habit.create({
    data: {
      userId: user1.id,
      title: '물 마시기',
      description: '하루 8잔 물 마시기',
      frequency: 'daily',
      targetDays: 7,
      color: '#06B6D4',
      icon: '💧',
    },
  });
  console.log(`✅ Created ${3} habits`);

  // Create Habit Logs (completion records)
  console.log('\n📊 Creating habit logs...');
  const habitLogs = [];
  for (let i = 0; i < 7; i++) {
    const logDate = new Date(now);
    logDate.setDate(logDate.getDate() - i);
    
    // Morning exercise - completed 5 out of 7 days
    if (i !== 2 && i !== 5) {
      habitLogs.push(
        prisma.habitLog.create({
          data: {
            habitId: habit1.id,
            userId: user1.id,
            completedAt: logDate,
            note: i === 0 ? '좋은 컨디션!' : undefined,
          },
        })
      );
    }

    // Reading - completed 4 out of 7 days
    if (i < 4 && i !== 1) {
      habitLogs.push(
        prisma.habitLog.create({
          data: {
            habitId: habit2.id,
            userId: user1.id,
            completedAt: logDate,
          },
        })
      );
    }

    // Water - completed all 7 days
    habitLogs.push(
      prisma.habitLog.create({
        data: {
          habitId: habit3.id,
          userId: user1.id,
          completedAt: logDate,
        },
      })
    );
  }
  await Promise.all(habitLogs);
  console.log(`✅ Created ${habitLogs.length} habit logs`);

  // Create Analytics Data
  console.log('\n📈 Creating analytics data...');
  const analyticsData = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    analyticsData.push(
      prisma.analytics.create({
        data: {
          userId: user1.id,
          date: date,
          focusMinutes: Math.floor(Math.random() * 300) + 60,
          meetingMinutes: Math.floor(Math.random() * 180) + 30,
          tasksCompleted: Math.floor(Math.random() * 8) + 1,
          tasksPlanned: Math.floor(Math.random() * 12) + 3,
          eventsAttended: Math.floor(Math.random() * 5) + 1,
          productivityScore: Math.random() * 40 + 60, // 60-100
        },
      })
    );
  }
  await Promise.all(analyticsData);
  console.log(`✅ Created ${analyticsData.length} days of analytics data`);

  // Create User Settings with saved locations
  console.log('\n⚙️  Creating user settings...');
  await prisma.userSettings.create({
    data: {
      userId: user1.id,
      ollamaEnabled: true,
      ollamaBaseUrl: 'http://localhost:11434',
      ollamaModel: 'llama2',
      pop3Enabled: false,
      savedLocations: ['회의실 A', '회의실 B', '본사 대회의실', '온라인 (Zoom)', '강남역 근처 레스토랑', '홈오피스'],
    },
  });
  console.log(`✅ Created user settings for ${user1.email} with saved locations`);

  // Create Webhook Config
  console.log('\n🔗 Creating webhook config...');
  await prisma.webhookConfig.create({
    data: {
      userId: user1.id,
      enabled: false,
      url: 'https://example.com/webhook',
      columnMapping: {
        title: 'task_name',
        description: 'task_description',
        dueAt: 'due_date',
      },
    },
  });
  console.log(`✅ Created webhook config`);

  // Create Team
  console.log('\n👥 Creating teams...');
  const team1 = await prisma.team.create({
    data: {
      name: '개발팀',
      description: '제품 개발 팀',
    },
  });

  const team2 = await prisma.team.create({
    data: {
      name: '마케팅팀',
      description: '마케팅 및 홍보 팀',
    },
  });

  const team3 = await prisma.team.create({
    data: {
      name: 'Engineering',
      description: 'The core engineering team',
    },
  });
  console.log(`✅ Created ${3} teams`);

  // Create Team Members
  console.log('\n👤 Creating team members...');
  await Promise.all([
    prisma.teamMember.create({
      data: { teamId: team1.id, userId: user1.id, role: 'OWNER' },
    }),
    prisma.teamMember.create({
      data: { teamId: team1.id, userId: user2.id, role: 'MEMBER' },
    }),
    prisma.teamMember.create({
      data: { teamId: team2.id, userId: user3.id, role: 'OWNER' },
    }),
    prisma.teamMember.create({
      data: { teamId: team2.id, userId: user2.id, role: 'ADMIN' },
    }),
    prisma.teamMember.create({
      data: { teamId: team3.id, userId: user1.id, role: 'OWNER' },
    }),
    prisma.teamMember.create({
      data: { teamId: team3.id, userId: user3.id, role: 'MEMBER' },
    }),
  ]);
  console.log(`✅ Created team members`);

  // Create Shared Events
  console.log('\n📅 Creating shared team events...');
  const sharedEvent1 = await prisma.sharedEvent.create({
    data: {
      teamId: team1.id,
      authorId: user1.id,
      title: '스프린트 계획 미팅',
      description: '다음 2주 스프린트 계획',
      startAt: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 10, 0),
      endAt: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 12, 0),
      location: '회의실 B',
    },
  });

  const sharedEvent2 = await prisma.sharedEvent.create({
    data: {
      teamId: team1.id,
      authorId: user1.id,
      title: '코드 리뷰 세션',
      description: '주간 코드 리뷰',
      startAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0),
      endAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 0),
      location: '온라인',
    },
  });

  const sharedEvent3 = await prisma.sharedEvent.create({
    data: {
      teamId: team3.id,
      authorId: user1.id,
      title: 'Tech Talk',
      description: 'Monthly tech sharing session',
      startAt: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 14, 0),
      endAt: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 15, 30),
      location: 'Conference Room A',
    },
  });
  console.log(`✅ Created ${3} shared events`);

  // Create Comments
  console.log('\n💬 Creating comments...');
  await Promise.all([
    prisma.comment.create({
      data: {
        sharedEventId: sharedEvent1.id,
        userId: user2.id,
        content: '이번 스프린트 목표를 명확히 하면 좋겠어요!',
      },
    }),
    prisma.comment.create({
      data: {
        sharedEventId: sharedEvent1.id,
        userId: user1.id,
        content: '좋은 의견입니다. 회의에서 자세히 논의하겠습니다.',
      },
    }),
  ]);
  console.log(`✅ Created comments`);

  // Create App Settings
  console.log('\n⚙️  Creating app settings...');
  await prisma.appSettings.create({
    data: {
      siteName: 'Jacal',
      siteUrl: 'http://localhost:5173',
      defaultLanguage: 'ko',
      timezone: 'Asia/Seoul',
      allowRegistration: true,
      requireEmailVerification: false,
      maxUploadSizeMB: 10,
    },
  });
  console.log(`✅ Created app settings`);

  // Create Admin Webhooks
  console.log('\n🪝 Creating admin webhooks...');
  await prisma.webhook.create({
    data: {
      name: 'Slack 알림',
      url: 'https://hooks.slack.com/services/xxx',
      events: ['task.created', 'task.completed', 'event.created'],
      active: false,
    },
  });
  console.log(`✅ Created admin webhooks`);

  // Create Integrations
  console.log('\n🔌 Creating integrations...');
  await Promise.all([
    prisma.integration.create({
      data: {
        name: 'Google Calendar',
        type: 'calendar',
        config: { syncInterval: 15 },
        active: false,
      },
    }),
    prisma.integration.create({
      data: {
        name: 'Slack',
        type: 'messaging',
        config: { webhookUrl: 'https://hooks.slack.com/xxx' },
        active: false,
      },
    }),
  ]);
  console.log(`✅ Created integrations`);

  console.log('\n✨ Database seeding completed!\n');
  console.log('📝 Login credentials:');
  console.log('   Admin: admin@jacal.com / admin123');
  console.log('   User 1: kim@jacal.com / user123');
  console.log('   User 2: lee@jacal.com / user123');
  console.log('   User 3: park@jacal.com / user123\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
