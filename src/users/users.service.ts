import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, AccessRole } from './user.entity';

export { User };

/**
 * Development-only password used for all seeded users.
 * The plain-text value is: dev-password-2024
 * Only the bcrypt hash is stored in the database.
 */
const DEV_PASSWORD = 'dev-password-2024';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    const count = await this.userRepository.count();
    if (count === 0) {
      // Hash the shared development password once
      const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);

      const mockUsers: Partial<User>[] = [
        {
          name: 'Olivia Vance',
          email: 'olivia.vance@example.com',
          role: 'Product Designer', // chat persona – DO NOT change
          accessRole: AccessRole.USER,
          status: 'Active' as const,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia',
          passwordHash,
        },
        {
          name: 'Ethan Hunt',
          email: 'ethan.hunt@example.com',
          role: 'Lead Developer', // chat persona – DO NOT change
          accessRole: AccessRole.ADMIN,
          status: 'Active' as const,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ethan',
          passwordHash,
        },
        {
          name: 'Sophia Reynolds',
          email: 'sophia.r@example.com',
          role: 'Product Manager', // chat persona – DO NOT change
          accessRole: AccessRole.MANAGER,
          status: 'Pending' as const,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia',
          passwordHash,
        },
        {
          name: 'Marcus Brody',
          email: 'marcus.brody@example.com',
          role: 'DevOps Engineer', // chat persona – DO NOT change
          accessRole: AccessRole.USER,
          status: 'Active' as const,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
          passwordHash,
        },
        {
          name: 'Zoe Jenkins',
          email: 'zoe.j@example.com',
          role: 'QA Specialist', // chat persona – DO NOT change
          accessRole: AccessRole.USER,
          status: 'Inactive' as const,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe',
          passwordHash,
        },
        {
          name: 'Liam Neeson',
          email: 'liam.n@example.com',
          role: 'Support Engineer', // chat persona – DO NOT change
          accessRole: AccessRole.USER,
          status: 'Active' as const,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liam',
          passwordHash,
        },
        {
          name: 'Ava Lovelace',
          email: 'ava.l@example.com',
          role: 'Data Scientist', // chat persona – DO NOT change
          accessRole: AccessRole.MANAGER,
          status: 'Pending' as const,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ava',
          passwordHash,
        },
        {
          name: 'Lucas Graham',
          email: 'lucas.g@example.com',
          role: 'Security Engineer', // chat persona – DO NOT change
          accessRole: AccessRole.ADMIN,
          status: 'Active' as const,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas',
          passwordHash,
        },
      ];
      await this.userRepository.save(mockUsers);
    }
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({ order: { name: 'ASC' } });
  }

  async findById(id: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ id });
  }

  /**
   * Looks up a user by email address.
   * Used by AuthService for login validation.
   * Returns the full User row including passwordHash so bcrypt.compare can run.
   * The caller is responsible for never leaking passwordHash to the client.
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ email });
  }

  async updateUserStatus(
    id: string,
    status: 'Active' | 'Inactive' | 'Pending',
  ): Promise<User | null> {
    const user = await this.findById(id);
    if (user) {
      user.status = status;
      return await this.userRepository.save(user);
    }
    return null;
  }
}
