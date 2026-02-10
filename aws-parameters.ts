/**
 * Bid-Master Marketing - AWS Parameter Store Integration
 * 
 * Security-first secrets management using AWS Systems Manager Parameter Store.
 * Supports both SecureString (encrypted) and String parameters.
 * 
 * Parameter Naming Convention:
 * /bidmaster/marketing/{environment}/{parameter-name}
 * 
 * Examples:
 * /bidmaster/marketing/production/sanity-project-id
 * /bidmaster/marketing/production/resend-api-key (SecureString)
 * /bidmaster/marketing/production/gemini-api-key (SecureString)
 */

import {
  SSMClient,
  GetParameterCommand,
  GetParametersCommand,
  GetParametersByPathCommand,
  PutParameterCommand,
  Parameter,
} from '@aws-sdk/client-ssm'

// =============================================================================
// CONFIGURATION
// =============================================================================

const AWS_REGION = process.env.AWS_REGION || 'us-east-1'
const ENVIRONMENT = process.env.NODE_ENV === 'production' ? 'production' : 'development'
const PARAMETER_PREFIX = `/bidmaster/marketing/${ENVIRONMENT}`

// Parameter definitions with metadata
export const PARAMETERS = {
  // Sanity CMS
  SANITY_PROJECT_ID: {
    name: 'sanity-project-id',
    secure: false,
    required: true,
    public: true, // Safe to expose to client
  },
  SANITY_DATASET: {
    name: 'sanity-dataset',
    secure: false,
    required: true,
    public: true,
  },
  SANITY_API_VERSION: {
    name: 'sanity-api-version',
    secure: false,
    required: false,
    default: '2024-01-01',
    public: true,
  },
  SANITY_API_TOKEN: {
    name: 'sanity-api-token',
    secure: true,
    required: true,
    public: false,
  },

  // Email (Resend)
  RESEND_API_KEY: {
    name: 'resend-api-key',
    secure: true,
    required: true,
    public: false,
  },
  RESEND_AUDIENCE_ID: {
    name: 'resend-audience-id',
    secure: false,
    required: false,
    public: false,
  },

  // AI (Gemini)
  GEMINI_API_KEY: {
    name: 'gemini-api-key',
    secure: true,
    required: true,
    public: false,
  },

  // SAM.gov
  SAM_API_KEY: {
    name: 'sam-api-key',
    secure: true,
    required: false,
    public: false,
  },

  // Social Media
  LINKEDIN_ACCESS_TOKEN: {
    name: 'linkedin-access-token',
    secure: true,
    required: false,
    public: false,
  },
  LINKEDIN_ORG_ID: {
    name: 'linkedin-org-id',
    secure: false,
    required: false,
    public: false,
  },

  // Analytics
  POSTHOG_KEY: {
    name: 'posthog-key',
    secure: false,
    required: false,
    public: true,
  },
  POSTHOG_HOST: {
    name: 'posthog-host',
    secure: false,
    required: false,
    default: 'https://app.posthog.com',
    public: true,
  },

  // App Integration
  APP_URL: {
    name: 'app-url',
    secure: false,
    required: false,
    default: 'https://app.bidmaster.com',
    public: true,
  },
  APP_REDIRECT_SECRET: {
    name: 'app-redirect-secret',
    secure: true,
    required: false,
    public: false,
  },
} as const

export type ParameterKey = keyof typeof PARAMETERS

// =============================================================================
// SSM CLIENT
// =============================================================================

let ssmClient: SSMClient | null = null

function getSSMClient(): SSMClient {
  if (!ssmClient) {
    ssmClient = new SSMClient({
      region: AWS_REGION,
      // Credentials are automatically loaded from:
      // 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
      // 2. IAM role (when running on AWS infrastructure)
      // 3. AWS credentials file (~/.aws/credentials)
    })
  }
  return ssmClient
}

// =============================================================================
// PARAMETER OPERATIONS
// =============================================================================

/**
 * Get a single parameter from Parameter Store
 */
export async function getParameter(key: ParameterKey): Promise<string | null> {
  const config = PARAMETERS[key]
  const parameterName = `${PARAMETER_PREFIX}/${config.name}`

  try {
    const client = getSSMClient()
    const command = new GetParameterCommand({
      Name: parameterName,
      WithDecryption: config.secure,
    })

    const response = await client.send(command)
    return response.Parameter?.Value || config.default || null
  } catch (error: any) {
    if (error.name === 'ParameterNotFound') {
      if (config.required) {
        console.error(`Required parameter not found: ${parameterName}`)
        throw new Error(`Missing required parameter: ${key}`)
      }
      return config.default || null
    }
    throw error
  }
}

/**
 * Get multiple parameters at once (more efficient)
 */
