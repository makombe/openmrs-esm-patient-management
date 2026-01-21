import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DataTableSkeleton } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { useActiveTickets } from './useActiveTickets';
import { useServiceQueuesStore } from '../store/store';
import PatientQueueHeader from '../patient-queue-header/patient-queue-header.component';
import styles from './queue-screen.scss';

interface QueueScreenProps {}

const QueueScreen: React.FC<QueueScreenProps> = () => {
  const { t, i18n } = useTranslation();
  const { selectedQueueLocationUuid } = useServiceQueuesStore();

  const { activeTickets, isLoading, error, mutate } = useActiveTickets(selectedQueueLocationUuid);
  const speaker = window.speechSynthesis;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const rowData = useMemo(
    () =>
      activeTickets.map((ticket, index) => ({
        id: `${index}`,
        room: ticket.room,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
      })),
    [activeTickets],
  );

  const readTicket = useCallback(
    (queue) => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const message = new SpeechSynthesisUtterance();
        const [prefix, suffix] = queue.ticketNumber.split('-');
        // const utterance = `Ticket Number: ${prefix.split('')}, - ${suffix.split('')}, Please Proceed To Room, ${queue.room}`;
        const utterance = t(
          'ticketAnnouncement',
          'Ticket number: {{prefix}}, - {{suffix}}, please proceed to room {{room}}',
          {
            prefix: prefix.split(''),
            suffix: suffix.split(''),
            room: queue.room,
          },
        );
        message.rate = 1;
        message.pitch = 1;
        message.text = utterance;
        message.lang = i18n.language;
        return new Promise<void>((resolve) => {
          message.onend = () => resolve();
          window.speechSynthesis.speak(message);
        });
      }
      return Promise.resolve();
    },
    [t, i18n.language],
  );

  useEffect(() => {
    const ticketsToCallOut = activeTickets.filter((item) => item.status == 'calling');
    if (ticketsToCallOut.length > 0 && !isSpeaking) {
      setIsSpeaking(true);
      const readTickets = async () => {
        for (const ticket of ticketsToCallOut) {
          await readTicket(ticket);
        }
        setIsSpeaking(false);
        mutate?.();
      };

      readTickets();
    }

    return () => {};
  }, [activeTickets, isSpeaking, t, i18n.language, readTicket, mutate]);

  if (isLoading) {
    return <DataTableSkeleton row={5} className={styles.queueScreen} role="progressbar" />;
  }

  if (error) {
    return <div>Error</div>;
  }

  return (
    <div>
      <PatientQueueHeader title={t('queueScreen', 'Queue screen')} showFilters />
      <div className={styles.gridFlow}>
        {rowData.map((row) => (
          <div className={styles.card} key={row.id}>
            <p className={styles.subHeader}>{t('ticketNumber', 'Ticket number')}</p>
            <p className={row.status === 'calling' ? styles.headerBlinking : styles.header}>{row.ticketNumber}</p>
            <p className={styles.subHeader}>
              {t('room', 'Room')} &nbsp; : &nbsp; {row.room}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QueueScreen;
