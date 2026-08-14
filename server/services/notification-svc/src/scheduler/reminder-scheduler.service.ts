import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task } from '@shared/entities/src/task.entity';
import { NotificationReminderLogEntity } from '@shared/entities/src/notification-reminder-log.entity';
import { CompanyNotificationPreferenceEntity } from '@shared/entities/src/company-notification-preference.entity';
import { User } from '@shared/entities/src/user.entity';
import { OrchestratorService } from '../orchestrator/orchestrator.service';

@Injectable()
export class ReminderSchedulerService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(ReminderSchedulerService.name);
  private timer: NodeJS.Timeout | null = null;
  private readonly intervals = [1440, 60, 15]; // in minutes

  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(NotificationReminderLogEntity)
    private readonly reminderLogRepo: Repository<NotificationReminderLogEntity>,
    @InjectRepository(CompanyNotificationPreferenceEntity)
    private readonly companyPrefRepo: Repository<CompanyNotificationPreferenceEntity>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly orchestratorService: OrchestratorService,
  ) { }

  onApplicationBootstrap() {
    this.logger.log('Starting task reminder scheduler...');
    // Run immediately on boot, then every 5 minutes
    this.checkReminders().catch((err) => this.logger.error('Error checking reminders on bootstrap:', err));
    this.timer = setInterval(() => {
      this.checkReminders().catch((err) => this.logger.error('Error checking reminders:', err));
    }, 5 * 60 * 1000); // 5 minutes
  }

  onApplicationShutdown() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async checkReminders() {
    this.logger.debug('Running task reminder check...');
    const now = new Date();

    // Query pending/assigned tasks
    const tasks = await this.taskRepo.find({
      where: {
        status: In(['Pending', 'Assigned']),
      },
      relations: [
        'property',
        'unit',
        'assigned_to',
        'assigned_to_team',
        'assigned_to_team.team_leader',
      ],
    });

    this.logger.debug(`Found ${tasks.length} pending/assigned tasks to evaluate.`);

    for (const task of tasks) {
      if (!task.due_at) {
        continue;
      }

      // Check if we should notify managers/admins of the organization
      const companyPrefs = await this.companyPrefRepo.findOne({
        where: { organizationId: task.organization_id },
      });

      if (!companyPrefs || !companyPrefs?.settings?.intervals) {
        this.logger.warn(`Reminder setup is not done for organizationId  ${task.organization_id}`);
      }

      const dueAtTime = new Date(task.due_at).getTime();
      const diffMs = dueAtTime - now.getTime();
      const diffMinutes = Math.round(diffMs / (60 * 1000));

      // 1. Check upcoming reminders
      if (companyPrefs && companyPrefs?.settings?.intervals) {
        for (const interval of companyPrefs?.settings?.intervals) {
          if (diffMinutes > 0 && diffMinutes <= interval && diffMinutes > interval - 5) {
            const eventType = `task.upcoming.${interval === 1440 ? '24h' : interval === 60 ? '1h' : '15m'}`;
            await this.processReminder(task, eventType);
          }
        }
      }


      // 2. Check overdue reminders
      if (diffMinutes < 0 && diffMinutes >= -5) {
        await this.processReminder(task, 'task.overdue');
      }
    }
  }

  private async processReminder(task: Task, eventType: string) {
    const recipients: Array<{ userId: string; email?: string; phone?: string; role?: string }> = [];

    // Always notify the executor (assigned user)
    if (task.assigned_to_id && task.assigned_to) {
      recipients.push({
        userId: task.assigned_to.id!,
        email: task.assigned_to.email,
        phone: task.assigned_to.phone,
        role: task.assigned_to.role,
      });
    }

    // Notify the team leader if assigned_to_team_id is present
    if (task.assigned_to_team_id && task.assigned_to_team?.team_leader) {
      const leader = task.assigned_to_team.team_leader;
      if (leader.id && !recipients.some(r => r.userId === leader.id)) {
        recipients.push({
          userId: leader.id,
          email: leader.email,
          phone: leader.phone,
          role: leader.role,
        });
      }
    }

    // Check if we should notify managers/admins of the organization
    const companyPrefs = await this.companyPrefRepo.findOne({
      where: { organizationId: task.organization_id },
    });

    if (companyPrefs?.settings?.notifyManagerForUpcomingTask) {
      const managers = await this.userRepo.find({
        where: {
          organization_id: task.organization_id,
          role: In(['manager', 'admin', 'super_admin']),
        },
      });

      for (const manager of managers) {
        if (manager.id && !recipients.some(r => r.userId === manager.id)) {
          recipients.push({
            userId: manager.id,
            email: manager.email,
            phone: manager.phone,
            role: manager.role,
          });
        }
      }
    }

    // Send reminders to resolved recipients
    for (const recipient of recipients) {
      // Duplicate check: did we already send this reminder?
      const log = await this.reminderLogRepo.findOne({
        where: {
          taskId: task.id,
          eventType,
          recipientId: recipient.userId,
        },
      });

      if (log) {
        continue;
      }

      this.logger.log(`Dispatching task reminder event ${eventType} for Task ${task.id} to Recipient ${recipient.userId}`);

      try {
        await this.orchestratorService.orchestrate({
          eventType,
          organizationId: task.organization_id,
          sourceService: 'reminder-scheduler',
          entityId: task.id,
          recipients: [recipient],
          title: eventType === 'task.overdue' ? 'Task Overdue Alert' : 'Upcoming Task Reminder',
          body: eventType === 'task.overdue'
            ? `Task "${task.task_title}" is overdue.`
            : `Task "${task.task_title}" is scheduled to start soon.`,
          payload: {
            taskName: task.task_title,
            propertyName: task.property?.property_name || 'Property',
            scheduledTime: task.due_at ? new Date(task.due_at).toLocaleString() : '',
          },
        });

        // Insert log record to prevent duplication
        await this.reminderLogRepo.save(
          this.reminderLogRepo.create({
            taskId: task.id,
            eventType,
            recipientId: recipient.userId,
            sentAt: new Date(),
          }),
        );
      } catch (err: any) {
        this.logger.error(`Error sending task reminder for task ${task.id} to user ${recipient.userId}:`, err);
      }
    }
  }
}
