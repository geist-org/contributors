## Contributors

Get contributors to each file in organization ZEIT UI.

<br/>

### APIs

#### Get contributors by file-path

Params:

```
{
  path: '/api/users',
  method: 'GET',
  query: {
    path: '#FILE PATH',
    repo: '#REPO',        // default 'react'
  },
}
```

Result:

```ts
Array<{
  name: string
  avatar: string
  url: string
}>
```

<br/>

### License

[MIT](LICENSE)
