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

