import { Repository, EntityRepository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';

import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async signUp(authCredentialDto: AuthCredentialsDto): Promise<void> {
    const { username, password } = authCredentialDto;

    const user = this.create();
    user.username = username;
    user.salt = await bcrypt.genSalt();
    user.password = await this.hashPassword(password, user.salt);

    try {
      await user.save();
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Username already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async validateUserPassword(
    authCredentialDto: AuthCredentialsDto,
  ): Promise<string> {
    const { username, password } = authCredentialDto;
    const user = await this.findOne({ username });
    if (user && (await user.validatePassword(password))) {
      return user.username;
    } else {
      return null;
      // throw new UnauthorizedException('Invalid Credentials');
    }
  }

  private async hashPassword(password: string, salt: string): Promise<string> {
    return bcrypt.hash(password, salt);
  }
}
