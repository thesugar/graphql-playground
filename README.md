# GraphQL 入門

参考: https://graphql.org/graphql-js/

## コードを書く

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

## Express で GraphQL サーバーを動かす

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

## GraphQL クライアント

GraphQL API には REST API よりも多くの構造が備わっているため、[Relay](https://facebook.github.io/relay/) のような強力なクライアントが用意されている。Relay を使えばバッチ処理やキャッシュ等を自動的に扱うことができる。

`express-graphql` を使えば、GraphQL サーバーをマウントしたエンドポイントに対して **HTTP POST リクエストを送る**だけで、GraphQL クエリを JSON ペイロードの `query` フィールドとして GraphQL に受け渡すことができる。

前章で見たように GraphQL サーバーを `http://localhost:4000/graphql` で動かしており、`{ hello }` という GraphQL クエリを送信したいとする。`curl` を使えば以下のようなコマンドで実現できる。

```sh
curl -X POST \
-H "Content-Type: application/json" \
-d '{"query": "{ hello }"}' \
http://localhost:4000/graphql
```

また、GUI 操作で試したい場合は前章で見た GraphiQL を使ったり、他にも [Insomnia](https://github.com/getinsomnia/insomnia) を使うことで実現できる。

ブラウザからクエリを送るのも簡単にできる:

```js
fetch('/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  body: JSON.stringify({ query: '{ hello }' }),
})
  .then((res) => res.json())
  .then((data) => console.log('data returned: ', data))
```

また、クライアント側で変数を使って GraphQL のクエリを組み上げるのも簡単に行える。**クエリには `$` をプレフィックスとして付したキーワードを用意して、ペイロードには `variables` フィールドを用意**する。

fetch に渡す body の中身だけを書くとイメージは以下のとおり（ここではイメージだけ掴めばよい）:

```js
body: JSON.stringify({
  query: `query RollDice $dice: Int!, $sides: Int) {
        rollDice(numDice: $dice, numSides: $sides)
    }`,
  variables: { dice, sides },
})
```

一般に、Relay のような GraphQL クライアントを使ってセットアップを行うのは少し時間がかかるが、アプリの規模が大きくなるにつれて有力。
ここまでで、単一の文字列を受け取って文字列を返す GraphQL は書くことができた。

## 基本の型

ほとんどのシチュエーションにおいて、行う必要のあることは**GraphQL スキーマ言語を使って API の型を特定すること**。GraphQL スキーマ言語は `buildSchema` 関数に引数として渡される。

GraphQL スキーマ言語は `String`, `Int`, `Float`, `Boolean`, そして `ID` のスカラー型をサポートしている。これらはそのまま使って `buildSchema` 関数に渡すことができる。

**デフォルトではすべての型は nullable** である。**`!` を末尾に付すことで null 禁止** になる。

リスト型を使うには、型を `[]` で囲む。例）`[Int]`: 整数のリスト

それぞれの型は JavaScript にマッピングできる。したがって API から返す値としては JavaScript のプレーンなオブジェクトを書けばいい。

各型を返す API の例は以下のとおり:

```js
// GraphQL スキーマ言語を使ってスキーマを作成する
const schema = buildSchema(`
    type Query {
        hello: String
        quoteOfTheDay: String
        random: Float!
        rollThreeDice: [Int]
    }
`)

// 各 API エンドポイントについて、resolver 関数が rootValue から提供される
const rootValue = {
  hello: () => 'Hello World!',
  quoteOfTheDay: () =>
    Math.random() < 0.5 ? 'Take it easy' : 'Salvation lies within',
  random: () => Math.random(),
  rollThreeDice: () => [1, 2, 3].map((_) => 1 + Math.floor(Math.random() * 6)),
}
```