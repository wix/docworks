const {defineTags, extendDocworksMessage, docworksMergeMessage, setLogger} = require('../src/index')

describe('wix-one-of', () => {

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
        originalTitle: 'oneof',
        title: 'oneof',
        text: 'age_group - age yearOfBirth',
        value: {
          description: 'age yearOfBirth',
          name: 'age_group'
        }
    }
  )

  const makeElement = () => ({
    name: 'Message',
      labels: [],
    members: [
    {
      name: 'name',
      type: 'string',
      doc: 'is mandatory',
      optional: undefined
    },
    {
      name: 'address',
      type: 'string',
      doc: 'is optional',
      optional: true
    },
    {
      name: 'age',
      type: 'number',
      doc: 'is oneOf group 1 prop 1',
      optional: undefined
    },
    {
      name: 'yearOfBirth',
      type: ['string', 'number'],
      doc: 'is oneOf group 1 prop 2',
      optional: undefined
    }
  ],
    locations: [ { filename: 'Service.withMultipleTags.service.js' } ],
    docs: {
    summary: undefined,
      description: undefined,
      links: [],
      examples: [],
      extra: {}
  },
    extra: {}
  })

  test('should register the oneof tag', () => {
    const dictionary = makeDict()

    defineTags(dictionary)

    expect(dictionary.tags).toHaveProperty('oneof')
  })

  test('should add oneof value to doclet when tag is added', () => {
    const doclet = makeDoclet()
    const tag = makeTag()
    const dictionary = makeDict()

    defineTags(dictionary)
    dictionary.tags['oneof'].onTagged(doclet, tag)

    expect(doclet).toEqual(expect.objectContaining({
      oneof: [{members: ['age', 'yearOfBirth'], 'name': 'age_group'}]
    }))
  })

  test('should extract oneof from doclet', () => {
    const element = makeElement()
    const doclet = {oneof: [{members: ['age', 'yearOfBirth'], name: 'age_group'}]}
    const expectedValue = {extraValue: [{members: ['age', 'yearOfBirth'], name: 'age_group'}]}
    const oneOf = extendDocworksMessage(doclet, element)

    expect(oneOf).toEqual(expect.objectContaining(expectedValue))
  })

  test('should mark all oneof properties as optional', () => {
    const element = makeElement()
    const doclet = {oneof: [{members: ['age', 'yearOfBirth'], name: 'age_group'}]}

    extendDocworksMessage(doclet, element)

    const ageMember = element.members.find(m => m.name === 'age')
    const yearOfBirthMember = element.members.find(m => m.name === 'yearOfBirth')

    expect(ageMember.optional).toBeTruthy()
    expect(yearOfBirthMember.optional).toBeTruthy()
  })

  describe('merge', () => {
    test('should report no change if no oneof tag', () => {
      const mergeResult = docworksMergeMessage(undefined, undefined)

      expect(mergeResult.value).not.toBeDefined()
      expect(mergeResult.changed).toBeFalsy()
    })

    test('should report no change if oneof tag did not change', () => {
      const mergeResult = docworksMergeMessage(
        [{name: 'age_group', members: ['age', 'yearOfBirth']}],
        [{name: 'age_group', members: ['age', 'yearOfBirth']}]
      )

      expect(mergeResult.value).toEqual([{members: ['age', 'yearOfBirth'], name: 'age_group'}])
      expect(mergeResult.changed).toBeFalsy()
    })

    test('should report change if oneof tag was added', () => {
      const mergeResult = docworksMergeMessage(
        [{name: 'age_group', members: ['age', 'yearOfBirth']}],
        undefined
      )
      expect(mergeResult.value).toEqual([{members: ['age', 'yearOfBirth'], name: 'age_group'}])
      expect(mergeResult.changed).toBeTruthy()
    })

    test('should report changed if oneof tag was removed', () => {
      const mergeResult = docworksMergeMessage(
        undefined,
        [{name: 'age_group', members: ['age', 'yearOfBirth']}]
      )
      expect(mergeResult.value).not.toBeDefined()
      expect(mergeResult.changed).toBeTruthy()
    })
  })

  describe('logger', () => {
    describe('valid groups', () => {
      test('should not write to the log', () => {
        let log = []
        const logger = {
          error: (_) => log.push(_),
        }

        setLogger(logger)

        const dictionary = makeDict()
        defineTags(dictionary)

        const doclet = makeDoclet()
        const tag = makeTag()
        dictionary.tags['oneof'].onTagged(doclet, tag)

        expect(log).toHaveLength(0)

      })
    })

    describe('invalid tag', () => {
      let log = []
      beforeEach(() => {
        log = []
        const logger = {
          error: (_) => log.push(_),
        }

        setLogger(logger)
      })

      describe('when tag does not include any property name', () => {
        test('should write to the log an error message', () => {
          const doclet = makeDoclet()
          const tag = makeTag()
          const dictionary = makeDict()

          delete tag.value.description

          defineTags(dictionary)
          dictionary.tags['oneof'].onTagged(doclet, tag)

          expect(log).toEqual(expect.arrayContaining(['oneof group age_group must include description with list of properties names']))

        })
      })

      describe('when 2 tags include duplicated properties in different groups', () => {
        test('should write to the log an error message', () => {
          const doclet = makeDoclet()
          const tag = makeTag()
          const dictionary = makeDict()

          defineTags(dictionary)
          dictionary.tags['oneof'].onTagged(doclet, tag)
          dictionary.tags['oneof'].onTagged(doclet, tag)

          expect(log).toEqual(expect.arrayContaining(['Members age,yearOfBirth mark as oneOf for two different groups - age_group & age_group']))

        })
      })

      describe('when tag include non existing property name', () => {
        test('should write to the log an error message', () => {
          const tag = {
            originalTitle: 'oneof',
            title: 'oneof',
            text: 'age_group - age unknownProperty',
            value: {
              description: 'age unknownProperty',
              name: 'age_group'
            }
          }
          const doclet = makeDoclet()
          const dictionary = makeDict()
          const element = makeElement()

          defineTags(dictionary)
          dictionary.tags['oneof'].onTagged(doclet, tag)
          extendDocworksMessage(doclet, element)

          expect(log).toEqual(expect.arrayContaining(['oneof group age_group contains non existing property unknownProperty']))

        })
      })
    })
  })
})
