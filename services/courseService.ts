import { adminAuthHeaders } from './adminAuth';

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  coverUrl?: string;
  status?: 'draft' | 'published' | 'archived';
  moduleCount: number;
  isPremium?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseModule {
  id: string;
  courseId?: string;
  title: string;
  description: string;
  content: string;
  order: number;
  videoUrl?: string;
  audioUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseProgress {
  courseId: string;
  userId: string;
  completedModules: string[];
  lastAccessed?: string;
  updatedAt?: string;
}

const ADMIN_EMAIL = 'pastor.eryeza@gmail.com';

const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
};

// Admin requests authenticate with the signed-in user's Firebase ID token (see ./adminAuth).

export const listCourses = async (includeDrafts = false): Promise<Course[]> => {
  const data = await requestJson<{ courses: Course[] }>(
    `/api/courses${includeDrafts ? '?includeDrafts=true' : ''}`
  );
  return data.courses;
};

export const getCourseDetail = async (courseId: string, userId?: string) => {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return requestJson<{
    course: Course;
    modules: CourseModule[];
    progress: CourseProgress | null;
  }>(`/api/courses/${encodeURIComponent(courseId)}${query}`);
};

export const listCourseModules = async (courseId: string): Promise<CourseModule[]> => {
  const data = await requestJson<{ modules: CourseModule[] }>(
    `/api/courses/${encodeURIComponent(courseId)}/modules`
  );
  return data.modules;
};

export const completeCourseModule = async (courseId: string, moduleId: string, userId: string) => {
  return requestJson<{ progress: CourseProgress | null }>(
    `/api/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}/complete`,
    {
      method: 'POST',
      headers: await adminAuthHeaders(),
      body: JSON.stringify({ userId }),
    }
  );
};

export const publishCourse = async (course: Partial<Course> & {
  title: string;
  description: string;
}) => {
  return requestJson<{ course: Course | null }>('/api/admin/courses', {
    method: 'POST',
    headers: await adminAuthHeaders(),
    body: JSON.stringify(course),
  });
};

export const saveCourseModule = async (
  courseId: string,
  module: Pick<CourseModule, 'title' | 'description' | 'content' | 'order'> &
    Partial<Pick<CourseModule, 'id' | 'videoUrl' | 'audioUrl'>>
) => {
  return requestJson<{ module: CourseModule | null }>(
    `/api/admin/courses/${encodeURIComponent(courseId)}/modules`,
    {
      method: 'POST',
      headers: await adminAuthHeaders(),
      body: JSON.stringify(module),
    }
  );
};

export const deleteCourseModule = async (courseId: string, moduleId: string): Promise<void> => {
  await requestJson<{ ok: true }>(
    `/api/admin/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}`,
    {
      method: 'DELETE',
      headers: await adminAuthHeaders(),
    }
  );
};
