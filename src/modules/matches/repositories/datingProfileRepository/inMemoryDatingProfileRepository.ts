import { Result } from '../../../../shared/core/result/result'
import { Maybe } from '../../../../shared/core/result/searchResult'
import { SuccessOrFailure } from '../../../../shared/core/result/successOrFailureResult'
import { DatingProfile } from '../../domain/datingProfile'
import { DatingProfileFilter, DatingProfileRepository } from './datingProfileRepository'

export class InMemoryDatingProfileRepository implements DatingProfileRepository {
  #inMemoryDatingProfiles: DatingProfile[] = []

  async getDatingProfileByFilter(filter: DatingProfileFilter): Promise<Maybe<DatingProfile>> {
    const existingDatingProfile = this.#inMemoryDatingProfiles.find((inMemoryDatingProfile) =>
      Object.entries(filter).every(
        ([key, value]) => (inMemoryDatingProfile[key as keyof DatingProfile] as string) === value,
      ),
    )
    return existingDatingProfile ? Result.found(existingDatingProfile) : Result.notFound('Dating Profile not found')
  }

  async getDatingProfileByUserId(userId: string): Promise<Maybe<DatingProfile>> {
    const existingDatingProfile = this.#inMemoryDatingProfiles.find(
      (inMemoryDatingProfile) => inMemoryDatingProfile.userId === userId,
    )

    return existingDatingProfile
      ? Result.found(existingDatingProfile)
      : Result.notFound('Dating Profile by User Id not found')
  }

  async getUninteractedDatingProfiles(
    interactedDatingProfileIds: string[],
    excludeDatingProfileId: string,
  ): Promise<DatingProfile[]> {
    return this.#inMemoryDatingProfiles.filter(
      (inMemoryDatingProfile) =>
        !interactedDatingProfileIds.includes(inMemoryDatingProfile.datingProfileId) &&
        inMemoryDatingProfile.datingProfileId != excludeDatingProfileId,
    )
  }

  async save(datingProfile: DatingProfile): Promise<SuccessOrFailure<void>> {
    const existingIndex = this.#inMemoryDatingProfiles.findIndex(
      (iDatingProfile) => iDatingProfile.datingProfileId === datingProfile.datingProfileId,
    )
    if (existingIndex != -1) {
      this.#inMemoryDatingProfiles[existingIndex] = datingProfile
    } else {
      this.#inMemoryDatingProfiles.push(datingProfile)
    }

    return Result.ok()
  }
  async saveBulk(datingProfiles: DatingProfile[]): Promise<SuccessOrFailure<void>> {
    datingProfiles.map((datingProfile) => this.save(datingProfile))
    return Result.ok()
  }
}
