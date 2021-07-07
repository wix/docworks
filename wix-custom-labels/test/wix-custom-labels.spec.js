const {defineTags, extendDocworksService, docworksMergeService} = require('../src/index')
describe('wix-custom-labels', function() {

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
      value: 'maturity-preview'
    }
  }

  it('should register the custom-labels tag', function() {
    let dictionary = makeDict()
    defineTags(dictionary)
    expect(dictionary.tags).toHaveProperty('customlabels')
  })

  it('should copy custom-labels from tag to doclet', function() {
    let dictionary = makeDict()
    defineTags(dictionary)

    let doclet = makeDoclet()
    let tag = makeTag()
    dictionary.tags['customlabels'].onTagged(doclet, tag)

    expect(doclet).toEqual(expect.objectContaining({
      customLabels:
        [{id: 'maturity-preview'}]
    }))
  })

  it('should extract custom labels from doclet', function() {
    let customLabels = extendDocworksService({customLabels: [{id: 'a'}, {id: 'b'}]})
    expect(customLabels).toEqual(expect.objectContaining({
      extraValue: [{id: 'a'},{id: 'b'}]
    }))

  })

  describe('merge', function() {
    it('should report no change if no custom-labels was added', function() {
      let mergeResult = docworksMergeService(undefined, undefined)
      expect(mergeResult.value).toBeUndefined()
      expect(mergeResult.changed).toBe(false)
    })

    it('should report no change if custom-labels did not change', function() {
      let mergeResult = docworksMergeService({customLabels: [{id: 'a'}, {id: 'b'}]},{customLabels: [{id: 'a'}, {id: 'b'}]})
      expect(mergeResult.value).toEqual(expect.objectContaining({customLabels: [{id: 'a'},{id: 'b'}]}))
      expect(mergeResult.changed).toBe(false)
    })

    it('should report change if custom-labels added', function() {
      let mergeResult = docworksMergeService({customLabels: [{id: 'a'}, {id: 'b'}]}, undefined)
      expect(mergeResult.value).toEqual(expect.objectContaining({customLabels: [{id: 'a'}, {id: 'b'}]}))
      expect(mergeResult.changed).toBe(true)
    })

    it('should report changed if custom-labels removed', function() {
      let mergeResult = docworksMergeService(undefined, {customLabels: [{id: 'a'}, {id: 'b'}]})
      expect(mergeResult.value).toBeUndefined()
      expect(mergeResult.changed).toBe(true)
    })

    it('should report change if custom-labels changed', function() {
      let mergeResult = docworksMergeService({customLabels: [{id: 'a'}, {id: 'c'}]}, {customLabels: [{id: 'a'}, {id: 'b'}]})
      expect(mergeResult.value).toEqual(expect.objectContaining({customLabels: [{id: 'a'}, {id: 'c'}]}))
      expect(mergeResult.changed).toBe(true)
    })
  })

})
