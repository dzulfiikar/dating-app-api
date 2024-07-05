import { Request, Response } from 'express'
import { BaseController } from '../../../../shared/infra/http/baseController'
import { SendJSONResponse } from '../../../../shared/infra/http/jsonResponse'
import { NoDiscoverableDatingProfiles } from './discoverDatingProfilesErrors'
import { DiscoverDatingProfilesUseCase } from './discoverDatingProfilesUseCase'

export class DiscoverDatingProfilesController extends BaseController {
  #useCase: DiscoverDatingProfilesUseCase

  constructor(useCase: DiscoverDatingProfilesUseCase) {
    super()
    this.#useCase = useCase
  }

  protected async handleExecute(req: Request, res: Response): Promise<Response> {
    const user = req.user!

    const useCaseResult = await this.#useCase.execute({
      userId: user.userId,
    })

    if (useCaseResult.isLeft()) {
      const error = useCaseResult.error
      switch (error.constructor) {
        case NoDiscoverableDatingProfiles:
          return SendJSONResponse.clientError(res)
        default:
          return SendJSONResponse.fail(res)
      }
    } else {
      return SendJSONResponse.ok(res, useCaseResult.value)
    }
  }
}
