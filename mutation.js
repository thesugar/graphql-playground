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
