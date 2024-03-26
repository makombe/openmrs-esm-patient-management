import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { showModal, useLayoutType, useVisit } from '@openmrs/esm-framework';
import styles from './edit-queue-entry-visit-header.scss';
import { Edit } from '@carbon/react/icons';
import { Button, Tag } from '@carbon/react';
import { useVisitQueueEntry } from '../active-visits/active-visits-table.resource';
export type QueuePriority = 'Emergency' | 'Not Urgent' | 'Priority' | 'Urgent';
export type MappedQueuePriority = Omit<QueuePriority, 'Urgent'>;

interface EditQueueEntryProps {
  patient: fhir.Patient;
}

export const EditQueueEntryVisitHeader: React.FC<EditQueueEntryProps> = ({ patient }) => {
  const { t } = useTranslation();
  const { currentVisit } = useVisit(patient.id);
  const isTablet = useLayoutType() === 'tablet';
  const { queueEntry } = useVisitQueueEntry(patient.id, currentVisit?.uuid);
  const visitType = queueEntry?.visitType ?? '';
  const priority = queueEntry?.priority.display ?? '';
  const getServiceString = useCallback(() => {
    if (queueEntry && queueEntry.queue.service) {
      return `${t('waiting')} - ${t(queueEntry.queue?.service?.display)}`;
    } else {
      return '';
    }
  }, [queueEntry]);

  const getTagType = (priority: string) => {
    switch (priority as MappedQueuePriority) {
      case 'emergency':
        return 'red';
      case 'not urgent':
        return 'green';
      default:
        return 'gray';
    }
  };
  const launchEditQueueEntryModal = useCallback(() => {
    const dispose = showModal('edit-queue-entry-status-modal', {
      closeModal: () => dispose(),
      queueEntry,
    });
  }, [queueEntry]);

  return (
    <div>
      <div className={styles.navDivider} />
      <span className={styles.patientInfo}>{getServiceString()}</span>
      <div className={styles.navDivider} />
      <span className={styles.patientInfo}>{visitType}</span>
      <Tag className={priority ? styles.priorityTag : styles.tag} type={getTagType(priority?.toLocaleLowerCase('en'))}>
        {priority}
      </Tag>
      <Button
        className={styles.editStatusBtn}
        onClick={launchEditQueueEntryModal}
        size={isTablet ? 'sm' : 'md'}
        iconDescription={t('movePatientToNextService', 'Move patient to next service')}
        renderIcon={(props) => <Edit className={styles.editStatusIcon} size={16} {...props} />}>
        {isTablet ? t('movePatient', 'Move patient') : t('movePatientToNextService', 'Move patient to next service')}
      </Button>
    </div>
  );
};
export default EditQueueEntryVisitHeader;
