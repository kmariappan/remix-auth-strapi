/* eslint-disable prettier/prettier */
import { SessionStorage } from "@remix-run/server-runtime"
import {
  AuthenticateOptions,
  Strategy,
  StrategyVerifyCallback,
} from "remix-auth"

/**
 * This interface declares what configuration the strategy needs from the
 * developer to correctly work.
 */
export interface StrapiStrategyOptions {
  something: "You may need"
}

/**
 * This interface declares what the developer will receive from the strategy
 * to verify the user identity in their system.
 */
export interface StrapiStrategyVerifyParams {
  something: "Dev may need"
}

export class MyStrategy<User> extends Strategy<
  User,
  StrapiStrategyVerifyParams
> {
  name = "change-me"

  constructor(
    options: StrapiStrategyOptions,
    verify: StrategyVerifyCallback<User, StrapiStrategyVerifyParams>
  ) {
    super(verify)
    // do something with the options here
  }

  async authenticate(
    request: Request,
    sessionStorage: SessionStorage,
    options: AuthenticateOptions
  ): Promise<User> {
    return await this.failure("Implement me!", request, sessionStorage, options)
    // Uncomment me to do a success response
    // this.success({} as User, request, sessionStorage, options);
  }
}
