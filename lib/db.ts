export interface Profile {
  id: string
  displayName?: string
  avatarUrl?: string
  currency: string
  monthlyBudget: number
  themePreference: string
  accentColor: string
  createdAt: Date
  updatedAt: Date
}

export interface Space {
  id: string
  name: string
  inviteCode: string
  createdAt: Date
}

export interface SpaceMember {
  id: string
  spaceId: string
  userId: string
  role: "owner" | "member"
  defaultAccountId?: string
  joinedAt: Date
  displayName?: string
}

export interface Account {
  id: string
  spaceId: string
  name: string
  balance: number
  isDefault: boolean
  createdAt: Date
}

export interface Category {
  id: string
  spaceId: string
  name: string
  icon?: string
  color?: string
  createdAt: Date
}

export interface Transaction {
  id: string
  spaceId: string
  createdBy?: string
  accountId?: string
  categoryId?: string
  amount: number
  type: "expense" | "income" | "transfer"
  note?: string
  loggedAt: Date
  createdAt: Date
}

export interface Task {
  id: string
  spaceId: string
  createdBy?: string
  assignedTo?: string
  title: string
  isCompleted: boolean
  priority: "low" | "medium" | "high"
  dueDate?: Date
  completedAt?: Date
  createdAt: Date
}

export interface CategoryKeyword {
  id: string
  spaceId: string
  categoryId: string
  keyword: string
  createdAt: Date
}

export interface Note {
  id: string
  spaceId: string
  createdBy?: string
  content: string
  tags: string[]
  isPinned: boolean
  createdAt: Date
  updatedAt: Date
}
