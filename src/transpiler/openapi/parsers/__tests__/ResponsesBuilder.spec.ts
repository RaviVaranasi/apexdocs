import { ResponsesBuilder } from '../ResponsesBuilder';
import { Reference } from '../ReferenceBuilder';
import { ApexDocHttpResponse } from '../../../../model/openapi/apex-doc-types';

jest.mock('../ReferenceBuilder', () => {
  return {
    ReferenceBuilder: jest.fn().mockImplementation(() => {
      return {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        build: (): Reference => {
          return {
            referencedClass: 'MySampleClass',
            referenceObject: {
              $ref: '/mySampleClass',
            },
            schema: {
              type: 'string',
            },
          };
        },
      };
    }),
  };
});

it('should build a ResponseObject based on the received schema', function () {
  const apexDocResponse: ApexDocHttpResponse = {
    statusCode: 200,
    schema: {
      type: 'string',
    },
  };

  const response = new ResponsesBuilder().build(apexDocResponse);

  expect(response.reference).toBeUndefined();
  expect(response.response.description).toContain('200');
  expect(response.response.content).toHaveProperty('application/json');
  expect(response.response.content!['application/json'].schema).toBe(apexDocResponse.schema);
});

it('should build a ResponseObject with a reference', function () {
  const apexDocResponse: ApexDocHttpResponse = {
    statusCode: 200,
    schema: 'SomeClass',
  };

  const response = new ResponsesBuilder().build(apexDocResponse);

  expect(response.reference).not.toBeUndefined();
});
