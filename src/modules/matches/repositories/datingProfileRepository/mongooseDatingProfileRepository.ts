import { Result } from '../../../../shared/core/result/result'
import { Maybe } from '../../../../shared/core/result/searchResult'
import { SuccessOrFailure } from '../../../../shared/core/result/successOrFailureResult'
import { DatingProfileSchema } from '../../../../shared/infra/database/mongoose/schemas/datingProfile.schema'
import { Logger } from '../../../../shared/infra/logger'
import { DatingProfile } from '../../domain/datingProfile'
import { DatingProfileMap } from '../../mappers/datingProfileMap'
import { DatingProfileFilter, DatingProfileRepository } from './datingProfileRepository'

export class MongooseDatingProfileRepository implements DatingProfileRepository {
  async getDatingProfileByFilter(filter: DatingProfileFilter): Promise<Maybe<DatingProfile>> {
    const mongoDatingProfile = await DatingProfileSchema.findOne(this.mapQueryFilter(filter))
    if (!mongoDatingProfile) {
      return Result.notFound('Dating Profile not found')
    }
    return Result.found(DatingProfileMap.mapToDomain(mongoDatingProfile))
  }

  async getDatingProfileByUserId(userId: string): Promise<Maybe<DatingProfile>> {
    const mongoDatingProfile = await DatingProfileSchema.findOne({
      user_id: userId,
    })

    return mongoDatingProfile
      ? Result.found(DatingProfileMap.mapToDomain(mongoDatingProfile))
      : Result.notFound('Dating Profile by userId not found')
  }

  async getUninteractedDatingProfiles(interactedDatingProfileIds: string[]): Promise<DatingProfile[]> {
    const mongoDatingProfiles = await DatingProfileSchema.find({
      dating_profile_id: {
        $nin: interactedDatingProfileIds,
      },
    })

    return mongoDatingProfiles.map((mongoDatingProfile) => DatingProfileMap.mapToDomain(mongoDatingProfile))
  }

  async save(datingProfile: DatingProfile): Promise<SuccessOrFailure<void>> {
    try {
      const rawDatingProfile = DatingProfileMap.mapToPersistence(datingProfile)
      const mongooseDatingProfile = await DatingProfileSchema.findOne({
        dating_profile_id: rawDatingProfile.dating_profile_id,
      })

      if (mongooseDatingProfile) {
        Object.assign(mongooseDatingProfile, rawDatingProfile)
        await mongooseDatingProfile.save()
      } else {
        await DatingProfileSchema.create(rawDatingProfile)
      }
      return Result.ok()
    } catch (error) {
      Logger.error('Error when saving dating profile', error)
      return Result.fail()
    }
  }

  async saveBulk(datingProfiles: DatingProfile[]): Promise<SuccessOrFailure<void>> {
    return Promise.all(datingProfiles.map(async (datingProfile) => this.save(datingProfile)))
      .catch((err) => Result.fail(err))
      .then(() => Result.ok())
  }

  private mapQueryFilter(filter: DatingProfileFilter) {
    return {
      ...(filter.datingProfileId ? { dating_profile_id: filter.datingProfileId } : {}),
    }
  }
}
