const { GraphQLClient } = require('graphql-request')

const client = new GraphQLClient('https://api.github.com/graphql', {
  headers: {
    Authorization: `Bearer ${process.env.GIT_ORG_READONLY}`,
  },
})

const filterContributors = data => {
  if (!data || !data.repository) return []
  const repoObject = data.repository.object
  if (!repoObject || !repoObject.history) return []
  const nodes = repoObject.history.nodes || []
  let users = [], keys = {}
  for (const item of nodes) {
    const key = item.author.user.url
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

const getContributors = async (path, repo) => {
  const query = `query($path: String!, $repo: String!) {
    repository(owner: "zeit-ui", name: $repo) {
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
    path, repo,
  })
  return filterContributors(data)
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(403).send({ message: 'only support GET.' })
  const path = req.query.path
  const repo = req.query.repo || 'react'
  if (!path) return res.status(204).send([])
  
  try {
    const users = await getContributors(path, repo)
    return res.status(200).send(users)
  } catch (e) {
    return res.status(204).send([])
  }
  
}
