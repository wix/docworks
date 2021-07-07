import runJsDoc from '../lib/jsdoc-runner'
import {dump} from '../lib/util'
import chai from 'chai'
import chaiSubset from 'chai-subset'
import './test-util'
const expect = chai.expect
chai.use(chaiSubset)

describe('docs', function() {
  describe('on class', function() {
    let jsDocRes
    beforeEach(() => {
      jsDocRes = runJsDoc({
        'include': [
          'test/service-classdesc.js'
        ]
      })
    })

    afterEach(function(){
      if (this.currentTest.state === 'failed') {
        // eslint-disable-next-line no-console
        console.log('the jsDocRes:')
        dump(jsDocRes)
      }
    })


    it('should support the @classdesc annotation as a description', function() {

      expect(jsDocRes).to.containSubset({
        services: [
          {
            name: 'ServiceClassDesc',
            location: {filename: 'service-classdesc.js'},
            docs: {
              summary: 'this is a docs test service',
              description: 'this class is used to test how service docs work'
            }
          }
        ]
      })
      expect(jsDocRes.errors).to.not.containError('Property propertyWithDocs')
    })

  })
})
