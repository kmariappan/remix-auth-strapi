# Remix Auth Strapi

<!-- Description -->

The Strapi strategy is used to authenticate users against a Strapi CMS account.

## Supported runtimes

| Runtime    | Has Support |
| ---------- | ----------- |
| Node.js    | ✅          |
| Cloudflare | ✅          |

## Documentations

### Install the package

```js
   yarn add remix-auth-strapi

   or

   npm install remix-auth-strapi
```

## How to use

#### Create the StrapiClient Instance

```ts
// app/strapi.server.ts

import { createClient } from '@kmariappan/strapi-client-js'

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            STRAPI_URL: string
            SECRET_KEY: string
        }
    }
}

if (!process.env.STRAPI_URL) throw new Error('STRAPI_URL is required')

export const getStrapiClient = (apiToken?: string) =>
    createClient({
        url: process.env.STRAPI_URL,
        apiToken,
    })
```

#### Create the StrapiStrategy Instance by using the `createStrapiStrategy` helper function.

```ts
// app/auth.server.ts

import { createCookieSessionStorage } from '@remix-run/node'
import { createStrapiStrategy } from 'remix-auth-strapi'
import { getStrapiClient } from './strapi.server'

const strapiClient = getStrapiClient()

const sessionStorage = createCookieSessionStorage({
    cookie: {
        name: 'strapi',
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secrets: [process.env.SECRET_KEY],
        secure: process.env.NODE_ENV === 'production',
    },
})

const { authenticator, strapiStrategy } = createStrapiStrategy({
    sessionStorage,
    strapiClient,
    sessionKey: 'session-key', // Defualt value  strapi:session
    sessionErrorKey: 'session-error-key', // Defualt value  'strapi:error',
})

export { authenticator, strapiStrategy, sessionStorage }
```

#### Example Login Page

```tsx
// app/routes/login
import type { ActionFunction, LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { Form, useLoaderData } from '@remix-run/react'
import { authenticator, strapiStrategy, sessionStorage } from '~/auth.server'

interface LoaderData {
    error: { message: string } | null
}

export const action: ActionFunction = async ({ request }) => {
    await authenticator.authenticate('strapi', request, {
        successRedirect: '/private',
        failureRedirect: '/login',
    })
}

export const loader: LoaderFunction = async ({ request }) => {
    await strapiStrategy.checkSession(request, {
        successRedirect: '/private',
    })

    const session = await sessionStorage.getSession(
        request.headers.get('Cookie')
    )

    const error = session.get(
        strapiStrategy.sessionErrorKey
    ) as LoaderData['error']

    return json<LoaderData>({ error })
}

export default function Screen() {
    const { error } = useLoaderData<LoaderData>()

    return (
        <Form method="post">
            {error && <div>{error.message}</div>}
            <div>
                <label htmlFor="email">Email</label>
                <input type="email" name="email" id="email" />
            </div>

            <div>
                <label htmlFor="password">Password</label>
                <input type="password" name="password" id="password" />
            </div>

            <button>Log In</button>
        </Form>
    )
}
```

#### Example Private Page

```tsx
import type { User } from '@kmariappan/strapi-client-js/src/lib/types/auth'
import type { ActionFunction, LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { Form, useLoaderData } from '@remix-run/react'
import { authenticator, strapiStrategy } from '~/auth.server'
import { getStrapiClient } from '~/strapi'

interface LoaderData {
    user?: User | null
}

export const action: ActionFunction = async ({ request }) => {
    await authenticator.logout(request, {
        redirectTo: '/login',
    })
}

export const loader: LoaderFunction = async ({ request }) => {
    const session = await strapiStrategy.checkSession(request, {
        failureRedirect: '/login',
    })

    const strapiClient = getStrapiClient(session.data?.jwt)

    const { data } = await strapiClient.auth.getMe()

    return json<LoaderData>({ user: data ?? null })
}

export default function Screen() {
    const { user } = useLoaderData<LoaderData>()
    return (
        <>
            {user && <h1> {user.email}</h1>}

            <Form method="post">
                <button>Log Out</button>
            </Form>
        </>
    )
}
```
