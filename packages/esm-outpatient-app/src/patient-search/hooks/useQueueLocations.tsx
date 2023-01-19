import useSWRImmutable from 'swr/immutable';
import useSWR from 'swr';
import { fhirBaseUrl, FetchResponse, openmrsFetch, reportError } from '@openmrs/esm-framework';
import { useMemo } from 'react';
import { LocationEntry, LocationResponse } from '../../types';

interface LoginLocationData {
  locationData: Array<LocationEntry>;
  isLoading: boolean;
}
interface FHIRResponse {
  entry: Array<{ resource: fhir.Location }>;
  total: number;
  type: string;
  resourceType: string;
}

// const useQueueLocations = () => {
//   const apiUrl = `${fhirBaseUrl}/Location?_summary=data&_tag=queue location`;
//   const { data, isValidating, error } = useSWRImmutable<FetchResponse<LocationResponse>,Error>(apiUrl, openmrsFetch);

//   if (error) {
//     console.error(error);
//     reportError(error);
//   }

//   const memoizedLocationData = useMemo(() => {
//     return {
//       locationData: data ? [].concat(...data?.map((resp) => resp?.data?.entry ?? [])) : null,
//       isLoading: !data && !error,
//       loadingNewData: isValidating,
//     };
//   }, [data, error, isValidating]);

//   return memoizedLocationData;
// };
export function useQueueLocations() {
  const apiUrl = `${fhirBaseUrl}/Location?_summary=data&_tag=queue location`;
  const { data, error } = useSWR<{ data: FHIRResponse }>(apiUrl, openmrsFetch);

  const queueLocations = useMemo(
    () => data?.data?.entry?.map((response) => response.resource) ?? [],
    [data?.data?.entry],
  );
  console.log('queueLocations', queueLocations.length);
  return { queueLocations: queueLocations ? queueLocations : [], isLoading: !data && !error, error };
}

//export default useQueueLocations;
