import React, { useEffect, useState } from 'react';
import axios from '../services/axios';
import { useTranslation } from 'react-i18next';

const StudentDashboard = () => {
  const [message, setMessage] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    axios.get('/student/dashboard')
      .then(res => setMessage(res.data))
      .catch(() => setMessage(t('common.accessDenied')));
  }, [t]);

  return <div>{message}</div>;
};

export default StudentDashboard;
