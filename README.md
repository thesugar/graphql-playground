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

## 引数を渡す

REST API と同様に、GraphQL のエンドポイントに引数を渡すというのはよくあること。スキーマ言語の中で引数を定めておけば、自動的に型チェックを行ってくれる。

それぞれの引数は名前がつけられ、かつ、型を持っている必要がある。

たとえば、上記の「基本の型」の章で以下の `rollThreeDice` というエンドポイントを作った:

```gql
type Query {
  rollThreeDice: [Int]
}
```

これは 3 (three) がハードコードされてしまっている（サイコロの個数が 3 個に限定されている）ので、より一般的に `numDice` 個のサイコロを振るようなエンドポイントを作りたい。
また、サイコロの面の数も（6 面に限定せず）一般化して、`numSides` 面を持っているサイコロとする。
GraphQL スキーマ言語に引数を追加することでそれが実現できる:

```gql
type Query {
  rollDice(numDice: Int!, numSides: Int): [Int]
}
```

すでに説明したとおり `Int!` の `!` は non-nullable を示している。つまり、こう書くことでそれ以上の（non-null チェックの）バリデーションロジックを簡略化できるということである。
`numSides` は nullable にして、デフォルト値として 6 を取るようにする。

ここまでは、resolver 関数は引数を取らないものばかりだった (`() => ...`)。resolver が引数を取るとき、それらは単一の "args" オブジェクトの形で、第一引数として渡される。したがって rollDice resolver の実装は以下のようになる:

```js
const rootValue = {
  rollDice: ({ numDice, numSides }) =>
    [...Array(numDice).keys()].map(
      (_) => 1 + Math.floor(Math.random() * (numSides || 6))
    ),
}
```

API をコールするときは、それぞれの引数を名前付きで渡す必要がある。5 個の 10 面ダイスを振るという GraphQL クエリは以下のように発行できる:

```gql
{
  rollDice(numDice: 5, numSides: 10)
}
```

ここで numDice を省略すると、numDice は null 禁止なのでエラーになる。numSides は nullable としているので省略可。

上記の API コールは GraphiQL からの操作の想定。クライアント側のコードから API コールするときはクエリストリングを使わずに `$` プレフィックス（`${}` ではない）をつけたクエリ本体と、`variables` オプション（オブジェクトのプロパティ）として渡す。
そうすることで `variables` で定めた値が query 内で定めた変数にマッピングされる。

```js
const dice = 5
const sides = 10

const query = `query RollDice($dice: Int!, $sides: Int) {
  rollDice(numDice: $dice, numSides: $sides)
}`

fetch('/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  body: JSON.stringify({
    query, // 👈 つまり query: `query RollDice($dice: Int, $sides: Int) { ... }` という形
    variables: { dice, sides }, // 👈 ここで変数を指定
  }),
})
  .then((res) => res.json())
  .then((data) => console.log('data returned', data))
```

## オブジェクト型 (Object Types)

多くの場合、API から単一の数字や文字列を返したいということはなく、ある程度複雑なオブジェクトを返したいということがほとんどだろう。

GraphQL スキーマ言語では、これまでの例で `Query` 型を定義したのと同じように新たなオブジェクト型を定義できる（buildSchema に渡す）。

それぞれのオブジェクトは、特定の型を返すフィールドや引数を受け付けるメソッドを持つことができる。

たとえば、「引数を渡す」の章では以下のようなランダムにサイコロを振るメソッドを作成した:

```gql
type Query {
  rollDice(numDice: Int!, numSides: Int): [Int]
}
```

このサイコロに基づくメソッドがもっと欲しくなったとき、`RandomDie` オブジェクト型を用意することでそれを実装できる。

```gql
type RandomDie {
  roll(numRolls: Int!): [Int]
}

type Query {
  getDie(numSides: Int): RandomDie
}
```

root-level で `RandomDie` 型に対する resolver を定義する方法（※）ではなく、ES6 の class を使うこともできる。

