import chai from 'chai'
import chaiSubset from 'chai-subset'
const expect = chai.expect
chai.use(chaiSubset)

import {setSnippetsDir, defineTags, setLogger} from '../src/index'

let log = []
const logger = {
  error: (_) => log.push(_),
}

describe('wix-snippet', function() {

  beforeEach(() => {
    setSnippetsDir('./test')
    setLogger(logger)
    log = []
  })

  function makeDict() {
    return {
      tags: {},
      defineTag: function(name, tag) {
        this.tags[name] = tag
      }
    }
  }

  it('should register the snippet tag', function() {
    let dictionary = makeDict()

    defineTags(dictionary)

    expect(dictionary.tags).to.have.key('snippet')
    expect(log).to.be.empty
  })

  function makeDoclet() {
    return {
      meta: {
        filename: 'source-file.js'
      }
    }
  }

  function makeTag(withDescription) {
    const tag = {
      originalTitle: 'snippet',
      title: 'snippet',
      text: '[example.js=The example]',
      value: {
        optional: true,
        defaultvalue: 'The example',
        name: 'example.js'
      }
    }
    if (withDescription)
      tag.value.description = 'a description'
    return tag
  }


  it('should read examples from a file', function() {
    let dictionary = makeDict()
    defineTags(dictionary)

    let doclet = makeDoclet()
    let tag = makeTag()
    dictionary.tags['snippet'].onTagged(doclet, tag)

    expect(doclet).to.containSubset({
      examples:
        [ '<caption>The example</caption>\nfunction example() {\n  console.log(\'hi\');\n}']
    })
    expect(log).to.be.empty
  })

  it('should read example with a description', function() {
    let dictionary = makeDict()
    defineTags(dictionary)

    let doclet = makeDoclet()
    let tag = makeTag(true)
    dictionary.tags['snippet'].onTagged(doclet, tag)

    expect(doclet).to.containSubset({
      examples:
        [ '<caption>The example</caption><description>a description</description>\nfunction example() {\n  console.log(\'hi\');\n}']
    })
    expect(log).to.be.empty
  })

  function makeBrokenTag() {
    return {
      originalTitle: 'snippet',
      title: 'snippet',
      text: '[example-broken.js=The example]',
      value: {
        optional: true,
        defaultvalue: 'The example',
        name: 'example-broken.js'
      }
    }
  }

  it('should not break on a missing file', function() {
    let dictionary = makeDict()
    defineTags(dictionary)

    let doclet = makeDoclet()
    let tag = makeBrokenTag()
    dictionary.tags['snippet'].onTagged(doclet, tag)

    expect(doclet).to.not.containSubset({
      examples: []
    })
    expect(log).to.containSubset(['ERROR: The @snippet tag - file \'test/example-broken.js\' not found. File: source-file.js line: 8'])
  })

})
