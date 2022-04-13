import dayjs from 'dayjs';
import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';
import { FetchResponse, openmrsFetch, useConfig, Visit } from '@openmrs/esm-framework';

export type QueuePriority = 'Emergency' | 'Not Urgent' | 'Priority' | 'Urgent';
export type MappedQueuePriority = Omit<QueuePriority, 'Urgent'>;
export type QueueService = 'Clinical consultation' | 'Triage';
export type QueueStatus = 'Finished Service' | 'In Service' | 'Waiting';

interface VisitQueueEntry {
  queueEntry: VisitQueueEntry;
  uuid: string;
  visit: Visit;
}

interface VisitQueueEntry {
  display: string;
  endedAt: null;
  locationWaitingFor: string | null;
  patient: {
    uuid: string;
  };
  priority: {
    display: QueuePriority;
    uuid: string;
  };
  priorityComment: string | null;
  providerWaitingFor: null;
  queue: {
    description: string;
    display: string;
    name: string;
    service: {
      display: QueueService;
    };
    uuid: string;
  };
  startedAt: string;
  status: {
    display: QueueStatus;
    uuid: string;
  };
  uuid: string;
  visit: Visit;
}

export interface MappedVisitQueueEntry {
  id: string;
  encounters: Array<MappedEncounter>;
  endedAt: string;
  name: string;
  patientUuid: string;
  priority: MappedQueuePriority;
  priorityComment: string;
  service: QueueService;
  status: QueueStatus;
  visitStartDateTime: string;
  visitType: string;
  visitUuid: string;
  waitTime: string;
  queueUuid: string;
  priorityUUid: string;
  statusUuid: string;
}

interface UseVisitQueueEntries {
  visitQueueEntries: Array<MappedVisitQueueEntry> | null;
  isLoading: boolean;
  isError: Error;
  isValidating?: boolean;
}

interface ObsData {
  concept: {
    display: string;
    uuid: string;
  };
  value?: string | any;
  groupMembers?: Array<{
    concept: { uuid: string; display: string };
    value?: string | any;
  }>;
  obsDatetime: string;
}

interface Encounter {
  diagnoses: Array<any>;
  encounterDatetime: string;
  encounterProviders?: Array<{ provider: { person: { display: string } } }>;
  encounterType: { display: string; uuid: string };
  obs: Array<ObsData>;
  uuid: string;
  voided: boolean;
}

interface MappedEncounter extends Omit<Encounter, 'encounterType' | 'provider'> {
  encounterType: string;
  provider: string;
}

export function usePriorities() {
  const config = useConfig();
  const {
    concepts: { priorityConceptSetUuid },
  } = config;

  const apiUrl = `/ws/rest/v1/concept/${priorityConceptSetUuid}`;
  const { data } = useSWRImmutable<FetchResponse>(apiUrl, openmrsFetch);

  return {
    priorities: data ? data?.data?.setMembers?.map((setMember) => setMember?.display) : [],
  };
}

export function useServices() {
  const config = useConfig();
  const {
    concepts: { serviceConceptSetUuid },
  } = config;

  const apiUrl = `/ws/rest/v1/concept/${serviceConceptSetUuid}`;
  const { data } = useSWRImmutable<FetchResponse>(apiUrl, openmrsFetch);

  return {
    services: data ? data?.data?.setMembers?.map((setMember) => setMember?.display) : [],
  };
}

export function useStatuses() {
  const config = useConfig();
  const {
    concepts: { statusConceptSetUuid },
  } = config;

  const apiUrl = `/ws/rest/v1/concept/${statusConceptSetUuid}`;
  const { data } = useSWRImmutable<FetchResponse>(apiUrl, openmrsFetch);

  return {
    statuses: data ? data?.data?.setMembers?.map((setMember) => setMember?.display) : [],
  };
}

export function useVisitQueueEntries(): UseVisitQueueEntries {
  const apiUrl = `/ws/rest/v1/visit-queue-entry?v=full`;
  const { data, error, isValidating } = useSWR<{ data: { results: Array<VisitQueueEntry> } }, Error>(
    apiUrl,
    openmrsFetch,
  );

  const mapEncounterProperties = (encounter: Encounter): MappedEncounter => ({
    diagnoses: encounter.diagnoses,
    encounterDatetime: encounter.encounterDatetime,
    encounterType: encounter.encounterType.display,
    obs: encounter.obs,
    provider: encounter.encounterProviders[0]?.provider?.person?.display,
    uuid: encounter.uuid,
    voided: encounter.voided,
  });

  const mapVisitQueueEntryProperties = (visitQueueEntry: VisitQueueEntry): MappedVisitQueueEntry => ({
    id: visitQueueEntry.queueEntry.uuid,
    encounters: visitQueueEntry.visit?.encounters?.map(mapEncounterProperties),
    endedAt: visitQueueEntry.queueEntry.endedAt,
    name: visitQueueEntry.queueEntry.display,
    patientUuid: visitQueueEntry.queueEntry.patient.uuid,
    // Map `Urgent` to `Priority` because it's easier to distinguish between tags named
    // `Priority` and `Not Urgent` rather than `Urgent` vs `Not Urgent`
    priority:
      visitQueueEntry.queueEntry.priority.display === 'Urgent'
        ? 'Priority'
        : visitQueueEntry.queueEntry.priority.display,
    priorityComment: visitQueueEntry.queueEntry.priorityComment,
    service: visitQueueEntry.queueEntry.queue.service.display,
    status: visitQueueEntry.queueEntry.status.display,
    waitTime: visitQueueEntry.queueEntry.startedAt
      ? `${dayjs().diff(dayjs(visitQueueEntry.queueEntry.startedAt), 'minutes')}`
      : '--',
    visitStartDateTime: visitQueueEntry.visit?.visitStartDateTime,
    visitType: visitQueueEntry.visit?.visitType?.display,
    visitUuid: visitQueueEntry.visit?.uuid,
    queueUuid: visitQueueEntry?.queueEntry?.queue?.uuid,
    priorityUUid: visitQueueEntry.queueEntry?.priority?.uuid,
    statusUuid: visitQueueEntry.queueEntry?.status?.uuid,
  });

  const mappedVisitQueueEntries = data?.data?.results?.map(mapVisitQueueEntryProperties);
  console.log('mappedVisitQueueEntries: ', mappedVisitQueueEntries);

  return {
    visitQueueEntries: mappedVisitQueueEntries ? mappedVisitQueueEntries.filter((entry) => !entry.endedAt) : null,
    isLoading: !data && !error,
    isError: error,
    isValidating,
  };
}

export interface QueueEntry {
  startedAt: Date;
  status: string;
  priority: string;
  patient: string;
  priorityComment: string;
  queue: string;
}

export async function updatePatientStatus(
  visitUuid: string,
  abortController: AbortController,
  queueEntry: QueueEntry,
  entryUuid: string,
  endedAt: Date,
) {
  console.log('queueEntry', queueEntry);
  //  endPatientStatus(queueEntry.queue, abortController, entryUuid, endedAt);
  await Promise.all([endPatientStatus(queueEntry?.queue, abortController, entryUuid, endedAt)]);

  return openmrsFetch(`/ws/rest/v1/visit-queue-entry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    signal: abortController.signal,
    body: {
      visit: visitUuid,
      queueEntry: queueEntry,
    },
  });
}

async function endPatientStatus(queueUuid: string, abortController: AbortController, entryUuid: string, endedAt: Date) {
  await openmrsFetch(`/ws/rest/v1/queue/${queueUuid}/entry/${entryUuid}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    signal: abortController.signal,
    body: {
      endedAt: endedAt,
    },
  });
}
