import chai from 'chai'
import chaiSubset from 'chai-subset'
const expect = chai.expect
chai.use(chaiSubset)

import {defineTags, extendDocworksService, docworksMergeService} from '../src/index'

describe('wix-event-type', function() {

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
      originalTitle: 'eventtype',
      title: 'eventtype',
      text: 'a value',
      value: 'a value'
    }
  }

  it('should register the snippet tag', function() {
    let dictionary = makeDict()

    defineTags(dictionary)

    expect(dictionary.tags).to.have.key('eventtype')
  })

  it('should copy event type from tag to doclet', function() {
    let dictionary = makeDict()
    defineTags(dictionary)

    let doclet = makeDoclet()
    let tag = makeTag()
    dictionary.tags['eventtype'].onTagged(doclet, tag)

    expect(doclet).to.containSubset({
      eventType: 'a value'
    })
  })

  it('should extract event types from doclet', function() {
    let eventType = extendDocworksService({eventType: 'onClick'})
    expect(eventType).to.containSubset({extraValue: 'onClick'})
  })

  describe('merge', function() {
    it('should report no change if no event types', function() {
      let mergeResult = docworksMergeService(undefined, undefined)
      expect(mergeResult.value).to.be.undefined
      expect(mergeResult.changed).to.be.false
    })

    it('should report no change if event types did not change', function() {
      let mergeResult = docworksMergeService('onClick', 'onClick')
      expect(mergeResult.value).to.containSubset('onClick')
      expect(mergeResult.changed).to.be.false
    })

    it('should report change if event types added', function() {
      let mergeResult = docworksMergeService('onClick', undefined)
      expect(mergeResult.value).to.containSubset('onClick')
      expect(mergeResult.changed).to.be.true
    })

    it('should report changed if event types removed', function() {
      let mergeResult = docworksMergeService(undefined, 'onClick')
      expect(mergeResult.value).to.be.undefined
      expect(mergeResult.changed).to.be.true
    })

    it('should report change event types changed', function() {
      let mergeResult = docworksMergeService('onClick', 'onDblClick')
      expect(mergeResult.value).to.containSubset('onClick')
      expect(mergeResult.changed).to.be.true
    })
  })

})