```js
class RandomDie {
  constructor(numSides) {
    this.numSides = numSides
  }

  rollOnce() {
    return 1 + Math.floor(Math.random() * this.numSides)
  }

  roll({ numRolls }) {
    return [...Array(numRolls).keys()].map((_) => this.rollOnce())
  }
}

const root = {
  getDie: ({ numSides }) => new RandomDie(numSides || 6),
}
```

引数を取らないフィールドは、オブジェクトのプロパティを使っても、あるいはインスタンスメソッドを使ってもよい。
（上のコードの例では constructor の中で `this.rollOnce = 1 + Math.floor(Math.random() * this.numSides)` と書くこともできるよねということ、か？
ただしこの場合 roll({3}) などとリクエストすると 3 回とも同じ目が出てしまう（からこの場合は不適だけど、実装としてはどっちでもいけるよということ？）。）

上記のコード例で言えば、`numSides` と `rollOnce` の両方についてオブジェクトのフィールドで定義できる（rollOnce はメソッド的な意味を持つが）。

```gql
type RandomDie {
  numSides: Int!
  rollOnce: Int!
  roll(numRolls: Int!): [Int]
}

type Query {
  getDie(numSides: Int): RandomDie
}
```

---

（※）「root-level で resolver を定義する方法」とは以下のような形だと思われる。

```js
const rootValue = {
  getDie: ({ numSides }) => ({
    numSides,
    rollOnce: 1 + Math.floor(Math.random() * numSides),
    roll: ({ numRolls }) =>
      [...Array(numRolls).keys()].map(
        (_) => 1 + Math.floor(Math.random() * numSides)
      ),
  }),
}
```

個人的には class 使うよりもこっちの方がわかりやすい。

---

このようにオブジェクト型を定義することは伝統的な REST API よりも優れているということが往々にしてある。
あるオブジェクトに関する基本的な情報を取得するために 1 つの API を叩き、続けて、そのオブジェクトについてさらに別の情報を得るために API リクエストを送るということ（← REST API）をせずに、一回の API リクエストですべての情報を得られる（← GraphQL）のである。

これにより帯域幅を節約でき、アプリケーションがより速くなり、また、クライアント側のロジックがシンプルになる。

ここまでで見てきた API はすべてデータを返却する設計になっていた。ストアされたデータを書き換えたり複雑な入力に対応するためには、「ミューテーションとインプットタイプ」を学ぼう（次章以降）。

## Mutation と Input Type

データを加工したり DB にインサートしたりすでに DB に存在するデータに変更を加えるような API を作る場合、`Query` ではなく `Mutation` エンドポイントを用意する必要がある。

トップレベルに `Query` 型を定義したのと同様にトップレベルに `Mutation` 型を定義すればよい。

たとえば、「今日の一言」を表示するサーバーがあったとして、誰でも一言を更新でき、誰でも現在の一言を読むことができるものとしよう。

GraphQL スキーマは以下のようになる:

```gql
type Mutation {
  setMessage(message: String): String
}

type Query {
  getMessage: String
}
```

DB の create や update にマッピングされる mutation は、サーバーがストアした値を返すように作っておくと便利。そうすることで、サーバーでデータをヘンクしたら、クライアントでもその変更があったことがわかる。

mutation も query も root の resolver によって取り扱われる。その実装は以下のようなものとなる:

```js
const fakeDB = {}
const root = {
  setMessage: ({ message }) => {
    faleDB.message = message
    return message
  },
  getMessage: () => {
    return fakeDB.message
  }
}
```

mutation を実装するのにこれ以上のものは不要。しかし多くの場合、同じ入力パラメータを取る複数の mutation を目にすることがあるだろう。
よくある例としては、DB にオブジェクトを新規作成するときと、DB の中のオブジェクトを更新するときにまったく同じパラメータを受け付けるというようなものだ。

スキーマをシンプルにするために、こんなときには "input types" が使える。`type` キーワードの代わりに `input` キーワードを使えばよい。


