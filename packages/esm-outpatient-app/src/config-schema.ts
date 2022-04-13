import { Type } from '@openmrs/esm-framework';

export const configSchema = {
  concepts: {
    priorityConceptSetUuid: {
      _type: Type.ConceptUuid,
      _description: 'Concept set UUID for the `priority` concept',
      _default: '96105db1-abbf-48d2-8a52-a1d561fd8c90',
    },
    serviceConceptSetUuid: {
      _type: Type.ConceptUuid,
      _description: 'Concept set UUID for the `service` concept',
      _default: '330c0ec6-0ac7-4b86-9c70-29d76f0ae20a',
    },
    statusConceptSetUuid: {
      _type: Type.ConceptUuid,
      _description: 'Concept set UUID for the `status` concept',
      _default: 'c1ce590f-586a-4855-afce-e2e5b1787b45',
    },
  },
  contactAttributeType: {
    _type: Type.UUID,
    _description:
      'The Uuids of person attribute-type that captures contact information `e.g Next of kin contact details`',
    _default: [],
  },
};

export interface ConfigObject {
  concepts: {
    priorityConceptSetUuid: string;
    serviceConceptSetUuid: string;
    statusConceptSetUuid: string;
  };
  contactAttributeType: Array<string>;
}
