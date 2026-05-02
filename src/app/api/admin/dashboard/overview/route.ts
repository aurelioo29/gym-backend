import { Op } from "sequelize";

import {
  ActivityLog,
  AuditLog,
  Booking,
  MemberMembership,
  MembershipPlan,
  News,
  Notification,
  Role,
  Service,
  ServiceSchedule,
  TrainerAssignment,
  TrainerProfile,
  User,
} from "@/database/models";
import { getAdminSession } from "@/lib/auth/admin-guard";
import { errorResponse, successResponse } from "@/lib/response";

function getLast7Days() {
  const days: {
    key: string;
    label: string;
    start: Date;
    end: Date;
  }[] = [];

  for (let index = 6; index >= 0; index -= 1) {
    const start = new Date();
    start.setDate(start.getDate() - index);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    days.push({
      key: start.toISOString().slice(0, 10),
      label: start.toLocaleDateString("en-US", {
        weekday: "short",
      }),
      start,
      end,
    });
  }

  return days;
}

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function getMonthRange() {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setMonth(end.getMonth() + 1);
  end.setDate(0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export async function GET() {
  const admin = await getAdminSession("dashboard.view");

  if (!admin.authorized || !admin.session) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  const last7Days = getLast7Days();
  const today = getTodayRange();
  const month = getMonthRange();

  const [
    totalUsers,
    activeUsers,
    inactiveUsers,

    totalRoles,

    pendingTrainerApprovals,
    activeTrainerAssignments,

    totalMembershipPlans,
    activeMembershipPlans,
    activeMemberMemberships,
    expiredMemberMemberships,

    totalServices,
    activeServices,
    todaySchedules,
    upcomingSchedules,

    totalBookings,
    bookedBookings,
    completedBookings,
    cancelledBookings,
    noShowBookings,

    totalNews,
    publishedNews,
    draftNews,

    unreadNotifications,
    totalActivityLogs,
    totalAuditLogs,

    userRoles,
    logsChart,
    bookingsChart,
    membershipsChart,
    revenueChart,
    recentBookings,
    recentSchedules,
  ] = await Promise.all([
    User.count(),

    User.count({
      where: {
        isActive: true,
      },
    }),

    User.count({
      where: {
        isActive: false,
      },
    }),

    Role.count(),

    TrainerProfile.count({
      where: {
        approvalStatus: "SUBMITTED",
      },
    }),

    TrainerAssignment.count({
      where: {
        isActive: true,
      },
    }),

    MembershipPlan.count(),

    MembershipPlan.count({
      where: {
        isActive: true,
      },
    }),

    MemberMembership.count({
      where: {
        status: "ACTIVE",
      },
    }),

    MemberMembership.count({
      where: {
        status: "EXPIRED",
      },
    }),

    Service.count(),

    Service.count({
      where: {
        isActive: true,
      },
    }),

    ServiceSchedule.count({
      where: {
        startTime: {
          [Op.between]: [today.start, today.end],
        },
        isCancelled: false,
      },
    }),

    ServiceSchedule.count({
      where: {
        startTime: {
          [Op.gte]: new Date(),
        },
        isCancelled: false,
      },
    }),

    Booking.count(),

    Booking.count({
      where: {
        status: "BOOKED",
      },
    }),

    Booking.count({
      where: {
        status: "COMPLETED",
      },
    }),

    Booking.count({
      where: {
        status: "CANCELLED",
      },
    }),

    Booking.count({
      where: {
        status: "NO_SHOW",
      },
    }),

    News.count(),

    News.count({
      where: {
        status: "PUBLISHED",
      },
    }),

    News.count({
      where: {
        status: "DRAFT",
      },
    }),

    Notification.count({
      where: {
        recipientUserId: admin.session.user.id,
        isRead: false,
      },
    }),

    ActivityLog.count(),

    AuditLog.count(),

    Promise.all(
      ["SUPERADMIN", "ADMIN", "CUSTOMER", "TRAINER"].map(async (roleSlug) => {
        const count = await User.count({
          include: [
            {
              model: Role,
              as: "role",
              where: {
                slug: roleSlug,
              },
              attributes: [],
            },
          ],
        });

        return {
          role: roleSlug,
          count,
        };
      }),
    ),

    Promise.all(
      last7Days.map(async (day) => {
        const [activityLogs, auditLogs] = await Promise.all([
          ActivityLog.count({
            where: {
              createdAt: {
                [Op.between]: [day.start, day.end],
              },
            },
          }),

          AuditLog.count({
            where: {
              createdAt: {
                [Op.between]: [day.start, day.end],
              },
            },
          }),
        ]);

        return {
          day: day.label,
          date: day.key,
          activityLogs,
          auditLogs,
        };
      }),
    ),

    Promise.all(
      last7Days.map(async (day) => {
        const [booked, completed, cancelled, noShow] = await Promise.all([
          Booking.count({
            where: {
              status: "BOOKED",
              createdAt: {
                [Op.between]: [day.start, day.end],
              },
            },
          }),

          Booking.count({
            where: {
              status: "COMPLETED",
              createdAt: {
                [Op.between]: [day.start, day.end],
              },
            },
          }),

          Booking.count({
            where: {
              status: "CANCELLED",
              createdAt: {
                [Op.between]: [day.start, day.end],
              },
            },
          }),

          Booking.count({
            where: {
              status: "NO_SHOW",
              createdAt: {
                [Op.between]: [day.start, day.end],
              },
            },
          }),
        ]);

        return {
          day: day.label,
          date: day.key,
          booked,
          completed,
          cancelled,
          noShow,
        };
      }),
    ),

    Promise.all(
      last7Days.map(async (day) => {
        const [active, pending, expired, cancelled] = await Promise.all([
          MemberMembership.count({
            where: {
              status: "ACTIVE",
              createdAt: {
                [Op.between]: [day.start, day.end],
              },
            },
          }),

          MemberMembership.count({
            where: {
              status: "PENDING",
              createdAt: {
                [Op.between]: [day.start, day.end],
              },
            },
          }),

          MemberMembership.count({
            where: {
              status: "EXPIRED",
              createdAt: {
                [Op.between]: [day.start, day.end],
              },
            },
          }),

          MemberMembership.count({
            where: {
              status: "CANCELLED",
              createdAt: {
                [Op.between]: [day.start, day.end],
              },
            },
          }),
        ]);

        return {
          day: day.label,
          date: day.key,
          active,
          pending,
          expired,
          cancelled,
        };
      }),
    ),

    Promise.all(
      last7Days.map(async (day) => {
        const memberships = await MemberMembership.sum("paidAmount", {
          where: {
            paymentStatus: "PAID",
            createdAt: {
              [Op.between]: [day.start, day.end],
            },
          },
        });

        const bookings = await Booking.sum("amountPaid", {
          where: {
            status: {
              [Op.ne]: "CANCELLED",
            },
            createdAt: {
              [Op.between]: [day.start, day.end],
            },
          },
        });

        return {
          day: day.label,
          date: day.key,
          memberships: Number(memberships || 0),
          bookings: Number(bookings || 0),
          total: Number(memberships || 0) + Number(bookings || 0),
        };
      }),
    ),

    Booking.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email"],
        },
        {
          model: ServiceSchedule,
          as: "serviceSchedule",
          include: [
            {
              model: Service,
              as: "service",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: 5,
    }),

    ServiceSchedule.findAll({
      where: {
        startTime: {
          [Op.gte]: new Date(),
        },
        isCancelled: false,
      },
      include: [
        {
          model: Service,
          as: "service",
          attributes: ["id", "name", "serviceType"],
        },
        {
          model: User,
          as: "trainer",
          attributes: ["id", "fullName", "email"],
          required: false,
        },
      ],
      order: [["startTime", "ASC"]],
      limit: 5,
    }),
  ]);

  const monthlyMembershipRevenue =
    Number(
      await MemberMembership.sum("paidAmount", {
        where: {
          paymentStatus: "PAID",
          createdAt: {
            [Op.between]: [month.start, month.end],
          },
        },
      }),
    ) || 0;

  const monthlyBookingRevenue =
    Number(
      await Booking.sum("amountPaid", {
        where: {
          status: {
            [Op.ne]: "CANCELLED",
          },
          createdAt: {
            [Op.between]: [month.start, month.end],
          },
        },
      }),
    ) || 0;

  return successResponse({
    message: "Dashboard overview fetched successfully",
    data: {
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers,

        totalRoles,

        pendingTrainerApprovals,
        activeTrainerAssignments,

        totalMembershipPlans,
        activeMembershipPlans,
        activeMemberMemberships,
        expiredMemberMemberships,

        totalServices,
        activeServices,
        todaySchedules,
        upcomingSchedules,

        totalBookings,
        bookedBookings,
        completedBookings,
        cancelledBookings,
        noShowBookings,

        totalNews,
        publishedNews,
        draftNews,

        unreadNotifications,
        totalActivityLogs,
        totalAuditLogs,

        monthlyRevenue: monthlyMembershipRevenue + monthlyBookingRevenue,
        monthlyMembershipRevenue,
        monthlyBookingRevenue,
      },
      charts: {
        userRoles,
        logsChart,
        bookingsChart,
        membershipsChart,
        revenueChart,
      },
      recent: {
        recentBookings,
        recentSchedules,
      },
    },
  });
}
