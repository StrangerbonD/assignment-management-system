'use client';

import React from 'react';
import { AssignmentStatus, SubmissionStatus } from '../lib/types';

interface StatusBadgeProps {
  status: AssignmentStatus | SubmissionStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let badgeClass = 'badge';

  switch (status) {
    case 'Draft':
      badgeClass += ' badge-draft';
      break;
    case 'Published':
      badgeClass += ' badge-published';
      break;
    case 'Pending':
      badgeClass += ' badge-pending';
      break;
    case 'Submitted':
      badgeClass += ' badge-submitted';
      break;
    case 'Graded':
      badgeClass += ' badge-graded';
      break;
    default:
      badgeClass += ' badge-role';
  }

  return <span className={badgeClass}>{status}</span>;
};
