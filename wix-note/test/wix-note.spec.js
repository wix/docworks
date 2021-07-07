import chai from 'chai'
import chaiSubset from 'chai-subset'
const expect = chai.expect
chai.use(chaiSubset)

import {defineTags, extendDocworksService, docworksMergeService} from '../src/index'

describe('wix-note', function() {

  function makeDict() {
    return {
      tags: {},
      defineTag: function(name, tag) {
        this.tags[name] = tag
      }
    }
  }

  function makeDoclet() {
    return {
      meta: {
        filename: 'source-file.js'
      }
    }
  }

  function makeTag() {
    return {
      originalTitle: 'note',
      title: 'note',
      text: 'this is a note',
      value: 'this is a note'
    }
  }

  it('should register the snippet tag', function() {
    let dictionary = makeDict()

    defineTags(dictionary)

    expect(dictionary.tags).to.have.key('note')
  })

  it('should copy note from tag to doclet', function() {
    let dictionary = makeDict()
    defineTags(dictionary)

    let doclet = makeDoclet()
    let tag = makeTag()
    dictionary.tags['note'].onTagged(doclet, tag)

    expect(doclet).to.containSubset({
      notes:
        ['this is a note']
    })
  })

  it('should extract notes from doclet', function() {
    let notes = extendDocworksService({notes: ['a', 'b']})
    expect(notes).to.containSubset({extraValue: ['a', 'b']})
  })

  describe('merge', function() {
    it('should report no change if no notes', function() {
      let mergeResult = docworksMergeService(undefined, undefined)
      expect(mergeResult.value).to.be.undefined
      expect(mergeResult.changed).to.be.false
    })

    it('should report no change if notes did not change', function() {
      let mergeResult = docworksMergeService(['a', 'b'], ['a', 'b'])
      expect(mergeResult.value).to.containSubset(['a', 'b'])
      expect(mergeResult.changed).to.be.false
    })

    it('should report change if notes added', function() {
      let mergeResult = docworksMergeService(['a', 'b'], undefined)
      expect(mergeResult.value).to.containSubset(['a', 'b'])
      expect(mergeResult.changed).to.be.true
    })

    it('should report changed if notes removed', function() {
      let mergeResult = docworksMergeService(undefined, ['a', 'b'])
      expect(mergeResult.value).to.be.undefined
      expect(mergeResult.changed).to.be.true
    })

    it('should report change notes changed', function() {
      let mergeResult = docworksMergeService(['a', 'c'], ['a', 'b'])
      expect(mergeResult.value).to.containSubset(['a', 'c'])
      expect(mergeResult.changed).to.be.true
    })
  })

})
