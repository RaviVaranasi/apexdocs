import { assertEither, extendExpect } from './expect-extensions';
import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/Either';
import { apexBundleFromRawString, generateDocs } from './test-helpers';
import { ReferenceGuidePageData } from '../../shared/types';

describe('When generating the Reference Guide', () => {
  beforeAll(() => {
    extendExpect();
  });

  it('contains the correct default title by default', async () => {
    const result = await generateDocs([])();

    assertEither(result, (data) =>
      expect((data.referenceGuide as ReferenceGuidePageData).content).toContain('# Apex Reference Guide'),
    );
  });

  it('allows for the reference guide title to be configured', async () => {
    const result = await generateDocs([], { referenceGuideTitle: 'Custom Title' })();

    assertEither(result, (data) =>
      expect((data.referenceGuide as ReferenceGuidePageData).content).toContain('# Custom Title'),
    );
  });

  it('returns a reference guide with links to all other files', async () => {
    const input1 = `
      public enum MyEnum {
        VALUE1,
        VALUE2
      }
      `;

    const input2 = `
      public class MyClass {}
      `;

    const result = await generateDocs([apexBundleFromRawString(input1), apexBundleFromRawString(input2)])();
    expect(result).documentationBundleHasLength(2);

    assertEither(result, (data) =>
      expect((data.referenceGuide as ReferenceGuidePageData).content).toContain('[MyEnum](miscellaneous/MyEnum.md)'),
    );
    assertEither(result, (data) =>
      expect((data.referenceGuide as ReferenceGuidePageData).content).toContain('[MyClass](miscellaneous/MyClass.md)'),
    );
  });

  it('groups things under Miscellaneous if no group is provided', async () => {
    const input = `
      public enum MyEnum {
        VALUE1,
        VALUE2
      }
      `;

    const result = await generateDocs([apexBundleFromRawString(input)])();
    expect(result).documentationBundleHasLength(1);
    assertEither(result, (data) =>
      expect((data.referenceGuide as ReferenceGuidePageData).content).toContain('## Miscellaneous'),
    );
  });

  it('group things under the provided group', async () => {
    const input = `
      /**
        * @group MyGroup
        */
      public enum MyEnum {
        VALUE1,
        VALUE2
      }
      `;

    const result = await generateDocs([apexBundleFromRawString(input)])();
    expect(result).documentationBundleHasLength(1);
    assertEither(result, (data) =>
      expect((data.referenceGuide as ReferenceGuidePageData).content).toContain('## MyGroup'),
    );
  });

  it('displays groups in alphabetical order', async () => {
    const input1 = `
      /**
        * @group ZGroup
        */
      public enum MyEnum {
        VALUE1,
        VALUE2
      }
      `;

    const input2 = `
      /**
        * @group AGroup
        */
      public class MyClass {}
      `;

    const result = await generateDocs([apexBundleFromRawString(input1), apexBundleFromRawString(input2)])();
    expect(result).documentationBundleHasLength(2);
    pipe(
      result,
      E.map((data) => ({
        aGroupIndex: (data.referenceGuide as ReferenceGuidePageData).content.indexOf('## AGroup'),
        zGroupIndex: (data.referenceGuide as ReferenceGuidePageData).content.indexOf('## ZGroup'),
      })),
      E.match(
        () => fail('Expected data'),
        (data) => expect(data.aGroupIndex).toBeLessThan(data.zGroupIndex),
      ),
    );
  });

  it('displays references within groups in alphabetical order', async () => {
    const input1 = `
      /**
        * @group Group1
        */
      public enum MyEnum {
        VALUE1,
        VALUE2
      }
      `;

    const input2 = `
      /**
        * @group Group1
        */
      public class MyClass {}
      `;

    const result = await generateDocs([apexBundleFromRawString(input1), apexBundleFromRawString(input2)])();
    expect(result).documentationBundleHasLength(2);
    assertEither(result, (data) =>
      expect((data.referenceGuide as ReferenceGuidePageData).content).toContain('## Group1'),
    );
    assertEither(result, (data) =>
      expect((data.referenceGuide as ReferenceGuidePageData).content).toContain('MyClass'),
    );
    assertEither(result, (data) => expect((data.referenceGuide as ReferenceGuidePageData).content).toContain('MyEnum'));
  });

  it('returns a reference guide with descriptions', async () => {
    const input1 = `
      /**
        * @description This is a description
        */
      public enum MyEnum {
        VALUE1,
        VALUE2
      }
      `;

    const input2 = `
      /**
        * @description This is a description
        */
      public class MyClass {}
      `;

    const result = await generateDocs([apexBundleFromRawString(input1), apexBundleFromRawString(input2)])();
    expect(result).documentationBundleHasLength(2);
    assertEither(result, (data) =>
      expect((data.referenceGuide as ReferenceGuidePageData).content).toContain('This is a description'),
    );
  });

  it('returns a reference guide with descriptions with links to all other files', async () => {
    const input1 = `
      /**
        * @description This is a description with a {@link MyClass}
        * @group Group1
        */
      public enum MyEnum {
        VALUE1,
        VALUE2
      }
      `;

    const input2 = `
      /**
        * @group Group2
        */
      public class MyClass {}
      `;

    const result = await generateDocs([apexBundleFromRawString(input1), apexBundleFromRawString(input2)])();
    expect(result).documentationBundleHasLength(2);
    assertEither(result, (data) =>
      expect((data.referenceGuide as ReferenceGuidePageData).content).toContain('with a [MyClass](group2/MyClass.md)'),
    );
  });
});