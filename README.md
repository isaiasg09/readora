# Readora

This app is an AI-powered README generator for projects.
It helps developers create clean and professional `README.md` files for their projects in seconds.

Users can describe their project, features, technologies, and setup instructions, and Readora automatically generates a complete README ready to use on GitHub.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, clone git repository to local with:

```bash
git clone https://github.com/isaiasg09/readora.git
cd readora
```

Second, install dependencies:

```bash
npm install
```

Configure environment variables by creating a .env file in the root directory:

```env
GROQ_API_KEY=your_api_key
```

Generate the Prisma client:

```bash
npx prisma generate
```

Push the database schema:

```bash
npx prisma db push
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
