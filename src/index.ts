import type { createCookieSessionStorage } from '@remix-run/node'
import { Authenticator, AuthorizationError } from 'remix-auth'
import type { StrapiAuthResponse } from './strapi-strategy'
import { StrapiStrategy } from './strapi-strategy'
import type { StrapiClient } from '@kmariappan/strapi-client-js'

export type StrapiAuthenticatorOptions = {
    strapiClient: StrapiClient
    sessionStorage: ReturnType<typeof createCookieSessionStorage>
    sessionKey: string
    sessionErrorKey: string
}

export { StrapiStrategy, StrapiAuthResponse }

export const createStrapiStrategy = (
    options: StrapiAuthenticatorOptions
): {
    strapiStrategy: StrapiStrategy
    authenticator: Authenticator<StrapiAuthResponse>
} => {
    const { strapiClient, sessionStorage, sessionKey, sessionErrorKey } =
        options

    const strapiStrategy = new StrapiStrategy(
        {
            strapiClient,
            sessionStorage,
            sessionKey: sessionKey ? sessionKey : 'strapi:session',
            sessionErrorKey: sessionErrorKey ? sessionErrorKey : 'strapi:error',
        },
        async ({ request, strapiClient }) => {
            const form = await request.formData()
            const email = form?.get('email')
            const password = form?.get('password')

            if (!email) throw new AuthorizationError('Email is required')
            if (typeof email !== 'string')
                throw new AuthorizationError('Email must be string')

            if (!password) throw new AuthorizationError('Password is required')
            if (typeof password !== 'string')
                throw new AuthorizationError('Password must be string')

            return new Promise<StrapiAuthResponse>((resolve) => {
                strapiClient.auth.signIn({ email, password }).then((res) => {
                    resolve(res)
                })
            })
        }
    )

    const authenticator = new Authenticator<StrapiAuthResponse>(
        sessionStorage,
        {
            sessionKey: strapiStrategy.sessionKey,
            sessionErrorKey: strapiStrategy.sessionErrorKey,
        }
    )

    authenticator.use(strapiStrategy)

    return { authenticator, strapiStrategy }
}
