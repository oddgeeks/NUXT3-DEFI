import { defineNuxtModule } from '@nuxt/kit'
import { version } from '../package.json'
import Git from 'simple-git'

const gitBranch = process.env.BRANCH || process.env.VERCEL_GIT_BRANCH
const git = Git()

const getGitInfo = async () => {
  const branch = gitBranch || await git.revparse(['--abbrev-ref', 'HEAD'])
  const commit = await git.revparse(['HEAD'])
  return { branch, commit }
}


export default defineNuxtModule({
  meta: {
    name: 'avocado:build-env',
  },
  async setup(_options, nuxt) {
    const {  commit, branch } = await getGitInfo()
    const buildInfo: BuildInfo = {
      version,
      time: +Date.now(),
      commit,
      branch,
    }

    nuxt.options.appConfig = nuxt.options.appConfig || {}
    nuxt.options.appConfig.buildInfo = buildInfo
  },
})