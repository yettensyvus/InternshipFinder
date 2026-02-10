export const ROLE = {
  STUDENT: 'STUDENT',
  RECRUITER: 'RECRUITER',
  ADMIN: 'ADMIN'
};

export const getDashboardPathForRole = (role) => {
  switch (role) {
    case ROLE.STUDENT:
      return '/student/dashboard';
    case ROLE.RECRUITER:
      return '/recruiter/dashboard';
    case ROLE.ADMIN:
      return '/admin/dashboard';
    default:
      return '/unauthorized';
  }
};

export const getProfilePathForRole = (role) => {
  switch (role) {
    case ROLE.STUDENT:
      return '/student/profile';
    case ROLE.RECRUITER:
      return '/recruiter/profile';
    case ROLE.ADMIN:
      return '/admin/profile';
    default:
      return '/unauthorized';
  }
};
