import { Result } from '../../../../shared/core/result/result'
import { Maybe } from '../../../../shared/core/result/searchResult'
import { SuccessOrFailure } from '../../../../shared/core/result/successOrFailureResult'
import { UserModel } from '../../../../shared/infra/database/sequelize/models/user.model'
import { User } from '../../domain/user'
import { UserMap } from '../../mappers/userMap'
import { UserRepository } from './userRepository'

type UserFilters = {
  email: string
}

export class SequelizeUserRepository implements UserRepository {
  async save(user: User): Promise<SuccessOrFailure<void>> {
    const rawUser = UserMap.mapToPersistence(user)
    try {
      const sequelizeUser = await UserModel.findByPk(rawUser.userId)
      if (sequelizeUser) {
        Object.assign(sequelizeUser, rawUser)
        sequelizeUser.save()
      } else {
        await UserModel.create(rawUser)
      }
      return Result.ok()
    } catch (err) {
      return Result.fail('Error when saving user')
    }
  }
  async saveBulk(users: User[]): Promise<SuccessOrFailure<void>> {
    return Promise.all(users.map(async (user) => this.save(user)))
      .catch((err) => Result.fail(err))
      .then(() => Result.ok())
  }

  async isEmailAlreadyInUse(email: string): Promise<boolean> {
    return (
      (await UserModel.count({
        where: {
          email: email,
        },
      })) > 0
    )
  }

  async getUserByEmail(email: string): Promise<Maybe<User>> {
    const sqlUser = await UserModel.findOne({
      where: {
        email: email,
      },
    })

    if (!sqlUser) return Result.notFound('User not found by email')
    return Result.found(UserMap.mapToDomain(sqlUser.dataValues))
  }

  async getUserByUserId(userId: string): Promise<Maybe<User>> {
    const sqlUser = await UserModel.findOne({
      where: {
        userId: userId,
      },
    })

    if (!sqlUser) return Result.notFound('User not found by userId')

    return Result.found(UserMap.mapToDomain(sqlUser.dataValues))
  }

  private mapQueryFilters(filters: UserFilters) {
    return {
      ...(filters.email && { email: filters.email }),
    }
  }
}
