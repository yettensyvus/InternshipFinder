import axios from './axios';

export const uploadPhoto = async ({ endpoint, file }) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await axios.post(endpoint, formData);
  return res.data;
};

export const uploadCV = async ({ endpoint, file }) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await axios.post(endpoint, formData);
  return res.data;
};
