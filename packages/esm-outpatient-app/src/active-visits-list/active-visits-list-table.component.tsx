import React, { useMemo, useEffect, useState, useCallback } from 'react';
import {
  DataTable,
  DataTableSkeleton,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableExpandRow,
  TableExpandHeader,
  ContentSwitcher,
  Switch,
  Button,
  Tag,
  Tile,
  OverflowMenu,
  OverflowMenuItem,
  Search,
  SearchProps,
  InlineLoading,
} from 'carbon-components-react';
import { useLayoutType, useConfig, ConfigurableLink } from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';
import styles from './active-visits-list-table.scss';
import { ActiveVisit, useActiveVisits } from '../patient-queue-metrics/queue-metrics.resource';
import Add16 from '@carbon/icons-react/es/add/16';
import debounce from 'lodash-es/debounce';

interface ActiveVisitsListTableProps {
  isLoading?: boolean;
  isFetching?: boolean;
  search?: {
    onSearch(searchTerm: string): any;
    placeHolder: string;
    currentSearchTerm?: string;
    otherSearchProps?: SearchProps;
  };
}

const ActiveVisitsListTable: React.FC<ActiveVisitsListTableProps> = ({ isFetching, search }) => {
  const { t } = useTranslation();
  const layout = useLayoutType();
  const { data: activeVisits, isError, isLoading, isValidating } = useActiveVisits();
  const desktopView = layout === 'desktop';

  const headerData = useMemo(
    () => [
      {
        id: 0,
        header: t('name', 'Name'),
        key: 'name',
      },
      {
        id: 1,
        header: t('priority', 'Priority'),
        key: 'priority',
      },
      {
        id: 2,
        header: t('status', 'Status'),
        key: 'status',
      },
      {
        id: 3,
        header: t('waitTime', 'Wait time (mins)'),
        key: 'waitTime',
      },
    ],
    [t],
  );

  const handleSearch = useMemo(() => debounce((searchTerm) => search.onSearch(searchTerm), 300), []);
  // const otherSearchProps = useMemo(() => search.otherSearchProps || {}, [search]);

  if (isLoading) {
    return <DataTableSkeleton role="progressbar" />;
  }
  if (activeVisits?.length) {
    return (
      <div className={styles.activeVisitsListContainer}>
        <div className={styles.activeVisitsListHeaderContainer}>
          <label className={styles.productiveHeading03}>{t('activeVisits', 'Active visits')}</label>
          <div className={styles.switcherContainer}>
            <label className={styles.contentSwitcherLabel}>{t('view', 'View:')} </label>
            <ContentSwitcher onChange={() => {}} style={{ marginLeft: '1rem' }}>
              <Switch className={styles.switch} name={'first'} text={t('default', 'Default')} />
              <Switch className={styles.switch} name={'second'} text={t('large', 'Large')} />
            </ContentSwitcher>
          </div>
          <Button
            size="small"
            kind="secondary"
            renderIcon={Add16}
            iconDescription={t('addPatientList', 'Add patient to list')}>
            {t('addPatientList', 'Add patient to list')}
          </Button>
        </div>

        <div id="queue-visit-table-tool-bar" className={styles.searchContainer}>
          <div>{isFetching && <InlineLoading />}</div>
          <div>
            <Search
              id="patient-list-search"
              placeholder="search this list"
              labelText=""
              size={desktopView ? 'sm' : 'xl'}
              className={styles.searchOverrides}
              light
              onChange={(evnt) => handleSearch(evnt.target.value)}
              defaultValue=""
              // {...otherSearchProps}
            />
          </div>
        </div>
        <DataTable rows={activeVisits} headers={headerData} isSortable>
          {({ rows, headers, getHeaderProps, getTableProps, getBatchActionProps, getRowProps }) => (
            <TableContainer title="" className={styles.tableContainer}>
              <Table className={styles.activeVisitsTable} {...getTableProps()} size={desktopView ? 'short' : 'normal'}>
                <TableHead>
                  <TableRow>
                    <TableExpandHeader />
                    {headers.map((header) => (
                      <TableHeader {...getHeaderProps({ header })}>{header.header}</TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, index) => (
                    <React.Fragment key={index}>
                      <TableExpandRow {...getRowProps({ row })}>
                        {row.cells.map((cell) => (
                          <TableCell key={cell.id}>
                            {cell.info.header === 'priority' && cell.value === 'Emergency' ? (
                              <Tag className={styles.tag} type="magenta">
                                {cell.value}
                              </Tag>
                            ) : cell.info.header === 'priority' && cell.value === 'Not urgent' ? (
                              <Tag className={styles.tag} type="green">
                                {cell.value}
                              </Tag>
                            ) : cell.info.header === 'priority' && cell.value === 'Priority' ? (
                              <Tag className={styles.priorityTag}>{cell.value}</Tag>
                            ) : cell.info.header === 'name' ? (
                              <ConfigurableLink to={`\${openmrsSpaBase}/patient/chart/`}>{cell.value}</ConfigurableLink>
                            ) : cell.info.header === 'waitTime' ? (
                              <>
                                <div className={styles.tableOverflowmenu}>
                                  {cell.value}
                                  <OverflowMenu>
                                    <OverflowMenuItem itemText={''} />
                                  </OverflowMenu>
                                </div>
                              </>
                            ) : (
                              cell.value
                            )}
                          </TableCell>
                        ))}
                      </TableExpandRow>
                      {row.isExpanded && (
                        <TableRow className={styles.expandedActiveVisitRow}>
                          <th colSpan={headers.length + 2}></th>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
      </div>
    );
  }
  return (
    <div className={styles.activeVisitsListContainer}>
      <Tile light className={styles.tile}>
        <div className={styles.productiveHeading03}>
          <h4>{t('activeVisits', 'Active Visits')}</h4>
        </div>
        <p className={styles.content}>{t('noPatientToDisplay', 'No patient to display')}</p>
      </Tile>
    </div>
  );
};

export default ActiveVisitsListTable;