export async function getParameters(keys: ParameterKey[]): Promise<Record<ParameterKey, string | null>> {
  const parameterNames = keys.map((key) => `${PARAMETER_PREFIX}/${PARAMETERS[key].name}`)
  const secureParams = keys.filter((key) => PARAMETERS[key].secure)

  try {
    const client = getSSMClient()
    const command = new GetParametersCommand({
      Names: parameterNames,
      WithDecryption: secureParams.length > 0,
    })

    const response = await client.send(command)
    const result: Record<string, string | null> = {}

    // Map response back to keys
    for (const key of keys) {
      const paramName = `${PARAMETER_PREFIX}/${PARAMETERS[key].name}`
      const param = response.Parameters?.find((p) => p.Name === paramName)
      result[key] = param?.Value || PARAMETERS[key].default || null
    }

    // Check for missing required parameters
    const invalidParams = response.InvalidParameters || []
    for (const invalidName of invalidParams) {
      const key = keys.find((k) => `${PARAMETER_PREFIX}/${PARAMETERS[k].name}` === invalidName)
      if (key && PARAMETERS[key].required) {
        throw new Error(`Missing required parameter: ${key}`)
      }
    }

    return result as Record<ParameterKey, string | null>
  } catch (error) {
    console.error('Failed to fetch parameters:', error)
    throw error
  }
}

/**
 * Get all parameters under the prefix (for initialization)
 */
export async function getAllParameters(): Promise<Record<string, string>> {
  const client = getSSMClient()
  const result: Record<string, string> = {}
  let nextToken: string | undefined

  do {
    const command = new GetParametersByPathCommand({
      Path: PARAMETER_PREFIX,
      Recursive: true,
      WithDecryption: true,
      NextToken: nextToken,
    })

    const response = await client.send(command)

    for (const param of response.Parameters || []) {
      if (param.Name && param.Value) {
        // Extract key name from full path
        const keyName = param.Name.replace(`${PARAMETER_PREFIX}/`, '')
        result[keyName] = param.Value
      }
    }

    nextToken = response.NextToken
  } while (nextToken)

  return result
}

/**
 * Set a parameter (for setup scripts)
 */
export async function setParameter(
  key: ParameterKey,
  value: string,
  description?: string
): Promise<void> {
  const config = PARAMETERS[key]
  const parameterName = `${PARAMETER_PREFIX}/${config.name}`

  const client = getSSMClient()
  const command = new PutParameterCommand({
    Name: parameterName,
    Value: value,
    Type: config.secure ? 'SecureString' : 'String',
    Overwrite: true,
    Description: description || `Bid-Master Marketing: ${key}`,
    Tags: [
      { Key: 'Application', Value: 'bidmaster-marketing' },
      { Key: 'Environment', Value: ENVIRONMENT },
      { Key: 'ManagedBy', Value: 'automation' },
    ],
  })

  await client.send(command)
  console.log(`Parameter set: ${parameterName}`)
}

// =============================================================================
// CACHING LAYER
// =============================================================================

interface CacheEntry {
  value: string | null
  expiresAt: number
}

const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Get parameter with caching (for performance)
 */
export async function getCachedParameter(key: ParameterKey): Promise<string | null> {
  const cacheKey = `param:${key}`
  const cached = cache.get(cacheKey)

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value
  }

  const value = await getParameter(key)

  cache.set(cacheKey, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  })

  return value
}

/**
 * Clear the parameter cache
 */
export function clearParameterCache(): void {
  cache.clear()
}

// =============================================================================
// ENVIRONMENT VARIABLE FALLBACK
// =============================================================================

/**
 * Get parameter with environment variable fallback
 * Useful for local development without AWS access
 */
export async function getParameterWithFallback(
  key: ParameterKey,
  envVarName?: string
): Promise<string | null> {
  // Check environment variable first (for local dev)
  const envVar = envVarName || key
  const envValue = process.env[envVar]

  if (envValue) {
    return envValue
  }

  // Try Parameter Store
  try {
    return await getCachedParameter(key)
  } catch (error) {
    console.warn(`Failed to get parameter ${key} from AWS, no fallback available`)
    return PARAMETERS[key].default || null
  }
}

// =============================================================================
// INITIALIZATION HELPER
// =============================================================================

export interface SecretsConfig {
  sanity: {
    projectId: string
    dataset: string
    apiVersion: string
    token?: string
  }
  resend: {
    apiKey?: string
    audienceId?: string
  }
  gemini: {
    apiKey?: string
  }
  posthog: {
    key?: string
    host: string
  }
  app: {
    url: string
    redirectSecret?: string
  }
}

/**
 * Load all secrets into a typed configuration object
 */
export async function loadSecretsConfig(): Promise<SecretsConfig> {
  const params = await getParameters([
    'SANITY_PROJECT_ID',
    'SANITY_DATASET',
    'SANITY_API_VERSION',
    'SANITY_API_TOKEN',
    'RESEND_API_KEY',
    'RESEND_AUDIENCE_ID',
    'GEMINI_API_KEY',
    'POSTHOG_KEY',
    'POSTHOG_HOST',
    'APP_URL',
    'APP_REDIRECT_SECRET',
  ])

  return {
    sanity: {
      projectId: params.SANITY_PROJECT_ID!,
      dataset: params.SANITY_DATASET!,
      apiVersion: params.SANITY_API_VERSION || '2024-01-01',
      token: params.SANITY_API_TOKEN || undefined,
    },
    resend: {
      apiKey: params.RESEND_API_KEY || undefined,
      audienceId: params.RESEND_AUDIENCE_ID || undefined,
    },
    gemini: {
      apiKey: params.GEMINI_API_KEY || undefined,
    },
    posthog: {
      key: params.POSTHOG_KEY || undefined,
      host: params.POSTHOG_HOST || 'https://app.posthog.com',
    },
    app: {
      url: params.APP_URL || 'https://app.bidmaster.com',
      redirectSecret: params.APP_REDIRECT_SECRET || undefined,
    },
  }
}