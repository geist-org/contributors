import { Handler } from '@netlify/functions'
import { GraphQLClient } from 'graphql-request'

const client = new GraphQLClient('https://api.github.com/graphql', {
  headers: {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  },
})

export type RepositoryHistory = {
  author: {
    name: string
    user: {
      url: string
      avatarUrl: string
    }
  }
}

export type RepositoryResult = {
  repository: {
    object: {
      history: {
        nodes: Array<RepositoryHistory>
      }
    }
  }
}

const filterContributors = (data: RepositoryResult) => {
  if (!data || !data.repository) return []
  const repoObject = data.repository.object
  if (!repoObject || !repoObject.history) return []
  const nodes = repoObject.history.nodes || []
  let users = [],
    keys: Record<string, string | number> = {}
  for (const item of nodes) {
    const key: string = item.author.user.url
    if (!keys[key]) {
      keys[key] = 1
      users.push({
        name: item.author.name,
        avatar: item.author.user.avatarUrl,
        url: item.author.user.url,
      })
    }
  }
  return users
}

const getContributors = async (path: string, repo: string) => {
  const query = `query($path: String!, $repo: String!) {
    repository(owner: "geist-org", name: $repo) {
      object(expression: "master") {
        ... on Commit {
          history(first: 100, path: $path) {
            nodes {
              author {
                name
                user {
                  avatarUrl
                  url
                }
              }
            }
          }
        }
      }
    }
  }`
  const data = await client.request(query, {
    path,
    repo,
  })
  return filterContributors(data)
}

const empty = {
  statusCode: 204,
  body: JSON.stringify([]),
}
export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'GET') return empty

  const path = event.queryStringParameters?.path
  const repo = event.queryStringParameters?.repo || 'geist-ui'
  if (!path) return empty

  try {
    const users = await getContributors(path, repo)
    return { statusCode: 200, body: JSON.stringify(users) }
  } catch (e) {
    return empty
  }
}