例えば、「今日の一言」の例では、一つのメッセージではなくたくさんのメッセージを扱えるようにすると考えよう。
`id` フィールドによって DB にインデックスを張り、各メッセージが `content` という文字列と `author` という文字列を持つとする。
新しいメッセージの作成と古いメッセージの更新を行える mutation API がほしい。その場合以下のようなスキーマになる:

```gql
input MessageInput {
  content: String
  author: String
}

type Message {
  id: ID!
  content: String
  author: String
}

type Query {
  getMessage(id: ID!): Message
}

type Mutation {
  createMessage(input: MessageInput): Message
  updateMessage(id: ID!, input: MessageInput): Message
}
```

ここで、2 つの mutation は `Message` 型を返すようにしているので、クライアント側は mutation リクエストの結果を見るだけで、新たに変更が加えられた `Message` についての情報を得ることができる。

input type には他のオブジェクト型を含めることはでいず、基本的なスカラー型やリスト型、他の input type のみを含めることができる。

input types の名前の最後に `Input` と付けるのは便利な慣習である。というのも、一つの概念的なオブジェクトに対して、微妙に異なる入力型と出力型の両方が必要になることが多いからである。

上記まで見てきた例のサンプルコードは以下:

```js
import express from 'express'
import { graphqlHTTP } from 'express-graphql'
import { buildSchema } from 'graphql'
import crypto from 'crypto'

const schema = buildSchema(`
  input MessageInput {
      content: String
      author: String
  }

  type Message {
      id: ID!
      content: String
      author: String
  }

  type Query {
      getMessage(id: ID!): Message
  }

  type Mutation {
      createMessage(input: MessageInput): Message
      updateMessage(id: ID!, input: MessageInput): Message
  }
`)

// class Message {
//   constructor(id, { content, author }) {
//     this.id = id
//     this.content = content
//     this.author = author
//   }
// }
// ↓と同じはず

const message = (id, { content, author }) => ({
  id,
  content,
  author,
})

const db = new Map() // fake database

const root = {
  getMessage: ({ id }) => {
    const value = db.get(id)
    if (value === undefined) {
      throw new Error('no message exists with id ' + id)
    }
    return message(id, value)
  },
  createMessage: ({ input }) => {
    const id = crypto.randomBytes(10).toString('hex')
    db.set(id, input)
    return message(id, input)
  },
  updateMessage: ({ id, input }) => {
    const value = db.get(id)
    if (value === undefined) {
      throw new Error('no message exists with id ' + id)
    }
    db.set(id, input)
    return message(id, value)
  },
}

const app = express()
app.use(
  '/graphql',
  graphqlHTTP({
    schema,
    rootValue: root,
    graphiql: true,
  })
)

const PORT = 4000
app.listen(PORT, () => {
  console.log(`Running a GraphQL API server at localhost:${PORT}/graphql`)
})
```

mutation を行うには、GraphQL クエリの前に `mutation` キーワードをつける必要がある。引数としては input 型のオブジェクトを渡す。
また、クエリの最後に `{ id }` のように書くことでレスポンスの内容を確認できる。

```gql
mutation {
  createMessage(input: {
    author: "John",
    content: "hope is a good thing.",
  }) {
    id  # 新しく生成された message の id を確認できる
    # ここに author などと書けば他の情報も取得できる
  }
}
```

今までと同様、クライアントからコードを使ってコールするときは変数を利用できる。

```js
const author = 'Noel'
const content = 'Today is gonna be the day'
const query = `
  mutation CreateMessage($input: MessageInput) {
    createMessage(input: $input) {
      id
    }
  }
`

fetch('/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  body: JSON.stringify({
    query,
    variables: {
      input: {
        author,
        content,
      }
    }
  })
})
  .then(res => res.json())
  .then(data => console.log('data returned', data))
```

mutation を伴うオペレーションには、新しいユーザーのサインアップのような、ユーザー情報の更新がある。
GraphQL の mutation を実装することもできるが、既存のライブラリを活用することも可能である。