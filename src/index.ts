/* eslint-disable prettier/prettier */
import { SessionStorage } from "@remix-run/server-runtime"
import {
  AuthenticateOptions,
  Strategy,
  StrategyVerifyCallback,
} from "remix-auth"
import { StrapiClient } from "@kmariappan/strapi-client-js"
import { AuthData } from "@kmariappan/strapi-client-js/src/lib/types/auth"
import { StrapiApiResponse } from "@kmariappan/strapi-client-js/src/lib/types/base"

export type StrapiAuthResponse = StrapiApiResponse<AuthData>

export interface StrapiStrategyOptions {
  readonly strapiClient: StrapiClient

  readonly sessionStorage: SessionStorage

  readonly sessionKey?: string

  readonly sessionErrorKey?: string
}

export interface VerifyParams {
  readonly request: Request

  readonly strapiClient: StrapiClient
}

export class StrapiStragegy extends Strategy<StrapiAuthResponse, VerifyParams> {
  name = "strapi"

  readonly sessionKey: string
  readonly sessionErrorKey: string

  private readonly strapiClient: StrapiClient
  private readonly sessionStorage: SessionStorage

  constructor(
    options: StrapiStrategyOptions,
    verify: StrategyVerifyCallback<StrapiAuthResponse, VerifyParams>
  ) {
    if (!options?.strapiClient)
      throw new Error(
        "StrapiStrategy : Constructor expected to receive a strapi client instance. Missing options.strapiClient"
      )

    if (!options?.sessionStorage)
      throw new Error(
        "StrapiStrategy : Constructor expected to receive a session storage instance. Missing options.sessionStorage"
      )
    if (!verify)
      throw new Error(
        "StrapiStrategy : Constructor expected to receive a verify function. Missing verify"
      )

    super(verify)

    this.strapiClient = options.strapiClient
    this.sessionStorage = options.sessionStorage
    this.sessionKey = options.sessionKey ?? "strapi-auth:session"
    this.sessionErrorKey = options.sessionErrorKey ?? "strapi-auth:error"
  }

  async authenticate(
    request: Request,
    sessionStorage: SessionStorage,
    options: AuthenticateOptions
  ): Promise<StrapiAuthResponse> {
    const authResponse = await this.verify({
      request,
      strapiClient: this.strapiClient,
    })

    return authResponse.data?.jwt
      ? this.success(authResponse, request, sessionStorage, options)
      : this.failure(
          authResponse.error?.message
            ? authResponse.error?.message
            : "no user found",
          request,
          sessionStorage,
          options
        )
  }
}
