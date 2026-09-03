import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

/**
 * AccessRole defines application-level RBAC permissions.
 * This is SEPARATE from the `role` field which represents
 * the chat persona / job title used by the chatbot reply system.
 */
export enum AccessRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  /**
   * Stores the bcrypt hash of the user's password.
   * Plain-text passwords are never stored.
   * Nullable to support existing rows before auth is wired up.
   */
  @Column({ nullable: true })
  passwordHash: string;

  /**
   * Chat persona / job title.
   * Used by the WebSocket chatbot reply system.
   * DO NOT rename or remove this field.
   */
  @Column()
  role: string;

  /**
   * Application-level RBAC role.
   * Controls access to admin/manager features.
   */
  @Column({
    type: 'enum',
    enum: AccessRole,
    default: AccessRole.USER,
  })
  accessRole: AccessRole;

  @Column({
    type: 'varchar',
    default: 'Active',
  })
  status: 'Active' | 'Inactive' | 'Pending';

  @Column()
  avatar: string;
}
