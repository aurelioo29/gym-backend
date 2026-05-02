import { sequelize } from "@/lib/sequelize";

import { Role } from "./role.model";
import { Permission } from "./permission.model";
import { RolePermission } from "./role-permission.model";
import { User } from "./user.model";
import { RefreshToken } from "./refresh-token.model";
import { VerificationCode } from "./verification-code.model";
import { CustomerProfile } from "./customer-profile.model";
import { TrainerProfile } from "./trainer-profile.model";
import { GymInfo } from "./gym-info.model";
import { GeneralSetting } from "./general-setting.model";
import { AuditLog } from "./audit-log.model";
import { ActivityLog } from "./activity-log.model";
import { Notification } from "./notification.model";
import { NewsCategory } from "./news-category.model";
import { News } from "./news.model";
import { TrainerAssignment } from "./trainer-assignment.model";
import { MembershipPlan } from "./membership-plan.model";
import { Service } from "./service.model";
import { MemberMembership } from "./member-membership.model";
import { ServiceSchedule } from "./service-schedule.model";
import { Booking } from "./booking.model";
import { PushNotification } from "./push-notification.model";

Role.initModel(sequelize);
Permission.initModel(sequelize);
RolePermission.initModel(sequelize);
User.initModel(sequelize);
RefreshToken.initModel(sequelize);
VerificationCode.initModel(sequelize);
CustomerProfile.initModel(sequelize);
TrainerProfile.initModel(sequelize);
GymInfo.initModel(sequelize);
GeneralSetting.initModel(sequelize);
AuditLog.initModel(sequelize);
ActivityLog.initModel(sequelize);
Notification.initModel(sequelize);
NewsCategory.initModel(sequelize);
News.initModel(sequelize);
TrainerAssignment.initModel(sequelize);
MembershipPlan.initModel(sequelize);
MemberMembership.initModel(sequelize);
Service.initModel(sequelize);
ServiceSchedule.initModel(sequelize);
Booking.initModel(sequelize);
PushNotification.initModel(sequelize);

/**
 * Role ↔ User
 */
Role.hasMany(User, {
  foreignKey: "roleId",
  as: "users",
});

User.belongsTo(Role, {
  foreignKey: "roleId",
  as: "role",
});

/**
 * Role ↔ Permission many-to-many
 */
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: "roleId",
  otherKey: "permissionId",
  as: "permissions",
});

Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: "permissionId",
  otherKey: "roleId",
  as: "roles",
});

RolePermission.belongsTo(Role, {
  foreignKey: "roleId",
  as: "role",
});

RolePermission.belongsTo(Permission, {
  foreignKey: "permissionId",
  as: "permission",
});

/**
 * User ↔ RefreshToken
 */
User.hasMany(RefreshToken, {
  foreignKey: "userId",
  as: "refreshTokens",
});

RefreshToken.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

/**
 * User ↔ VerificationCode
 */
User.hasMany(VerificationCode, {
  foreignKey: "userId",
  as: "verificationCodes",
});

VerificationCode.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

/**
 * User ↔ CustomerProfile
 */
User.hasOne(CustomerProfile, {
  foreignKey: "userId",
  as: "customerProfile",
});

CustomerProfile.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

/**
 * User ↔ TrainerProfile
 */
User.hasOne(TrainerProfile, {
  foreignKey: "userId",
  as: "trainerProfile",
});

TrainerProfile.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

TrainerProfile.belongsTo(User, {
  foreignKey: "approvedBy",
  as: "approvedByUser",
});

/**
 * User ↔ Logs
 */
User.hasMany(AuditLog, {
  foreignKey: "userId",
  as: "auditLogs",
});

AuditLog.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

User.hasMany(ActivityLog, {
  foreignKey: "userId",
  as: "activityLogs",
});

ActivityLog.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

/**
 * User ↔ Notifications
 */
User.hasMany(Notification, {
  foreignKey: "recipientUserId",
  as: "notifications",
});

Notification.belongsTo(User, {
  foreignKey: "recipientUserId",
  as: "recipient",
});

User.hasMany(Notification, {
  foreignKey: "actorUserId",
  as: "actedNotifications",
});

Notification.belongsTo(User, {
  foreignKey: "actorUserId",
  as: "actor",
});

/**
 * News Categories ↔ News
 */
NewsCategory.hasMany(News, {
  foreignKey: "categoryId",
  as: "news",
});

News.belongsTo(NewsCategory, {
  foreignKey: "categoryId",
  as: "category",
});

/**
 * User ↔ News
 */
