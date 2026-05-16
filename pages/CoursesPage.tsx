import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { SparklesIcon, PlayIcon, CheckIcon } from '../components/icons';
import { listCourses, type Course } from '../services/courseService';

const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const fetchedCourses = await listCourses();
        setCourses(fetchedCourses);
      } catch (error) {
        console.error('Failed to fetch courses', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-brand-text-primary mb-4">Courses</h1>
        <p className="text-xl text-brand-text-secondary">
          Dive deep into structured formation paths designed to transform your spiritual life.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card 
              key={course.id} 
              onClick={() => navigate(`/app/courses/${course.id}`)}
              className="flex flex-col border-brand-border bg-brand-dark/30 overflow-hidden p-0 group cursor-pointer hover:border-brand-accent/50 transition-colors"
            >
              <div className="relative h-48 w-full bg-brand-secondary flex items-center justify-center overflow-hidden">
                {course.coverUrl ? (
                  <img src={course.coverUrl} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
                ) : (
                  <SparklesIcon className="w-16 h-16 text-brand-text-secondary/50" />
                )}
                <div className="absolute top-4 right-4 bg-brand-dark/80 backdrop-blur-sm px-3 py-1 rounded-full border border-brand-border/50 text-xs font-bold text-brand-text-primary">
                  {course.moduleCount || 0} Modules
                </div>
              </div>
              
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-brand-text-primary mb-2 line-clamp-2 group-hover:text-brand-accent transition-colors">{course.title}</h3>
                <p className="text-brand-text-secondary text-sm mb-4">By {course.instructor || 'Guest Instructor'}</p>
                <p className="text-brand-text-secondary text-sm mb-6 flex-1 line-clamp-3">
                  {course.description}
                </p>
                
                <div className="mt-auto pt-4 border-t border-brand-border flex items-center justify-between">
                  {course.isPremium ? (
                    <span className="text-xs font-bold text-brand-accent uppercase tracking-wider">Premium</span>
                  ) : (
                    <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Free</span>
                  )}
                  <button className="flex items-center text-sm font-bold text-brand-text-primary hover:text-brand-accent transition-colors">
                    Start Course <PlayIcon className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-20 border-brand-border border-dashed bg-transparent">
          <SparklesIcon className="w-12 h-12 text-brand-text-secondary mx-auto mb-4" />
          <h3 className="text-xl font-bold text-brand-text-primary mb-2">No courses available yet</h3>
          <p className="text-brand-text-secondary">
            We are currently preparing our course catalog. Check back soon!
          </p>
        </Card>
      )}
    </div>
  );
};

export default CoursesPage;
