const {defineTags, extendDocworksService, docworksMergeService} = require('../src/index')

describe('wix-queryable', () => {

  const makeDict = () => ({
      tags: {},
      defineTag: function (name, tag) {
        this.tags[name] = tag
      }
    }
  )

  const makeDoclet = () => ({
      meta: {
        filename: 'source-file.js'
      }
    }
  )

  const makeTag = () => ({
      originalTitle: 'queryable',
      title: 'queryable',
      text: ''
    }
  )

  test('should register the queryable tag', () => {
    const dictionary = makeDict()

    defineTags(dictionary)

    expect(dictionary.tags).toHaveProperty('queryable')
  })

  test('should add queryable value to doclet when tag is added', () => {
    const dictionary = makeDict()
    defineTags(dictionary)

    const doclet = makeDoclet()
    const tag = makeTag()
    dictionary.tags['queryable'].onTagged(doclet, tag)

    expect(doclet).toEqual(expect.objectContaining({
      queryable: true
    }))
  })

  test('should extract queryable from doclet', () => {
    const queryable = extendDocworksService({queryable: true})
    expect(queryable).toEqual(expect.objectContaining({extraValue: true}))
  })

  describe('merge', () => {
    test('should report no change if no queryable tag', () => {
      const mergeResult = docworksMergeService(undefined, undefined)
      expect(mergeResult.value).not.toBeDefined()
      expect(mergeResult.changed).toBeFalsy()
    })

    test('should report no change if queryable tag did not change', () => {
      const mergeResult = docworksMergeService(true, true)
      expect(mergeResult.value).toEqual(true)
      expect(mergeResult.changed).toBeFalsy()
    })

    test('should report change if queryable tag was added', () => {
      const mergeResult = docworksMergeService(true, undefined)
      expect(mergeResult.value).toEqual(true)
      expect(mergeResult.changed).toBeTruthy()
    })

    test('should report changed if queryable tag was removed', () => {
      const mergeResult = docworksMergeService(undefined, true)
      expect(mergeResult.value).not.toBeDefined()
      expect(mergeResult.changed).toBeTruthy()
    })
  })
})
