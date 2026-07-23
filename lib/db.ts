import Dexie, { type EntityTable } from "dexie"

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
}

export interface Account {
  id: string
  spaceId: string
  name: string
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

const db = new Dexie("LifeDeck") as Dexie & {
  profiles: EntityTable<Profile, "id">
  spaces: EntityTable<Space, "id">
  spaceMembers: EntityTable<SpaceMember, "id">
  accounts: EntityTable<Account, "id">
  categories: EntityTable<Category, "id">
  transactions: EntityTable<Transaction, "id">
  tasks: EntityTable<Task, "id">
  notes: EntityTable<Note, "id">
}

db.version(1).stores({
  profiles: "id, currency, createdAt",
  spaces: "id, name, inviteCode, createdAt",
  spaceMembers: "id, spaceId, userId, role",
  accounts: "id, spaceId, name, isDefault",
  categories: "id, spaceId, name",
  transactions: "id, spaceId, createdBy, accountId, categoryId, type, loggedAt, createdAt",
  tasks: "id, spaceId, createdBy, assignedTo, isCompleted, priority, dueDate, createdAt",
  notes: "id, spaceId, createdBy, isPinned, createdAt",
})

export default db
