## GraphQL 入門

参考: https://graphql.org/graphql-js/

### コードを書く

GraphQL のクエリを扱うには以下が必要。

- `Query` という type を定義するスキーマ
- "resolver" と呼ばれる関数をそれぞれの API エンドポイントに対して備えた API root

"Hello World!" という文字を返す API を作成するには、以下のようなコードを書けばよい:

```js
// server.js
import { graphql, buildSchema } from 'graphql'

// GraphQL スキーマ言語を使ってスキーマを作成する
const schema = buildSchema(`
    type Query {
        hello: String
    }`)

// 各 API エンドポイントについて、resolver 関数が rootValue から提供される
const rootValue = {
  hello: () => 'Hello World!',
}

// '{ hello }' という GraphQL のクエリを実行し、レスポンスを出力する
graphql({
  schema,
  source: '{ hello }',
  rootValue,
}).then((res) => console.log(res))
```

そして `node server.js` を実行することで以下の出力を得られる。

```sh
{ data: [Object: null prototype] { hello: 'Hello World!' } }
```

### Express で GraphQL サーバーを動かす

```js
import express from 'express'
import { graphqlHTTP } from 'express-graphql'
import { buildSchema } from 'graphql'

// GraphQL スキーマ言語を使ってスキーマを作成する
const schema = buildSchema(`
    type Query {
        hello: String
    }`)

// 各 API エンドポイントについて、resolver 関数が rootValue から提供される
const rootValue = {
  hello: () => 'Hello World!',
}

// ☝️☝️ ここまでは先ほどと同じ（import 部分以外）☝️☝️

const app = express()
app.use(
  '/graphql',
  // ↓先ほど graphql({...}) としていた部分と中身（引数として渡すオブジェクト）はほぼ同じだが app.use の中で graphqlHTTP を使う
  graphqlHTTP({
    schema,
    rootValue,
    graphiql: true,
  })
)

const PORT = 4000
app.listen(PORT)
console.log(`Running a GraphQL API server at http://localhost:${PORT}/graphql`)
```

`node server.js` で GraphQL サーバーが立ち上がる。
`graphiql` オプションを true にしたので、GraphiQL ツールを使って GraphQL クエリを手ずから発行できる。

<img src="https://graphql.org/img/hello.png" alt="graphiQL">