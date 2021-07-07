const chai = require('chai')
const expect = chai.expect
const fs = require('fs')
const tmp = require('tmp-promise')
tmp.setGracefulCleanup()

const proxyquire = require('proxyquire').noCallThru()
const sinon = require('sinon')

const writeTempConfigFile = (content) => {
  const { name: tempFilePath } = tmp.fileSync()
  fs.writeFileSync(tempFilePath, content)
  return tempFilePath
}

describe('config file unit tests', function () {
  const sinonSandbox = sinon.createSandbox()
  afterEach(() => {
    sinonSandbox.restore()
  })

  let ecpStub, localStub, validateStub
  let docworksCliWithStubs
  beforeEach(() => {
    ecpStub = sinonSandbox.stub().returns(Promise.resolve())
    localStub = sinonSandbox.stub().returns(Promise.resolve())
    validateStub = sinonSandbox.stub().returns(true)
    docworksCliWithStubs = proxyquire('../src/docworks', {
      './extract-compare-push': ecpStub,
      './local-docworks': localStub,
      './validate': validateStub,
    })
  })

  const execDocworks = async (commandLineArgs) => {
    sinonSandbox
      .stub(process, 'argv')
      .value(`node docworks ${commandLineArgs}`.split(' '))
    return docworksCliWithStubs()
  }

  describe('ecp mode (extract compare push)', function () {
    it('should use options from the given configuration file', async function () {
      const configFilePath = writeTempConfigFile(`
          module.exports = {
              remote: 'test-remote-url',
              branch: 'test-branch',
              project: 'test-project',
              sources: ['test-source1', 'test-source2'],
              excludes: 'test-excludes',
              pattern: '.*.test',
              ed: 'test-enrichments-dir',
              dryrun: true,
          }
          `)

      await execDocworks(`ecp --config ${configFilePath}`)

      expect(ecpStub.calledOnce).to.be.true
      expect(ecpStub.firstCall.args).to.be.deep.equal([
        {
          remoteRepo: 'test-remote-url',
          remoteBranch: 'test-branch',
          projectSubdir: 'test-project',
          jsDocSources: {
            include: ['test-source1', 'test-source2'],
            includePattern: '.*.test',
            exclude: ['test-excludes'],
          },
          enrichmentDocsDir: 'test-enrichments-dir',
          plugins: [],
          dryrun: true,
          workingDir: ecpStub.firstCall.args[0].workingDir, // duh
        },
      ])
    })

    it('should allow overwriting params from the command line', async function () {
      const configFilePath = writeTempConfigFile(`
          module.exports = {
              remote: 'test-remote-url',
              branch: 'test-branch',
              project: 'test-project',
              sources: ['test-source1', 'test-source2'],
              excludes: 'test-excludes',
              pattern: '.*.test',
              ed: 'test-enrichments-dir',
              dryrun: true,
          }
          `)

      await execDocworks(
        `ecp --config ${configFilePath} --branch command-line-branch --dryrun 0`
      )

      expect(ecpStub.calledOnce).to.be.true
      expect(ecpStub.firstCall.args).to.be.deep.equal([
        {
          remoteRepo: 'test-remote-url',
          remoteBranch: 'command-line-branch',
          projectSubdir: 'test-project',
          jsDocSources: {
            include: ['test-source1', 'test-source2'],
            includePattern: '.*.test',
            exclude: ['test-excludes'],
          },
          enrichmentDocsDir: 'test-enrichments-dir',
          plugins: [],
          dryrun: false,
          workingDir: ecpStub.firstCall.args[0].workingDir, // duh
        },
      ])
    })
  })

  describe('local mode', function () {
    it('should use options from the given configuration file', async function () {
      const configFilePath = writeTempConfigFile(`
          module.exports = {
              remote: 'test-remote-url',
              branch: 'test-branch',
              project: 'test-project',
              sources: ['test-source1', 'test-source2'],
              excludes: 'test-excludes',
              pattern: '.*.test',
              ed: 'test-enrichments-dir',
              dist: 'test-dist-folder',
              dryrun: true,
          }
          `)

      await execDocworks(`local --config ${configFilePath}`)

      expect(localStub.calledOnce).to.be.true
      expect(localStub.firstCall.args).to.be.deep.equal([
        {
          remoteRepo: 'test-remote-url',
          branch: 'test-branch',
          outputDirectory: 'test-dist-folder',
          projectDir: 'test-project',
          jsDocSources: {
            include: ['test-source1', 'test-source2'],
            includePattern: '.*.test',
            exclude: ['test-excludes'],
          },
          enrichmentDocsDir: 'test-enrichments-dir',
          plugins: [],
          dryrun: true,
          tmpDir: localStub.firstCall.args[0].tmpDir, // duh,
        },
      ])
    })

    it('should allow overwriting params from the command line', async function () {
      const configFilePath = writeTempConfigFile(`
          module.exports = {
              remote: 'test-remote-url',
              branch: 'test-branch',
              project: 'test-project',
              sources: ['test-source1', 'test-source2'],
              excludes: 'test-excludes',
              pattern: '.*.test',
              ed: 'test-enrichments-dir',
              dist: 'test-dist-folder',
              dryrun: true,
          }
          `)

      await execDocworks(
        `local --config ${configFilePath} --dist command-line-dist-folder --branch master`
      )

      expect(localStub.calledOnce).to.be.true
      expect(localStub.firstCall.args).to.be.deep.equal([
        {
          remoteRepo: 'test-remote-url',
          branch: 'master',
          outputDirectory: 'command-line-dist-folder',
          projectDir: 'test-project',
          jsDocSources: {
            include: ['test-source1', 'test-source2'],
            includePattern: '.*.test',
            exclude: ['test-excludes'],
          },
          enrichmentDocsDir: 'test-enrichments-dir',
          plugins: [],
          dryrun: true,
          tmpDir: localStub.firstCall.args[0].tmpDir, // duh,
        },
      ])
    })
  })

  describe('validate mode', function () {
    it('should use options from the given configuration file', async function () {
      const configFilePath = writeTempConfigFile(`
          module.exports = {
              remote: 'test-remote-url',
              branch: 'test-branch',
              project: 'test-project',
              sources: ['test-source1', 'test-source2'],
              excludes: 'test-excludes',
              pattern: '.*.test',
              ed: 'test-enrichments-dir',
              dryrun: true,
          }
          `)

      await execDocworks(`validate --config ${configFilePath}`)

      expect(validateStub.calledOnce).to.be.true
      expect(validateStub.firstCall.args).to.be.deep.equal([
        {
          include: ['test-source1', 'test-source2'],
          includePattern: '.*.test',
          exclude: ['test-excludes'],
        },
        [],
      ])
    })

    it('should allow overwriting params from the command line', async function () {
      const configFilePath = writeTempConfigFile(`
          module.exports = {
              remote: 'test-remote-url',
              branch: 'test-branch',
              project: 'test-project',
              sources: ['test-source1', 'test-source2'],
              excludes: 'test-excludes',
              pattern: '.*.test',
              ed: 'test-enrichments-dir',
              dryrun: true,
          }
          `)

      await execDocworks(
        `validate --config ${configFilePath} --sources command-line-source1 --sources command-line-source2`
      )

      expect(validateStub.calledOnce).to.be.true
      expect(validateStub.firstCall.args).to.be.deep.equal([
        {
          include: ['command-line-source1', 'command-line-source2'],
          includePattern: '.*.test',
          exclude: ['test-excludes'],
        },
        [],
      ])
    })
  })
})
