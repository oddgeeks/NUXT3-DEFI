import { defineNuxtModule } from "@nuxt/kit";
import { version } from "../package.json";
import Git from "simple-git";
import { isDevelopment } from "std-env";

const gitBranch = process.env.BRANCH || process.env.VERCEL_GIT_COMMIT_REF;
const git = Git();

const getGitInfo = async () => {
  const branch = gitBranch || (await git.revparse(["--abbrev-ref", "HEAD"]));
  const commit = await git.revparse(["HEAD"]);
  return { branch, commit };
};

export default defineNuxtModule({
  meta: {
    name: "avocado:build-env",
  },
  async setup(_options, nuxt) {
    const { commit, branch } = await getGitInfo();
    const env = isDevelopment
      ? "dev"
      : branch === "master"
      ? "release"
      : "staging";

    const buildInfo: BuildInfo = {
      version,
      time: +Date.now(),
      commit,
      branch,
      env,
    };

    const node_env = process.env?.ENVIRONMENT || "development";

    nuxt.options.appConfig = nuxt.options.appConfig || {};
    nuxt.options.appConfig.buildInfo = buildInfo;
    nuxt.options.appConfig.node_env = node_env;
    nuxt.options.appConfig.isProd = node_env === "production";
    nuxt.options.runtimeConfig.public.env = env;
  },
});