User.hasMany(News, {
  foreignKey: "authorId",
  as: "authoredNews",
});

News.belongsTo(User, {
  foreignKey: "authorId",
  as: "author",
});

/**
 * User ↔ Trainer Assignment
 */

User.hasMany(TrainerAssignment, {
  foreignKey: "customerId",
  as: "customerAssignments",
});

User.hasMany(TrainerAssignment, {
  foreignKey: "trainerId",
  as: "trainerAssignments",
});

User.hasMany(TrainerAssignment, {
  foreignKey: "assignedBy",
  as: "assignedTrainerAssignments",
});

TrainerAssignment.belongsTo(User, {
  foreignKey: "customerId",
  as: "customer",
});

TrainerAssignment.belongsTo(User, {
  foreignKey: "trainerId",
  as: "trainer",
});

TrainerAssignment.belongsTo(User, {
  foreignKey: "assignedBy",
  as: "assignedByUser",
});

/**
 * User ↔ Member Memberships
 */
User.hasMany(MemberMembership, {
  foreignKey: "userId",
  as: "memberMemberships",
});

MemberMembership.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

User.hasMany(MemberMembership, {
  foreignKey: "createdBy",
  as: "createdMemberMemberships",
});

MemberMembership.belongsTo(User, {
  foreignKey: "createdBy",
  as: "createdByUser",
});

/**
 * Membership Plan ↔ Member Memberships
 */
MembershipPlan.hasMany(MemberMembership, {
  foreignKey: "membershipPlanId",
  as: "memberMemberships",
});

MemberMembership.belongsTo(MembershipPlan, {
  foreignKey: "membershipPlanId",
  as: "membershipPlan",
});

/**
 * Service ↔ Service Schedules
 */
Service.hasMany(ServiceSchedule, {
  foreignKey: "serviceId",
  as: "schedules",
});

ServiceSchedule.belongsTo(Service, {
  foreignKey: "serviceId",
  as: "service",
});

/**
 * Trainer User ↔ Service Schedules
 */
User.hasMany(ServiceSchedule, {
  foreignKey: "trainerId",
  as: "serviceSchedules",
});

ServiceSchedule.belongsTo(User, {
  foreignKey: "trainerId",
  as: "trainer",
});

/**
 * Created By User ↔ Service Schedules
 */
User.hasMany(ServiceSchedule, {
  foreignKey: "createdBy",
  as: "createdServiceSchedules",
});

ServiceSchedule.belongsTo(User, {
  foreignKey: "createdBy",
  as: "createdByUser",
});

/**
 * User ↔ Bookings
 */
User.hasMany(Booking, {
  foreignKey: "userId",
  as: "bookings",
});

Booking.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

User.hasMany(Booking, {
  foreignKey: "createdBy",
  as: "createdBookings",
});

Booking.belongsTo(User, {
  foreignKey: "createdBy",
  as: "createdByUser",
});

User.hasMany(Booking, {
  foreignKey: "cancelledBy",
  as: "cancelledBookings",
});

Booking.belongsTo(User, {
  foreignKey: "cancelledBy",
  as: "cancelledByUser",
});

/**
 * Service Schedule ↔ Bookings
 */
ServiceSchedule.hasMany(Booking, {
  foreignKey: "serviceScheduleId",
  as: "bookings",
});

Booking.belongsTo(ServiceSchedule, {
  foreignKey: "serviceScheduleId",
  as: "serviceSchedule",
});

/**
 * Push Notification ↔ User & Service
 */

User.hasMany(PushNotification, {
  foreignKey: "userId",
  as: "pushNotifications",
});

PushNotification.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

User.hasMany(PushNotification, {
  foreignKey: "createdBy",
  as: "createdPushNotifications",
});

PushNotification.belongsTo(User, {
  foreignKey: "createdBy",
  as: "createdByUser",
});

Service.hasMany(PushNotification, {
  foreignKey: "serviceId",
  as: "pushNotifications",
});

PushNotification.belongsTo(Service, {
  foreignKey: "serviceId",
  as: "service",
});

export {
  sequelize,
  Role,
  Permission,
  RolePermission,
  User,
  RefreshToken,
  VerificationCode,
  CustomerProfile,
  TrainerProfile,
  TrainerAssignment,
  GymInfo,
  GeneralSetting,
  AuditLog,
  ActivityLog,
  Notification,
  NewsCategory,
  News,
  MembershipPlan,
  MemberMembership,
  Service,
  ServiceSchedule,
  Booking,
  PushNotification,
};
