import { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "https://api.linear.app/graphql",
  documents: ["src/**/*.gql", "!src/__generated"],
  generates: {
    "./src/__generated__/graphql-operations.ts": {
      plugins: ["typescript", "typescript-operations", "typescript-graphql-request"],
    },
  },
};

export default config;
