import type { SessionStorage } from '@remix-run/server-runtime'
import type { AuthenticateOptions, StrategyVerifyCallback } from 'remix-auth'
import { Strategy } from 'remix-auth'
import type { StrapiClient } from '@kmariappan/strapi-client-js'
import type { AuthData } from '@kmariappan/strapi-client-js/src/lib/types/auth'
import type { StrapiApiResponse } from '@kmariappan/strapi-client-js/src/lib/types/base'

export type StrapiAuthResponse = StrapiApiResponse<AuthData>

export type CheckOptions =
    | { successRedirect?: never; failureRedirect?: never }
    | { successRedirect: string; failureRedirect?: never }
    | { successRedirect?: never; failureRedirect: string }

export interface StrapiStrategyOptions {
    readonly strapiClient: StrapiClient

    readonly sessionStorage: SessionStorage

    readonly sessionKey: string

    readonly sessionErrorKey: string
}

export interface VerifyParams {
    readonly request: Request

    readonly strapiClient: StrapiClient
}

export class StrapiStrategy extends Strategy<StrapiAuthResponse, VerifyParams> {
    name = 'strapi'

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
                'StrapiStrategy : Constructor expected to receive a strapi client instance. Missing options.strapiClient'
            )

        if (!options?.sessionStorage)
            throw new Error(
                'StrapiStrategy : Constructor expected to receive a session storage instance. Missing options.sessionStorage'
            )
        if (!verify)
            throw new Error(
                'StrapiStrategy : Constructor expected to receive a verify function. Missing verify'
            )

        super(verify)

        this.strapiClient = options.strapiClient
        this.sessionStorage = options.sessionStorage
        this.sessionKey = options.sessionKey
        this.sessionErrorKey = options.sessionErrorKey
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
                      : 'no user found',
                  request,
                  sessionStorage,
                  options
              )
    }

    async checkSession(
        req: Request,
        checkOptions: {
            successRedirect: string
            failureRedirect?: never
        }
    ): Promise<null>

    async checkSession(
        req: Request,
        checkOptions: {
            successRedirect?: never
            failureRedirect: string
        }
    ): Promise<StrapiAuthResponse>

    async checkSession(
        req: Request,
        checkOptions?: {
            successRedirect?: never
            failureRedirect?: never
        }
    ): Promise<StrapiAuthResponse | null>

    async checkSession(
        req: Request,
        checkOptions: CheckOptions = {}
    ): Promise<StrapiAuthResponse | null> {
        const sessionCookie = await this.sessionStorage.getSession(
            req.headers.get('Cookie')
        )
        const session = sessionCookie.get(this.sessionKey) as StrapiAuthResponse

        const options = {
            sessionKey: this.sessionKey,
            sessionErrorKey: this.sessionErrorKey,
            ...checkOptions,
        }
        if (!session)
            return this.handleResult(
                req,
                options,
                'No session data found',
                true
            )

        if (session && !session.data?.jwt)
            return this.handleResult(
                req,
                options,
                'No session data found',
                true
            )

        return this.handleResult(req, options, session)
    }

    protected async handleResult(
        req: Request,
        options: AuthenticateOptions,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result: any,
        hasErrored = false
    ) {
        if (options.failureRedirect && hasErrored)
            return this.failure(result, req, this.sessionStorage, options)

        if (hasErrored) return null

        if (options.successRedirect && !hasErrored)
            return this.success(result, req, this.sessionStorage, options)

        return result
    }
}
