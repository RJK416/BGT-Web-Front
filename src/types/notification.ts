export enum NotificationType {
  GuildInvite = 0,
  GuildInviteApproved = 1,
  GuildInviteRejected = 2,
  TournamentInvite = 3,
  TournamentUpdate = 4,
  MatchResult = 5,
  SystemMessage = 6,
  FriendRequest = 7,
  AchievementUnlocked = 8
}

export enum NotificationStatus {
  Unread = 0,
  Read = 1,
  Archived = 2
}

export interface Notification {
  id: number;
  senderId: number;
  senderName: string;
  receiverId: number;
  receiverName: string;
  message: string;
  create: string;
  received: string;
  readAt?: string;
  status: NotificationStatus;
  type: NotificationType;
  contentId?: number;
  actionData?: string;
  guild?: {
    id: number;
    name: string;
  };
}

export interface NotificationResponse {
  status: number;
  message: string;
  data: Notification[];
  isSuccess: boolean;
}

export interface NotificationCountResponse {
  status: number;
  message: string;
  data: number;
  isSuccess: boolean;
}

export interface NotificationActionResponse {
  status: number;
  message: string;
  data: boolean;
  isSuccess: boolean;
}
